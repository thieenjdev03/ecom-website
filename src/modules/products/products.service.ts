import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ProductVariant } from './entity/product-variant.entity';
import { ProductMedia } from './entity/product-media.entity';
import { ProductAttribute } from './entity/product-attribute.entity';
import { CreateFullProductDto } from './dto/create-full-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductMedia)
    private readonly mediaRepository: Repository<ProductMedia>,
    @InjectRepository(ProductAttribute)
    private readonly attributeRepository: Repository<ProductAttribute>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product[] | Product> {
    const product = this.productRepository.create(createProductDto as any);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<any[]> {
    const products = await this.productRepository.find();
    
    // Get variants and attributes for each product
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const [variants, attributes] = await Promise.all([
          this.variantRepository.find({ where: { productId: product.id } }),
          this.attributeRepository.find({ where: { productId: product.id } }),
        ]);
        
        return {
          ...product,
          variants,
          attributes,
        };
      })
    );
    
    return productsWithDetails;
  }

  async findOne(id: string): Promise<any> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    const [variants, attributes] = await Promise.all([
      this.variantRepository.find({ where: { productId: product.id } }),
      this.attributeRepository.find({ where: { productId: product.id } }),
    ]);
    
    return {
      ...product,
      variants,
      attributes,
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private toSlug(input: string): string {
    const slug = input
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'product';
  }

  private toDecimalString(value: number | string | undefined, fallback?: number): string {
    const num = typeof value === 'number' ? value : value != null ? Number(value) : fallback ?? 0;
    if (Number.isNaN(num) || num < 0) {
      throw new BadRequestException('Invalid price value');
    }
    return num.toFixed(2);
  }

  async createFull(dto: CreateFullProductDto) {
    if (!dto?.product?.title) {
      throw new BadRequestException('product.title is required');
    }
    if (!dto?.variants || dto.variants.length === 0) {
      throw new BadRequestException('At least one variant is required');
    }

    // Enforce single isPrimary and single isHover if media provided
    if (dto.media && dto.media.length > 0) {
      let primarySeen = false;
      let hoverSeen = false;
      dto.media = dto.media.map((m) => {
        const item = { ...m } as any;
        if (item.isPrimary) {
          if (primarySeen) item.isPrimary = false; else primarySeen = true;
        }
        if (item.isHover) {
          if (hoverSeen) item.isHover = false; else hoverSeen = true;
        }
        return item;
      });
    }

    return await this.productRepository.manager.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const variantRepo = manager.getRepository(ProductVariant);
      const mediaRepo = manager.getRepository(ProductMedia);

      // Upsert product
      let product: Product | null = null;
      if (dto.product.id) {
        product = await productRepo.findOne({ where: { id: dto.product.id } });
        if (!product) throw new NotFoundException('Product not found');
        const newSlug = dto.product.slug?.trim()?.length ? dto.product.slug : (product.slug || this.toSlug(dto.product.title));
        Object.assign(product, {
          title: dto.product.title,
          slug: newSlug,
          description: dto.product.description ?? product.description ?? null,
          status: dto.product.status ?? product.status ?? 'draft',
        });
        product = await productRepo.save(product);
      } else {
        const slug = dto.product.slug?.trim()?.length ? dto.product.slug : this.toSlug(dto.product.title);
        product = await productRepo.save(
          productRepo.create({
            title: dto.product.title,
            slug,
            description: dto.product.description ?? null,
            status: dto.product.status ?? 'draft',
          }),
        );
      }

      // Validate variants minimal rules and upsert
      const seenSkus = new Set<string>();
      for (const v of dto.variants) {
        if (!v.sku) throw new BadRequestException('variant.sku is required');
        if (seenSkus.has(v.sku)) throw new BadRequestException('Duplicate sku in request');
        seenSkus.add(v.sku);
        if (v.priceOriginal != null && v.priceFinal != null && v.priceFinal > v.priceOriginal) {
          throw new BadRequestException('priceFinal must be <= priceOriginal');
        }
        if (!v.currency) throw new BadRequestException('variant.currency is required');
        if (v.stockOnHand == null || v.stockOnHand < 0) throw new BadRequestException('stockOnHand must be >= 0');
      }

      const savedVariants: ProductVariant[] = [];
      for (const v of dto.variants) {
        const payload: Partial<ProductVariant> = {
          productId: product.id,
          sku: v.sku,
          name: v.name ?? null,
          priceOriginal: this.toDecimalString(v.priceOriginal, v.priceFinal),
          priceFinal: this.toDecimalString(v.priceFinal, v.priceOriginal ?? v.priceFinal),
          currency: v.currency,
          stockOnHand: v.stockOnHand,
          stockReserved: 0,
        };
        if (v.id) {
          const existed = await variantRepo.findOne({ where: { id: v.id } });
          if (!existed) throw new NotFoundException('Variant not found');
          Object.assign(existed, payload);
          savedVariants.push(await variantRepo.save(existed));
        } else {
          savedVariants.push(await variantRepo.save(variantRepo.create(payload)));
        }
      }

      // Media create/upsert (simple: always create new rows; upsert by id if provided)
      let savedMedia: ProductMedia[] = [];
      if (dto.media && dto.media.length > 0) {
        const items: ProductMedia[] = [] as any;
        for (const m of dto.media) {
          const base: Partial<ProductMedia> = {
            productId: product.id,
            url: m.url,
            type: (m.type as any) ?? 'image',
            position: m.position ?? 0,
            isPrimary: m.isPrimary ?? false,
            isHover: m.isHover ?? false,
            alt: m.alt ?? null,
          };
          if (m.id) {
            const existed = await mediaRepo.findOne({ where: { id: m.id } });
            if (!existed) throw new NotFoundException('Media not found');
            Object.assign(existed, base);
            items.push(existed);
          } else {
            items.push(mediaRepo.create(base));
          }
        }
        savedMedia = await mediaRepo.save(items);
      }

      // defaultVariant
      let defaultVariantId: string | null = null;
      if (dto.defaultVariant?.by && dto.defaultVariant?.value) {
        if (dto.defaultVariant.by === 'id') {
          const found = savedVariants.find((x) => x.id === dto.defaultVariant!.value);
          if (found) defaultVariantId = found.id;
        } else if (dto.defaultVariant.by === 'sku') {
          const found = savedVariants.find((x) => x.sku === dto.defaultVariant!.value);
          if (found) defaultVariantId = found.id;
        }
      }
      if (!defaultVariantId && savedVariants.length > 0) {
        defaultVariantId = savedVariants[0].id;
      }
      if (defaultVariantId !== (product.defaultVariantId ?? null)) {
        product.defaultVariantId = defaultVariantId;
        product = await productRepo.save(product);
      }

      // publish
      if (dto.publish) {
        if (savedVariants.length === 0) throw new BadRequestException('Cannot publish without variants');
        if (product.status !== 'published') {
          product.status = 'published';
          product = await productRepo.save(product);
        }
      }

      // response
      return {
        product: { id: product.id, title: product.title, slug: product.slug, status: product.status },
        variants: savedVariants.map((v) => ({ id: v.id, sku: v.sku, stockOnHand: v.stockOnHand })),
        media: savedMedia.map((m) => ({ id: m.id, url: m.url, isPrimary: m.isPrimary })),
        defaultVariantId: product.defaultVariantId,
      };
    });
  }

  // Public endpoints helpers
  async findBySlug(slug: string) {
    const product = await this.productRepository.findOne({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');
    
    const [variants, media, attributes] = await Promise.all([
      this.variantRepository.find({ where: { productId: product.id } }),
      this.mediaRepository.find({ where: { productId: product.id }, order: { position: 'ASC' } }),
      this.attributeRepository.find({ where: { productId: product.id } }),
    ]);
    
    return { 
      ...product, 
      variants, 
      media, 
      attributes 
    };
  }

  async getVariantDetail(variantId: string) {
    const variant = await this.variantRepository.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    return { variant };
  }

  // Admin helpers
  async generateVariantsFromCombinations(productId: string, combinations: { sku: string; name?: string; priceOriginal: string; priceFinal?: string; currency?: string; stockOnHand?: number; thumbnailUrl?: string }[]) {
    const variants = await this.variantRepository.save(
      combinations.map((c) =>
        this.variantRepository.create({
          productId,
          sku: c.sku,
          name: c.name ?? null,
          priceOriginal: c.priceOriginal,
          priceFinal: c.priceFinal ?? c.priceOriginal,
          currency: c.currency ?? 'VND',
          stockOnHand: c.stockOnHand ?? 0,
          stockReserved: 0,
          thumbnailUrl: c.thumbnailUrl ?? null,
        }),
      ),
    );
    return variants;
  }

  async updateVariant(variantId: string, dto: Partial<ProductVariant>) {
    const variant = await this.variantRepository.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    Object.assign(variant, dto);
    return this.variantRepository.save(variant);
  }

  async adjustVariantStock(variantId: string, stockOnHand: number) {
    const variant = await this.variantRepository.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    variant.stockOnHand = stockOnHand;
    return this.variantRepository.save(variant);
  }

  async addMedia(productId: string, payload: { url: string; type?: 'image' | 'video'; position?: number; isPrimary?: boolean; isHover?: boolean; variantId?: string | null; alt?: string }[]) {
    const items = payload.map((m) =>
      this.mediaRepository.create({
        productId,
        url: m.url,
        type: (m.type as any) ?? 'image',
        position: m.position ?? 0,
        isPrimary: m.isPrimary ?? false,
        isHover: m.isHover ?? false,
        variantId: m.variantId ?? null,
        alt: m.alt ?? null,
      }),
    );
    return this.mediaRepository.save(items);
  }
}
