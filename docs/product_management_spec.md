# Product Management System - NestJS + PostgreSQL

## 1. Tổng quan hệ thống

**Tech Stack:**
- Backend: NestJS (Node.js framework)
- Database: PostgreSQL
- ORM: TypeORM / Prisma (recommend TypeORM cho NestJS)
- Validation: class-validator, class-transformer

## 2. Cấu trúc Project NestJS

```
src/
├── modules/
│   ├── products/
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts
│   │   │   ├── update-product.dto.ts
│   │   │   └── create-variant.dto.ts
│   │   ├── entities/
│   │   │   ├── product.entity.ts
│   │   │   ├── product-variant.entity.ts
│   │   │   ├── product-color.entity.ts
│   │   │   └── product-size.entity.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.module.ts
│   │   └── products.repository.ts
│   │
│   ├── colors/
│   │   ├── dto/
│   │   │   ├── create-color.dto.ts
│   │   │   └── update-color.dto.ts
│   │   ├── entities/
│   │   │   └── color.entity.ts
│   │   ├── colors.controller.ts
│   │   ├── colors.service.ts
│   │   └── colors.module.ts
│   │
│   ├── sizes/
│   │   ├── dto/
│   │   │   ├── create-size.dto.ts
│   │   │   └── update-size.dto.ts
│   │   ├── entities/
│   │   │   └── size.entity.ts
│   │   ├── sizes.controller.ts
│   │   ├── sizes.service.ts
│   │   └── sizes.module.ts
│   │
│   └── categories/
│       ├── dto/
│       ├── entities/
│       │   └── category.entity.ts
│       ├── categories.controller.ts
│       ├── categories.service.ts
│       └── categories.module.ts
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
│
├── config/
│   └── database.config.ts
│
├── app.module.ts
└── main.ts
```

## 3. Database Schema với TypeORM

### 3.1. Product Entity

```typescript
// src/modules/products/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductVariant } from './product-variant.entity';
import { Color } from '../../colors/entities/color.entity';
import { Size } from '../../sizes/entities/size.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_code', unique: true, length: 100 })
  @Index()
  productCode: string;

  @Column({ name: 'product_sku', length: 100, nullable: true })
  productSku: string;

  @ManyToOne(() => Category, { eager: true })
  category: Category;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'text', array: true, default: [] })
  gender: string[]; // ['Men', 'Women', 'Kids']

  @Column({ name: 'sale_label', nullable: true })
  saleLabel: string;

  @Column({ name: 'new_label', nullable: true })
  newLabel: string;

  @Column({ name: 'is_sale', default: false })
  isSale: boolean;

  @Column({ name: 'is_new', default: false })
  isNew: boolean;

  // Relations
  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @ManyToMany(() => Color, { eager: true })
  @JoinTable({
    name: 'product_colors',
    joinColumn: { name: 'product_id' },
    inverseJoinColumn: { name: 'color_id' },
  })
  colors: Color[];

  @ManyToMany(() => Size, { eager: true })
  @JoinTable({
    name: 'product_sizes',
    joinColumn: { name: 'product_id' },
    inverseJoinColumn: { name: 'size_id' },
  })
  sizes: Size[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 3.2. Product Variant Entity

```typescript
// src/modules/products/entities/product-variant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Color } from '../../colors/entities/color.entity';
import { Size } from '../../sizes/entities/size.entity';

@Entity('product_variants')
@Unique(['product', 'color', 'size'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @Index()
  product: Product;

  @ManyToOne(() => Color, { eager: true })
  @Index()
  color: Color;

  @ManyToOne(() => Size, { eager: true })
  @Index()
  size: Size;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'sale_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 3.3. Color Entity

```typescript
// src/modules/colors/entities/color.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('colors')
export class Color {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index()
  name: string;

  @Column({ name: 'hex_code', length: 7, nullable: true })
  hexCode: string; // #FFFFFF

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### 3.4. Size Entity

```typescript
// src/modules/sizes/entities/size.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('sizes')
export class Size {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @ManyToOne(() => Category, { nullable: true })
  @Index()
  category: Category;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### 3.5. Category Entity

```typescript
// src/modules/categories/entities/category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

## 4. DTOs (Data Transfer Objects)

### 4.1. Product DTOs

```typescript
// src/modules/products/dto/create-product.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUUID,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsUUID()
  colorId: string;

  @IsUUID()
  sizeId: string;

  @IsString()
  sku: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateProductDto {
  @IsString()
  productCode: string;

  @IsOptional()
  @IsString()
  productSku?: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gender?: string[];

  @IsOptional()
  @IsString()
  saleLabel?: string;

  @IsOptional()
  @IsString()
  newLabel?: string;

  @IsOptional()
  @IsBoolean()
  isSale?: boolean;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  colorIds: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  sizeIds: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
```

```typescript
// src/modules/products/dto/update-product.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['colorIds', 'sizeIds', 'variants'] as const),
) {}
```

### 4.2. Color DTOs

```typescript
// src/modules/colors/dto/create-color.dto.ts
import { IsString, IsOptional, Matches } from 'class-validator';

export class CreateColorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'hexCode must be a valid hex color code (e.g., #FF0000)',
  })
  hexCode?: string;
}
```

```typescript
// src/modules/colors/dto/update-color.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateColorDto } from './create-color.dto';

export class UpdateColorDto extends PartialType(CreateColorDto) {}
```

### 4.3. Size DTOs

```typescript
// src/modules/sizes/dto/create-size.dto.ts
import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateSizeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
```

```typescript
// src/modules/sizes/dto/update-size.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSizeDto } from './create-size.dto';

export class UpdateSizeDto extends PartialType(CreateSizeDto) {}
```

## 5. Services Implementation

### 5.1. Products Service

```typescript
// src/modules/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
      // Check if product code already exists
      const existingProduct = await this.productRepository.findOne({
        where: { productCode: createProductDto.productCode },
      });
      if (existingProduct) {
        throw new ConflictException('Product code already exists');
      }

      // Validate category exists
      const category = await this.categoryRepository.findOne({
        where: { id: createProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Validate colors exist
      const colors = await this.colorRepository.findByIds(
        createProductDto.colorIds,
      );
      if (colors.length !== createProductDto.colorIds.length) {
        throw new NotFoundException('One or more colors not found');
      }

      // Validate sizes exist
      const sizes = await this.sizeRepository.findByIds(
        createProductDto.sizeIds,
      );
      if (sizes.length !== createProductDto.sizeIds.length) {
        throw new NotFoundException('One or more sizes not found');
      }

      // Create product
      const product = this.productRepository.create({
        productCode: createProductDto.productCode,
        productSku: createProductDto.productSku,
        category,
        quantity: createProductDto.quantity || 0,
        tags: createProductDto.tags || [],
        gender: createProductDto.gender || [],
        saleLabel: createProductDto.saleLabel,
        newLabel: createProductDto.newLabel,
        isSale: createProductDto.isSale || false,
        isNew: createProductDto.isNew || false,
        colors,
        sizes,
      });

      const savedProduct = await queryRunner.manager.save(product);

      // Create variants if provided
      if (createProductDto.variants && createProductDto.variants.length > 0) {
        const variants = await this.createVariantsForProduct(
          savedProduct,
          createProductDto.variants,
          queryRunner,
        );
        savedProduct.variants = variants;
      }

      await queryRunner.commitTransaction();

      // Return product with all relations
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
      // Check if SKU already exists
      const existingVariant = await this.variantRepository.findOne({
        where: { sku: variantDto.sku },
      });
      if (existingVariant) {
        throw new ConflictException(`SKU ${variantDto.sku} already exists`);
      }

      // Get color and size
      const color = await this.colorRepository.findOne({
        where: { id: variantDto.colorId },
      });
      const size = await this.sizeRepository.findOne({
        where: { id: variantDto.sizeId },
      });

      if (!color || !size) {
        throw new NotFoundException('Color or Size not found');
      }

      // Check if variant with same color and size already exists for this product
      const duplicateVariant = variants.find(
        (v) =>
          v.color.id === variantDto.colorId &&
          v.size.id === variantDto.sizeId,
      );
      if (duplicateVariant) {
        throw new ConflictException(
          'Duplicate variant with same color and size',
        );
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

  // Color management
  async addColors(productId: string, colorIds: string[]): Promise<Product> {
    const product = await this.findOne(productId);
    const colors = await this.colorRepository.findByIds(colorIds);

    if (colors.length !== colorIds.length) {
      throw new NotFoundException('One or more colors not found');
    }

    // Add new colors (avoid duplicates)
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

  // Size management
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

  // Variant management
  async addVariant(
    productId: string,
    variantDto: CreateVariantDto,
  ): Promise<ProductVariant> {
    const product = await this.findOne(productId);

    // Check SKU uniqueness
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

    // Check duplicate variant
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
```

### 5.2. Colors Service

```typescript
// src/modules/colors/colors.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Color } from './entities/color.entity';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColorsService {
  constructor(
    @InjectRepository(Color)
    private colorRepository: Repository<Color>,
  ) {}

  async create(createColorDto: CreateColorDto): Promise<Color> {
    const color = this.colorRepository.create(createColorDto);
    return await this.colorRepository.save(color);
  }

  async findAll(): Promise<Color[]> {
    return await this.colorRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Color> {
    const color = await this.colorRepository.findOne({ where: { id } });
    if (!color) {
      throw new NotFoundException('Color not found');
    }
    return color;
  }

  async update(id: string, updateColorDto: UpdateColorDto): Promise<Color> {
    const color = await this.findOne(id);
    Object.assign(color, updateColorDto);
    return await this.colorRepository.save(color);
  }

  async remove(id: string): Promise<void> {
    const color = await this.findOne(id);
    // TODO: Check if color is being used in any products
    await this.colorRepository.remove(color);
  }
}
```

### 5.3. Sizes Service

```typescript
// src/modules/sizes/sizes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Size } from './entities/size.entity';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizesService {
  constructor(
    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,
  ) {}

  async create(createSizeDto: CreateSizeDto): Promise<Size> {
    const size = this.sizeRepository.create(createSizeDto);
    return await this.sizeRepository.save(size);
  }

  async findAll(categoryId?: string): Promise<Size[]> {
    const query = this.sizeRepository.createQueryBuilder('size');

    if (categoryId) {
      query.where('size.categoryId = :categoryId', { categoryId });
    }

    return await query.orderBy('size.sortOrder', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Size> {
    const size = await this.sizeRepository.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException('Size not found');
    }
    return size;
  }

  async update(id: string, updateSizeDto: UpdateSizeDto): Promise<Size> {
    const size = await this.findOne(id);
    Object.assign(size, updateSizeDto);
    return await this.sizeRepository.save(size);
  }

  async remove(id: string): Promise<void> {
    const size = await this.findOne(id);
    await this.sizeRepository.remove(size);
  }
}
```

## 6. Controllers Implementation

### 6.1. Products Controller

```typescript
// src/modules/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.