import { Injectable, NotFoundException, BadRequestException, HttpException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ColorsService } from '../colors/colors.service';
import { SizesService } from '../sizes/sizes.service';
import { Color } from '../colors/entities/color.entity';
import { Size } from '../sizes/entities/size.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private colorsService: ColorsService,
    private sizesService: SizesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Validate business rules
      this.validateProduct(createProductDto);

      // Check slug uniqueness
      const existingSlug = await this.productsRepository.findOne({
        where: { slug: createProductDto.slug },
      });
      if (existingSlug) {
        throw new BadRequestException(`Slug "${createProductDto.slug}" already exists`);
      }

      // Check SKU uniqueness
      if (createProductDto.sku) {
        const existingSku = await this.productsRepository.findOne({
          where: { sku: createProductDto.sku },
        });
        if (existingSku) {
          throw new BadRequestException(`SKU "${createProductDto.sku}" already exists`);
        }
      }

      const product = this.productsRepository.create(createProductDto);
      const savedProduct = await this.productsRepository.save(product);
      return await this.enrichProductVariants(savedProduct);
    } catch (err) {
      // Map unexpected errors to meaningful HTTP responses
      this.handleError(err, 'Unable to create product');
    }
  }

  async findAll(query: QueryProductDto): Promise<{ data: Product[]; meta: any }> {
    try {
      const { page = 1, limit = 20, category_id, status, is_featured, search, sort_by = 'created_at', sort_order = 'DESC' } = query;

      const skip = (page - 1) * limit;

      // Validate sort_by to prevent SQL injection
      const allowedSortFields = ['created_at', 'updated_at', 'name', 'price', 'status'];
      const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
      const validSortOrder = sort_order === 'ASC' || sort_order === 'DESC' ? sort_order : 'DESC';

      const queryBuilder = this.productsRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .where('product.deleted_at IS NULL');

      // Filters
      if (status) {
        queryBuilder.andWhere('product.status = :status', { status });
      }

      if (category_id) {
        queryBuilder.andWhere('product.category_id = :category_id', { category_id });
      }

      if (is_featured !== undefined) {
        queryBuilder.andWhere('product.is_featured = :is_featured', { is_featured });
      }

      // Search
      if (search) {
        queryBuilder.andWhere(
          '(product.name ILIKE :search OR product.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Sorting - use validated values
      queryBuilder.orderBy(`product.${validSortBy}`, validSortOrder);

      // Pagination
      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      // Enrich variants with full color and size objects
      const enrichedData = await Promise.all(
        data.map(product => this.enrichProductVariants(product))
      );

      return {
        data: enrichedData,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      this.handleError(err, 'Invalid filters or query parameters');
    }
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    return await this.enrichProductVariants(product);
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { slug },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return await this.enrichProductVariants(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const product = await this.findOne(id);

      // Validate business rules
      if (Object.keys(updateProductDto).length > 0) {
        this.validateProduct(updateProductDto);
      }

      // Check slug uniqueness if changing
      if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
        const existingSlug = await this.productsRepository.findOne({
          where: { slug: updateProductDto.slug },
        });
        if (existingSlug) {
          throw new BadRequestException(`Slug "${updateProductDto.slug}" already exists`);
        }
      }

      // Check SKU uniqueness if provided (non-variant mode only)
      if (updateProductDto.sku) {
        const existingSku = await this.productsRepository.findOne({ where: { sku: updateProductDto.sku } });
        if (existingSku && existingSku.id !== id) {
          throw new BadRequestException(`SKU "${updateProductDto.sku}" already exists`);
        }
      }

      Object.assign(product, updateProductDto);
      const savedProduct = await this.productsRepository.save(product);
      return await this.enrichProductVariants(savedProduct);
    } catch (err) {
      this.handleError(err, 'Unable to update product');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const product = await this.findOne(id);
      await this.productsRepository.softDelete(id);
    } catch (err) {
      this.handleError(err, 'Unable to delete product');
    }
  }

  async getTotalStock(id: string): Promise<number> {
    const product = await this.findOne(id);

    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    }

    return product.stock_quantity || 0;
  }

  async updateVariantStock(id: string, sku: string, newStock: number): Promise<Product> {
    try {
      const product = await this.findOne(id);

      if (!product.variants || product.variants.length === 0) {
        throw new BadRequestException('Product has no variants');
      }

      const variantIndex = product.variants.findIndex(v => v.sku === sku);
      if (variantIndex === -1) {
        throw new NotFoundException(`Variant with SKU "${sku}" not found`);
      }

      if (newStock < 0) {
        throw new BadRequestException('Stock cannot be negative');
      }

      product.variants[variantIndex].stock = newStock;
      const savedProduct = await this.productsRepository.save(product);
      return await this.enrichProductVariants(savedProduct);
    } catch (err) {
      this.handleError(err, 'Unable to update variant stock');
    }
  }

  async search(keyword: string, limit: number = 20): Promise<Product[]> {
    try {
      const products = await this.productsRepository
        .createQueryBuilder('product')
        .where('product.deleted_at IS NULL')
        .andWhere('product.status = :status', { status: 'active' })
        .andWhere(
          '(product.name ILIKE :keyword OR product.description ILIKE :keyword)',
          { keyword: `%${keyword}%` }
        )
        .take(limit)
        .getMany();
      
      // Enrich variants with full color and size objects
      return await Promise.all(
        products.map(product => this.enrichProductVariants(product))
      );
    } catch (err) {
      this.handleError(err, 'Unable to search products');
    }
  }

  /**
   * Enrich product variants with full color and size objects instead of just IDs
   */
  private async enrichProductVariants(product: Product): Promise<Product> {
    if (!product.variants || product.variants.length === 0) {
      return product;
    }

    // Collect all unique color_ids and size_ids
    const colorIds = [...new Set(product.variants.map(v => v.color_id).filter(Boolean))];
    const sizeIds = [...new Set(product.variants.map(v => v.size_id).filter(Boolean))];

    // Fetch all colors and sizes in parallel
    const [colors, sizes] = await Promise.all([
      Promise.all(colorIds.map(id => this.colorsService.findOne(id).catch(() => null))),
      Promise.all(sizeIds.map(id => this.sizesService.findOne(id).catch(() => null))),
    ]);

    // Create maps for quick lookup
    const colorMap = new Map<string, Color>();
    const sizeMap = new Map<string, Size>();
    
    colors.forEach(color => {
      if (color) colorMap.set(color.id, color);
    });
    
    sizes.forEach(size => {
      if (size) sizeMap.set(size.id, size);
    });

    // Enrich variants
    const enrichedVariants = product.variants.map(variant => {
      const enriched: any = { ...variant };
      
      if (variant.color_id && colorMap.has(variant.color_id)) {
        enriched.color = colorMap.get(variant.color_id);
      }
      
      if (variant.size_id && sizeMap.has(variant.size_id)) {
        enriched.size = sizeMap.get(variant.size_id);
      }
      
      return enriched;
    });

    // Return product with enriched variants
    return {
      ...product,
      variants: enrichedVariants,
    } as Product;
  }

  private validateProduct(productDto: Partial<CreateProductDto>): void {
    // Validate sale_price <= price
    if (productDto.sale_price && productDto.price && productDto.sale_price > productDto.price) {
      throw new BadRequestException('Sale price cannot be greater than regular price');
    }

    // Validate variants vs stock_quantity logic
    if (productDto.variants && productDto.variants.length > 0) {
      if (productDto.stock_quantity && productDto.stock_quantity > 0) {
        throw new BadRequestException('Product with variants should not have stock_quantity set');
      }
      if (productDto.sku) {
        throw new BadRequestException('Product with variants should not have SKU set');
      }
    }
  }

  private handleError(err: any, fallbackMessage: string): never {
    if (err instanceof HttpException) {
      throw err;
    }

    // Log the actual error for debugging
    this.logger.error(`Error details: ${err?.message || err}`, err?.stack);

    // Attempt to map common database error codes (e.g., Postgres)
    const code = (err && (err as any).code) || undefined;
    const detail: string | undefined = (err && (err as any).detail) || (err && (err as any).message);
    const constraint: string | undefined = (err && (err as any).constraint) || undefined;
    
    if (code === '23505') {
      // unique_violation
      // Provide more specific messages when possible
      if (constraint?.includes('products_slug_key') || detail?.toLowerCase().includes('slug')) {
        throw new ConflictException('Slug already exists');
      }
      if (constraint?.includes('products_sku_key') || detail?.toLowerCase().includes('sku')) {
        throw new ConflictException('SKU already exists');
      }
      throw new ConflictException('Duplicate value violates unique constraint');
    }
    if (code === '23503') {
      // foreign_key_violation
      if (detail?.toLowerCase().includes('category_id')) {
        throw new BadRequestException('Invalid category_id (foreign key not found)');
      }
      throw new BadRequestException('Invalid or missing related resource');
    }
    if (code === '22P02') {
      // invalid_text_representation (e.g., invalid UUID)
      throw new BadRequestException('Invalid input syntax');
    }
    if (code === '42703') {
      // undefined_column - column doesn't exist
      throw new BadRequestException(`Invalid sort field: ${detail || 'unknown column'}`);
    }

    // Provide more detailed error message
    const errorMessage = err?.message ? `${fallbackMessage}: ${err.message}` : fallbackMessage;
    this.logger.error(fallbackMessage, err?.stack || err);
    throw new BadRequestException(errorMessage);
  }
}
