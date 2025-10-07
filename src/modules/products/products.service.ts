import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Color } from '../colors/entities/color.entity';
import { Size } from '../sizes/entities/size.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Color)
    private colorRepository: Repository<Color>,
    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingProduct = await this.productRepository.findOne({
        where: { productCode: createProductDto.productCode },
      });
      if (existingProduct) {
        throw new ConflictException('Product code already exists');
      }

      const category = await this.categoryRepository.findOne({
        where: { id: createProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const colors = await this.colorRepository.findByIds(
        createProductDto.colorIds,
      );
      if (colors.length !== createProductDto.colorIds.length) {
        throw new NotFoundException('One or more colors not found');
      }

      const sizes = await this.sizeRepository.findByIds(
        createProductDto.sizeIds,
      );
      if (sizes.length !== createProductDto.sizeIds.length) {
        throw new NotFoundException('One or more sizes not found');
      }

      const product = this.productRepository.create({
        productCode: createProductDto.productCode,
        productSku: createProductDto.productSku,
        category,
        quantity: createProductDto.quantity || 0,
        tags: createProductDto.tags || [],
        gender: createProductDto.gender || [],
        images: createProductDto.images || [],
        saleLabel: createProductDto.saleLabel,
        newLabel: createProductDto.newLabel,
        isSale: createProductDto.isSale || false,
        isNew: createProductDto.isNew || false,
        colors,
        sizes,
        description: createProductDto.description,
        isFeatured: createProductDto.isFeatured || false,
      });

      const savedProduct = await queryRunner.manager.save(product);

      if (createProductDto.variants && createProductDto.variants.length > 0) {
        const variants = await this.createVariantsForProduct(
          savedProduct,
          createProductDto.variants,
          queryRunner,
        );
        savedProduct.variants = variants;
      }

      await queryRunner.commitTransaction();

      return await this.findOne(savedProduct.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createVariantsForProduct(
    product: Product,
    variantDtos: CreateVariantDto[],
    queryRunner: any,
  ): Promise<ProductVariant[]> {
    const variants: ProductVariant[] = [];

    for (const variantDto of variantDtos) {
      const existingVariant = await this.variantRepository.findOne({
        where: { sku: variantDto.sku },
      });
      if (existingVariant) {
        throw new ConflictException(`SKU ${variantDto.sku} already exists`);
      }

      const color = await this.colorRepository.findOne({
        where: { id: variantDto.colorId },
      });
      const size = await this.sizeRepository.findOne({
        where: { id: variantDto.sizeId },
      });

      if (!color || !size) {
        throw new NotFoundException('Color or Size not found');
      }

      const duplicateVariant = variants.find(
        (v) => v.color.id === variantDto.colorId && v.size.id === variantDto.sizeId,
      );
      if (duplicateVariant) {
        throw new ConflictException('Duplicate variant with same color and size');
      }

      const variant = this.variantRepository.create({
        product,
        color,
        size,
        sku: variantDto.sku,
        price: variantDto.price,
        salePrice: variantDto.salePrice,
        quantity: variantDto.quantity,
        imageUrl: variantDto.imageUrl,
      });

      const savedVariant = await queryRunner.manager.save(variant);
      variants.push(savedVariant);
    }

    return variants;
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['category', 'colors', 'sizes', 'variants'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'colors',
        'sizes',
        'variants',
        'variants.color',
        'variants.size',
      ],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      product.category = category;
    }

    Object.assign(product, updateProductDto);
    await this.productRepository.save(product);

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async addColors(productId: string, colorIds: string[]): Promise<Product> {
    const product = await this.findOne(productId);
    const colors = await this.colorRepository.findByIds(colorIds);

    if (colors.length !== colorIds.length) {
      throw new NotFoundException('One or more colors not found');
    }

    const existingColorIds = product.colors.map((c) => c.id);
    const newColors = colors.filter((c) => !existingColorIds.includes(c.id));
    product.colors = [...product.colors, ...newColors];

    await this.productRepository.save(product);
    return await this.findOne(productId);
  }

  async removeColor(productId: string, colorId: string): Promise<Product> {
    const product = await this.findOne(productId);
    product.colors = product.colors.filter((c) => c.id !== colorId);
    await this.productRepository.save(product);
    return await this.findOne(productId);
  }

  async addSizes(productId: string, sizeIds: string[]): Promise<Product> {
    const product = await this.findOne(productId);
    const sizes = await this.sizeRepository.findByIds(sizeIds);

    if (sizes.length !== sizeIds.length) {
      throw new NotFoundException('One or more sizes not found');
    }

    const existingSizeIds = product.sizes.map((s) => s.id);
    const newSizes = sizes.filter((s) => !existingSizeIds.includes(s.id));
    product.sizes = [...product.sizes, ...newSizes];

    await this.productRepository.save(product);
    return await this.findOne(productId);
  }

  async removeSize(productId: string, sizeId: string): Promise<Product> {
    const product = await this.findOne(productId);
    product.sizes = product.sizes.filter((s) => s.id !== sizeId);
    await this.productRepository.save(product);
    return await this.findOne(productId);
  }

  async addVariant(
    productId: string,
    variantDto: CreateVariantDto,
  ): Promise<ProductVariant> {
    const product = await this.findOne(productId);

    const existingVariant = await this.variantRepository.findOne({
      where: { sku: variantDto.sku },
    });
    if (existingVariant) {
      throw new ConflictException('SKU already exists');
    }

    const color = await this.colorRepository.findOne({
      where: { id: variantDto.colorId },
    });
    const size = await this.sizeRepository.findOne({
      where: { id: variantDto.sizeId },
    });

    if (!color || !size) {
      throw new NotFoundException('Color or Size not found');
    }

    const duplicate = await this.variantRepository.findOne({
      where: {
        product: { id: productId },
        color: { id: variantDto.colorId },
        size: { id: variantDto.sizeId },
      },
    });
    if (duplicate) {
      throw new ConflictException('Variant with this color and size already exists');
    }

    const variant = this.variantRepository.create({
      product,
      color,
      size,
      sku: variantDto.sku,
      price: variantDto.price,
      salePrice: variantDto.salePrice,
      quantity: variantDto.quantity,
      imageUrl: variantDto.imageUrl,
    });

    return await this.variantRepository.save(variant);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    updateData: Partial<CreateVariantDto>,
  ): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, product: { id: productId } },
      relations: ['product', 'color', 'size'],
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    if (updateData.colorId) {
      const color = await this.colorRepository.findOne({
        where: { id: updateData.colorId },
      });
      if (!color) throw new NotFoundException('Color not found');
      variant.color = color;
    }

    if (updateData.sizeId) {
      const size = await this.sizeRepository.findOne({
        where: { id: updateData.sizeId },
      });
      if (!size) throw new NotFoundException('Size not found');
      variant.size = size;
    }

    Object.assign(variant, updateData);
    return await this.variantRepository.save(variant);
  }

  async removeVariant(productId: string, variantId: string): Promise<void> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, product: { id: productId } },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.variantRepository.remove(variant);
  }

  async addVariantsBulk(
    productId: string,
    variantDtos: CreateVariantDto[],
  ): Promise<ProductVariant[]> {
    const product = await this.findOne(productId);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const variants = await this.createVariantsForProduct(
        product,
        variantDtos,
        queryRunner,
      );
      await queryRunner.commitTransaction();
      return variants;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}


