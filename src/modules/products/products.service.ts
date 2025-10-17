import { Injectable, NotFoundException, BadRequestException, HttpException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
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
      return await this.productsRepository.save(product);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException('Unable to create product');
    }
  }

  async findAll(query: QueryProductDto): Promise<{ data: Product[]; meta: any }> {
    try {
      const { page = 1, limit = 20, category_id, status, is_featured, search, sort_by = 'created_at', sort_order = 'DESC' } = query;

      const skip = (page - 1) * limit;

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

      // Sorting
      queryBuilder.orderBy(`product.${sort_by}`, sort_order);

      // Pagination
      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      return {
        data,
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

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { slug },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
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
      return await this.productsRepository.save(product);
    } catch (err) {
      this.handleError(err, 'Unable to update product');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const product = await this.findOne(id);
      await this.productsRepository.softDelete(id);
    } catch (err) {
      this.handleError(err, 'Unable to delete product');
    }
  }

  async getTotalStock(id: number): Promise<number> {
    const product = await this.findOne(id);

    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    }

    return product.stock_quantity || 0;
  }

  async updateVariantStock(id: number, sku: string, newStock: number): Promise<Product> {
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
      return await this.productsRepository.save(product);
    } catch (err) {
      this.handleError(err, 'Unable to update variant stock');
    }
  }

  async search(keyword: string, limit: number = 20): Promise<Product[]> {
    try {
      return await this.productsRepository
        .createQueryBuilder('product')
        .where('product.deleted_at IS NULL')
        .andWhere('product.status = :status', { status: 'active' })
        .andWhere(
          '(product.name ILIKE :keyword OR product.description ILIKE :keyword)',
          { keyword: `%${keyword}%` }
        )
        .take(limit)
        .getMany();
    } catch (err) {
      this.handleError(err, 'Unable to search products');
    }
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

    // Attempt to map common database error codes (e.g., Postgres)
    const code = (err && (err as any).code) || undefined;
    if (code === '23505') {
      // unique_violation
      throw new ConflictException('Duplicate value violates unique constraint');
    }
    if (code === '23503') {
      // foreign_key_violation
      throw new BadRequestException('Invalid or missing related resource');
    }
    if (code === '22P02') {
      // invalid_text_representation (e.g., invalid UUID)
      throw new BadRequestException('Invalid input syntax');
    }

    this.logger.error(fallbackMessage, err?.stack || err);
    throw new BadRequestException(fallbackMessage);
  }
}
