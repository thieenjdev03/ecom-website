import { Injectable, NotFoundException, BadRequestException, HttpException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product, LangObject, ProductVariant } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ColorsService } from '../colors/colors.service';
import { SizesService } from '../sizes/sizes.service';
import { Color } from '../colors/entities/color.entity';
import { Size } from '../sizes/entities/size.entity';
import { Brand } from '../brands/entities/brand.entity';
import * as sanitizeHtml from 'sanitize-html';

const PRODUCT_HTML_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's',
    'a', 'br', 'hr', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    '*': ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    private colorsService: ColorsService,
    private sizesService: SizesService,
  ) {}

  /** Ensure a brand exists before linking it to a product (null/undefined = no brand). */
  private async assertBrandExists(brandId: string | null | undefined): Promise<void> {
    if (!brandId) return;
    const exists = await this.brandsRepository.exist({ where: { id: brandId } });
    if (!exists) {
      throw new BadRequestException(`Brand with ID "${brandId}" not found`);
    }
  }

  /**
   * Validate language code to prevent SQL injection
   */
  private isValidLanguageCode(lang: string): boolean {
    // Allow only alphanumeric and underscore, max 10 chars
    return /^[a-zA-Z0-9_]{1,10}$/.test(lang);
  }

  /**
   * Get localized value with fallback to English
   * Handles both multi-language objects and plain strings (for backward compatibility)
   */
  private getLocalizedValue(field: LangObject | string | null | undefined, locale: string = 'en'): string {
    if (!field) {
      return '';
    }
    // If it's a string (backward compatibility), return as is
    if (typeof field === 'string') {
      return field;
    }
    // If it's an object (multi-language), get the localized value.
    // Dùng ?? -> || để bỏ qua chuỗi RỖNG (sản phẩm chỉ nhập 1 ngôn ngữ vẫn hiển thị được):
    // locale yêu cầu -> en -> giá trị non-empty bất kỳ.
    if (typeof field === 'object') {
      const firstNonEmpty = Object.values(field).find((v) => typeof v === 'string' && v.trim() !== '');
      return field[locale] || field['en'] || firstNonEmpty || '';
    }
    return '';
  }

  /** Chỉ cho phép HTML trình bày an toàn trong các field nội dung sản phẩm. */
  private sanitizeLocalizedHtml(field: LangObject | null | undefined): LangObject | undefined {
    if (!field) return undefined;
    return Object.fromEntries(
      Object.entries(field).map(([locale, value]) => [
        locale,
        typeof value === 'string'
          ? sanitizeHtml(value, PRODUCT_HTML_SANITIZE_OPTIONS)
          : value,
      ]),
    );
  }

  private sanitizeHtmlOutput(html: string): string {
    return sanitizeHtml(html, PRODUCT_HTML_SANITIZE_OPTIONS);
  }

  /**
   * Transform product from multi-language to single language based on locale
   */
  private transformProductForLocale(product: Product, locale: string = 'en'): any {
    const transformed: any = {
      id: product.id,
      name: this.getLocalizedValue(product.name, locale),
      slug: this.getLocalizedValue(product.slug, locale),
      description: this.sanitizeHtmlOutput(
        this.getLocalizedValue(product.description, locale),
      ),
      short_description: this.sanitizeHtmlOutput(
        this.getLocalizedValue(product.short_description, locale),
      ),
      nutrition_information: this.sanitizeHtmlOutput(
        this.getLocalizedValue(product.nutrition_information, locale),
      ),
      usage_instructions: this.sanitizeHtmlOutput(
        this.getLocalizedValue(product.nutrition_information, locale),
      ),
      notes: this.sanitizeHtmlOutput(this.getLocalizedValue(product.notes, locale)),
      price: product.price,
      sale_price: product.sale_price,
      cost_price: product.cost_price,
      images: product.images,
      stock_quantity: product.stock_quantity,
      sku: product.sku,
      barcode: product.barcode,
      tags: product.tags,
      status: product.status,
      is_featured: product.is_featured,
      enable_sale_tag: product.enable_sale_tag,
      meta_title: product.meta_title ? this.getLocalizedValue(product.meta_title, locale) : null,
      meta_description: product.meta_description ? this.getLocalizedValue(product.meta_description, locale) : null,
      weight: product.weight,
      dimensions: product.dimensions,
      created_at: product.created_at,
      updated_at: product.updated_at,
      collections: (product.productCollections ?? [])
        .filter((productCollection) => productCollection.collection)
        .map((productCollection) => ({
          id: productCollection.collection.id,
          name: productCollection.collection.name,
          slug: productCollection.collection.slug,
        })),
      // Brand names are not localized (they're proper nouns), so no getLocalizedValue here.
      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            slug: product.brand.slug,
            logo_url: product.brand.logo_url ?? null,
          }
        : null,
    };

    // Transform category if exists
    if (product.category) {
      transformed.category = {
        id: product.category.id,
        name: this.getLocalizedValue(product.category.name as any, locale),
        slug: this.getLocalizedValue(product.category.slug as any, locale),
      };
    }

    // Transform variants if exists
    if (product.variants && product.variants.length > 0) {
      transformed.variants = product.variants.map((variant: ProductVariant) => {
        const transformedVariant: any = {
          ...variant,
          name: this.getLocalizedValue(variant.name, locale),
        };

        // Transform color if exists
        if (variant.color_id && (product as any).variants) {
          const variantWithColor = (product as any).variants.find((v: any) => v.sku === variant.sku);
          if (variantWithColor?.color) {
            transformedVariant.color = {
              id: variantWithColor.color.id,
              name: this.getLocalizedValue(variantWithColor.color.name as any, locale),
              hexCode: variantWithColor.color.hexCode,
              imageUrl: variantWithColor.color.imageUrl || null,
            };
          }
        }

        // Transform size if exists
        if (variant.size_id && (product as any).variants) {
          const variantWithSize = (product as any).variants.find((v: any) => v.sku === variant.sku);
          if (variantWithSize?.size) {
            transformedVariant.size = {
              id: variantWithSize.size.id,
              name: this.getLocalizedValue(variantWithSize.size.name as any, locale),
            };
          }
        }

        return transformedVariant;
      });
    }

    return transformed;
  }

  async create(createProductDto: CreateProductDto, locale: string = 'en'): Promise<any> {
    try {
      // Validate business rules
      this.validateProduct(createProductDto);

      // Check slug uniqueness - check all language slugs using JSONB operators
      const slugKeys = Object.keys(createProductDto.slug);
      for (const lang of slugKeys) {
        if (!this.isValidLanguageCode(lang)) {
          throw new BadRequestException(`Invalid language code: "${lang}"`);
        }
        const slugValue = createProductDto.slug[lang];
        if (slugValue) {
          const existingSlug = await this.productsRepository
            .createQueryBuilder('product')
            .where(`product.slug->>'${lang}' = :slugValue`, { slugValue })
            .getOne();
          if (existingSlug) {
            throw new BadRequestException(`Slug "${slugValue}" for language "${lang}" already exists`);
          }
        }
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

      // Validate brand exists before linking
      await this.assertBrandExists(createProductDto.brand_id);

      const { usage_instructions, ...createDtoWithoutUsageAlias } = createProductDto;
      const sanitizedDto = {
        ...createDtoWithoutUsageAlias,
        description: this.sanitizeLocalizedHtml(createProductDto.description),
        short_description: this.sanitizeLocalizedHtml(createProductDto.short_description),
        nutrition_information: this.sanitizeLocalizedHtml(
          usage_instructions ?? createProductDto.nutrition_information,
        ),
        notes: this.sanitizeLocalizedHtml(createProductDto.notes),
      };
      const product = this.productsRepository.create(sanitizedDto);
      const savedProduct = await this.productsRepository.save(product);
      // Reload with category + brand relations so the response includes the brand summary.
      const reloaded = await this.productsRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['category', 'brand'],
      });
      const enrichedProduct = await this.enrichProductVariants(reloaded ?? savedProduct);
      return this.transformProductForLocale(enrichedProduct, locale);
    } catch (err) {
      // Map unexpected errors to meaningful HTTP responses
      this.handleError(err, 'Unable to create product');
    }
  }

  async findAll(query: QueryProductDto): Promise<{ data: any[]; meta: any }> {
    try {
      const { page = 1, limit = 20, category_id, collection_id, brand_id, status, is_featured, search, sort_by = 'created_at', sort_order = 'DESC', locale = 'en' } = query;

      const skip = (page - 1) * limit;

      // Validate sort_by to prevent SQL injection
      const allowedSortFields = ['created_at', 'updated_at', 'name', 'price', 'status'];
      const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
      const validSortOrder = sort_order === 'ASC' || sort_order === 'DESC' ? sort_order : 'DESC';

      const queryBuilder = this.productsRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .where('product.deleted_at IS NULL');

      // Filter by collection if collection_id is provided
      if (collection_id) {
        queryBuilder
          .innerJoin('product_collections', 'pc', 'pc.product_id = product.id')
          .andWhere('pc.collection_id = :collection_id', { collection_id });
      }

      // Filters
      if (status) {
        queryBuilder.andWhere('product.status = :status', { status });
      }

      if (category_id) {
        queryBuilder.andWhere('product.category_id = :category_id', { category_id });
      }

      if (brand_id) {
        queryBuilder.andWhere('product.brand_id = :brand_id', { brand_id });
      }

      if (is_featured !== undefined) {
        queryBuilder.andWhere('product.is_featured = :is_featured', { is_featured });
      }

      // Search - search in JSONB fields
      if (search) {
        queryBuilder.andWhere(
          '(product.name::text ILIKE :search OR product.description::text ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Sorting - use validated values
      // Note: Sorting by name on JSONB is complex, so we'll sort by created_at for now
      const sortField = validSortBy === 'name' ? 'created_at' : validSortBy;
      queryBuilder.orderBy(`product.${sortField}`, validSortOrder);

      // Pagination
      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      // Enrich variants with full color and size objects
      const enrichedData = await Promise.all(
        data.map(product => this.enrichProductVariants(product))
      );

      // Transform to single language
      const transformedData = enrichedData.map(product => this.transformProductForLocale(product, locale));

      return {
        data: transformedData,
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

  async findOne(id: string, locale: string = 'en'): Promise<any> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'brand', 'productCollections', 'productCollections.collection'],
    });

    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    const enrichedProduct = await this.enrichProductVariants(product);
    return this.transformProductForLocale(enrichedProduct, locale);
  }

  async findBySlug(slug: string, locale: string = 'en'): Promise<any> {
    // Validate locale to prevent SQL injection
    if (!this.isValidLanguageCode(locale)) {
      locale = 'en';
    }
    
    // Search for slug in JSONB field using JSONB operator
    // First try to find with the specified locale, then fallback to English
    // Also exclude soft-deleted products
    let product = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.productCollections', 'productCollection')
      .leftJoinAndSelect('productCollection.collection', 'collection')
      .where('product.deleted_at IS NULL')
      .andWhere(`product.slug->>'${locale}' = :slug`, { slug })
      .getOne();

    // If not found with locale, try English as fallback
    if (!product && locale !== 'en') {
      product = await this.productsRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.productCollections', 'productCollection')
        .leftJoinAndSelect('productCollection.collection', 'collection')
        .where('product.deleted_at IS NULL')
        .andWhere(`product.slug->>'en' = :slug`, { slug })
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    const enrichedProduct = await this.enrichProductVariants(product);
    return this.transformProductForLocale(enrichedProduct, locale);
  }

  async update(id: string, updateProductDto: UpdateProductDto, locale: string = 'en'): Promise<any> {
    try {
      // Get product without transformation first
      const product = await this.productsRepository.findOne({
        where: { id },
        relations: ['category', 'brand'],
      });

      if (!product) {
        throw new NotFoundException(`Product #${id} not found`);
      }

      // Validate brand exists before linking (skip when key not sent)
      if (updateProductDto.brand_id !== undefined) {
        await this.assertBrandExists(updateProductDto.brand_id);
      }

      // Validate business rules
      if (Object.keys(updateProductDto).length > 0) {
        this.validateProduct(updateProductDto);
      }

      // Check slug uniqueness if changing - check all language slugs using JSONB operators
      if (updateProductDto.slug) {
        const slugKeys = Object.keys(updateProductDto.slug);
        for (const lang of slugKeys) {
          if (!this.isValidLanguageCode(lang)) {
            throw new BadRequestException(`Invalid language code: "${lang}"`);
          }
          const slugValue = updateProductDto.slug[lang];
          if (slugValue) {
            const existingSlug = await this.productsRepository
              .createQueryBuilder('product')
              .where('product.id != :id', { id })
              .andWhere(`product.slug->>'${lang}' = :slugValue`, { slugValue })
              .getOne();
            if (existingSlug) {
              throw new BadRequestException(`Slug "${slugValue}" for language "${lang}" already exists`);
            }
          }
        }
      }

      // Check SKU uniqueness if provided (non-variant mode only)
      if (updateProductDto.sku) {
        const existingSku = await this.productsRepository.findOne({ where: { sku: updateProductDto.sku } });
        if (existingSku && existingSku.id !== id) {
          throw new BadRequestException(`SKU "${updateProductDto.sku}" already exists`);
        }
      }

      const { usage_instructions, ...updateDtoWithoutUsageAlias } = updateProductDto;
      const sanitizedDto = {
        ...updateDtoWithoutUsageAlias,
        ...(updateProductDto.description !== undefined
          ? { description: this.sanitizeLocalizedHtml(updateProductDto.description) }
          : {}),
        ...(updateProductDto.short_description !== undefined
          ? { short_description: this.sanitizeLocalizedHtml(updateProductDto.short_description) }
          : {}),
        ...(usage_instructions !== undefined || updateProductDto.nutrition_information !== undefined
          ? {
              nutrition_information: this.sanitizeLocalizedHtml(
                usage_instructions ?? updateProductDto.nutrition_information,
              ),
            }
          : {}),
        ...(updateProductDto.notes !== undefined
          ? { notes: this.sanitizeLocalizedHtml(updateProductDto.notes) }
          : {}),
      };
      Object.assign(product, sanitizedDto);
      // The product was loaded WITH its brand relation. Assigning only brand_id leaves the
      // stale relation object in place, and TypeORM would persist that over the new FK.
      // Sync the relation explicitly so the column change actually sticks.
      if (updateProductDto.brand_id !== undefined) {
        product.brand = updateProductDto.brand_id
          ? ({ id: updateProductDto.brand_id } as Brand)
          : null;
      }
      const savedProduct = await this.productsRepository.save(product);
      // Reload so a changed brand_id reflects a fresh brand summary (not the stale relation).
      const reloaded = await this.productsRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['category', 'brand'],
      });
      const enrichedProduct = await this.enrichProductVariants(reloaded ?? savedProduct);
      return this.transformProductForLocale(enrichedProduct, locale);
    } catch (err) {
      this.handleError(err, 'Unable to update product');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const product = await this.productsRepository.findOne({
        where: { id },
      });
      if (!product) {
        throw new NotFoundException(`Product #${id} not found`);
      }
      await this.productsRepository.delete(id);
    } catch (err) {
      this.handleError(err, 'Unable to delete product');
    }
  }

  async updateVariantStock(id: string, sku: string, newStock: number, locale: string = 'en'): Promise<any> {
    try {
      const product = await this.productsRepository.findOne({
        where: { id },
        relations: ['category'],
      });

      if (!product) {
        throw new NotFoundException(`Product #${id} not found`);
      }

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
      const enrichedProduct = await this.enrichProductVariants(savedProduct);
      return this.transformProductForLocale(enrichedProduct, locale);
    } catch (err) {
      this.handleError(err, 'Unable to update variant stock');
    }
  }

  async getTotalStock(id: string): Promise<number> {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    if (!product.variants || product.variants.length === 0) {
      return product.stock_quantity || 0;
    }

    return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  }

  async search(keyword: string, limit: number = 20, locale: string = 'en'): Promise<any[]> {
    try {
      const products = await this.productsRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .where('product.deleted_at IS NULL')
        .andWhere('product.status = :status', { status: 'active' })
        .andWhere(
          '(product.name::text ILIKE :keyword OR product.description::text ILIKE :keyword)',
          { keyword: `%${keyword}%` }
        )
        .take(limit)
        .getMany();
      
      // Enrich variants with full color and size objects
      const enrichedProducts = await Promise.all(
        products.map(product => this.enrichProductVariants(product))
      );

      // Transform to single language
      return enrichedProducts.map(product => this.transformProductForLocale(product, locale));
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
      throw new BadRequestException(
        'Sale price cannot be greater than regular price / giá khuyến mãi không được lớn hơn giá gốc',
      );
    }

    // Reject duplicate variant SKUs so the correct variant can always be addressed later.
    if (productDto.variants && productDto.variants.length > 0) {
      const skus = productDto.variants.map((v) => v.sku?.trim()).filter(Boolean) as string[];
      const duplicates = skus.filter((sku, i) => skus.indexOf(sku) !== i);
      if (duplicates.length > 0) {
        throw new BadRequestException(
          `Duplicate variant SKU: "${[...new Set(duplicates)].join(', ')}" / SKU biến thể bị trùng`,
        );
      }
    }

    // Validate variants vs stock_quantity logic
    if (productDto.variants && productDto.variants.length > 0) {
      if (productDto.stock_quantity && productDto.stock_quantity > 0) {
        throw new BadRequestException(
          'Product with variants should not have stock_quantity set / sản phẩm có biến thể không được đặt tồn kho tổng',
        );
      }
      if (productDto.sku) {
        throw new BadRequestException(
          'Product with variants should not have SKU set / sản phẩm có biến thể không được đặt SKU chung',
        );
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
