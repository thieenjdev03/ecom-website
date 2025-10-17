# 📦 Product Module - NestJS Implementation Guide

**Project:** E-commerce Backend  
**Stack:** NestJS + PostgreSQL + TypeORM  
**Scope:** Products & Categories (<100 products)  
**Version:** 1.0  
**Date:** 2025-10-13

---

## 🎯 Quick Start

This guide provides **complete, copy-paste ready code** for implementing a product management system in NestJS. Follow sections in order for fastest implementation.

**Implementation Time:** ~2-3 hours for complete module

---

## 📐 Database Schema

### Step 1: Create Migration

```bash
npm run migration:create src/migrations/CreateProductsAndCategories
```

### Step 2: Migration File

```typescript
// src/migrations/TIMESTAMP-CreateProductsAndCategories.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsAndCategories1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes for categories
    await queryRunner.query(`
      CREATE INDEX idx_categories_slug ON categories(slug);
      CREATE INDEX idx_categories_parent ON categories(parent_id);
      CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        sale_price DECIMAL(10,2) CHECK (sale_price >= 0 AND sale_price <= price),
        cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
        
        images JSONB DEFAULT '[]'::jsonb,
        variants JSONB DEFAULT '[]'::jsonb,
        
        stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        
        category_id INT REFERENCES categories(id) ON DELETE SET NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'out_of_stock', 'discontinued')),
        is_featured BOOLEAN DEFAULT false,
        
        meta_title VARCHAR(255),
        meta_description VARCHAR(500),
        
        weight DECIMAL(8,2),
        dimensions JSONB,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // Indexes for products
    await queryRunner.query(`
      CREATE INDEX idx_products_slug ON products(slug) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true AND deleted_at IS NULL;
      CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, ''))) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_tags ON products USING GIN(tags) WHERE deleted_at IS NULL;
      CREATE INDEX idx_products_variants ON products USING GIN(variants) WHERE deleted_at IS NULL;
    `);

    // Auto-update trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS products CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories CASCADE;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;`);
  }
}
```

### Step 3: Run Migration

```bash
npm run migration:run
```

---

## 🏗️ Entity Classes

### Category Entity

```typescript
// src/products/entities/category.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  image_url: string;

  @Column({ nullable: true })
  parent_id: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @Column({ default: 0 })
  display_order: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### Product Entity

```typescript
// src/products/entities/product.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Category } from './category.entity';

export interface ProductVariant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  barcode?: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  short_description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sale_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost_price: number;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ type: 'jsonb', default: [] })
  variants: ProductVariant[];

  @Column({ default: 0 })
  stock_quantity: number;

  @Column({ length: 100, unique: true, nullable: true })
  sku: string;

  @Column({ length: 100, nullable: true })
  barcode: string;

  @Column({ nullable: true })
  category_id: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ length: 20, default: 'active' })
  status: 'active' | 'draft' | 'out_of_stock' | 'discontinued';

  @Column({ default: false })
  is_featured: boolean;

  @Column({ length: 255, nullable: true })
  meta_title: string;

  @Column({ length: 500, nullable: true })
  meta_description: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: ProductDimensions;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
```

---

## 📝 DTOs (Data Transfer Objects)

### Product DTOs

```typescript
// src/products/dto/product-variant.dto.ts
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductVariantDto {
  @ApiProperty({ example: 'M - Black' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'POLO-M-BLACK' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 399000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  barcode?: string;
}
```

```typescript
// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, Min, Max, ValidateNested, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariantDto } from './product-variant.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Polo Shirt' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'premium-polo-shirt' })
  @IsString()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ example: 'High quality cotton polo shirt...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Premium cotton polo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  short_description?: string;

  @ApiProperty({ example: 399000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 349000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sale_price?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost_price?: number;

  @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @ApiPropertyOptional({ example: 'POLO-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  category_id?: number;

  @ApiPropertyOptional({ example: ['polo', 'men', 'premium'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['active', 'draft', 'out_of_stock', 'discontinued'] })
  @IsOptional()
  @IsEnum(['active', 'draft', 'out_of_stock', 'discontinued'])
  status?: 'active' | 'draft' | 'out_of_stock' | 'discontinued';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: 'Buy Premium Polo Shirt' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  meta_title?: string;

  @ApiPropertyOptional({ example: 'High quality polo shirt...' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  meta_description?: string;

  @ApiPropertyOptional({ example: 250 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
```

```typescript
// src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

```typescript
// src/products/dto/query-product.dto.ts
import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryProductDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  category_id?: number;

  @ApiPropertyOptional({ enum: ['active', 'draft', 'out_of_stock', 'discontinued'] })
  @IsOptional()
  @IsEnum(['active', 'draft', 'out_of_stock', 'discontinued'])
  status?: 'active' | 'draft' | 'out_of_stock' | 'discontinued';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: 'polo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'created_at', enum: ['created_at', 'price', 'name'] })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
```

### Category DTOs

```typescript
// src/products/dto/create-category.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'T-Shirts' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 't-shirts' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: 'All types of t-shirts' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/category.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  parent_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  display_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
```

```typescript
// src/products/dto/update-category.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

---

## 🔧 Service Layer

### Products Service

```typescript
// src/products/products.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
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
    return this.productsRepository.save(product);
  }

  async findAll(query: QueryProductDto): Promise<{ data: Product[]; meta: any }> {
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

    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.softDelete(id);
  }

  async getTotalStock(id: number): Promise<number> {
    const product = await this.findOne(id);

    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    }

    return product.stock_quantity || 0;
  }

  async updateVariantStock(id: number, sku: string, newStock: number): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.variants || product.variants.length === 0) {
      throw new BadRequestException('Product has no variants');
    }

    const variantIndex = product.variants.findIndex(v => v.sku === sku);
    if (variantIndex === -1) {
      throw new NotFoundException(`Variant with SKU "${sku}" not found`);
    }

    product.variants[variantIndex].stock = newStock;
    return this.productsRepository.save(product);
  }

  async search(keyword: string, limit: number = 20): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .where('product.deleted_at IS NULL')
      .andWhere('product.status = :status', { status: 'active' })
      .andWhere(
        '(product.name ILIKE :keyword OR product.description ILIKE :keyword)',
        { keyword: `%${keyword}%` }
      )
      .take(limit)
      .getMany();
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
}
```

### Categories Service

```typescript
// src/products/categories.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check slug uniqueness
    const existingSlug = await this.categoriesRepository.findOne({
      where: { slug: createCategoryDto.slug },
    });
    if (existingSlug) {
      throw new BadRequestException(`Slug "${createCategoryDto.slug}" already exists`);
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { display_order: 'ASC', name: 'ASC' },
    });
  }

  async findActive(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { is_active: true },
      order: { display_order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Check slug uniqueness if changing
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingSlug = await this.categoriesRepository.findOne({
        where: { slug: updateCategoryDto.slug },
      });
      if (existingSlug) {
        throw new BadRequestException(`Slug "${updateCategoryDto.slug}" already exists`);
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }
}
```

---

## 🎮 Controller Layer

### Products Controller

```typescript
// src/products/products.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by keyword' })
  @ApiResponse({ status: 200, description: 'Search results' })
  search(@Query('q') keyword: string, @Query('limit') limit?: number) {
    return this.productsService.search(keyword, limit);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get total stock for product' })
  @ApiResponse({ status: 200, description: 'Stock count retrieved' })
  getTotalStock(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getTotalStock(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/variants/:sku/stock')
  @ApiOperation({ summary: 'Update variant stock' })
  @ApiResponse({ status: 200, description: 'Variant stock updated' })
  updateVariantStock(
    @Param('id', ParseIntPipe) id: number,
    @Param('sku') sku: string,
    @Body('stock', ParseIntPipe) stock: number,
  ) {
    return this.productsService.updateVariantStock(id, sku, stock);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
```

### Categories Controller

```typescript
// src/products/categories.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active categories only' })
  @ApiResponse({ status: 200, description: 'Active categories retrieved' })
  findActive() {
    return this.categoriesService.findActive();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
```

---

## 📦 Module Configuration

```typescript
// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService, CategoriesService],
})
export class ProductsModule {}
```

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'ecommerce'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Always use migrations in production
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    ProductsModule,
  ],
})
export class AppModule {}
```

---

## 🌱 Seeder (Optional)

```typescript
// src/products/seeders/products.seeder.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class ProductsSeeder {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async seed() {
    // Create categories
    const categories = await this.categoriesRepository.save([
      {
        name: 'T-Shirts',
        slug: 't-shirts',
        description: 'All types of t-shirts',
        display_order: 1,
      },
      {
        name: 'Polo Shirts',
        slug: 'polo-shirts',
        description: 'Premium polo shirts',
        display_order: 2,
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Fashion accessories',
        display_order: 3,
      },
    ]);

    // Create products without variants
    await this.productsRepository.save([
      {
        name: 'Basic White T-Shirt',
        slug: 'basic-white-tshirt',
        description: '100% cotton, comfortable fit',
        short_description: 'Classic white tee',
        price: 299000,
        sale_price: 249000,
        images: ['https://via.placeholder.com/500x500?text=White+Tee'],
        stock_quantity: 50,
        sku: 'TEE-WHITE-001',
        category_id: categories[0].id,
        tags: ['t-shirt', 'basic', 'unisex'],
        status: 'active',
      },
      {
        name: 'Black Basic T-Shirt',
        slug: 'black-basic-tshirt',
        description: '100% cotton, comfortable fit',
        short_description: 'Classic black tee',
        price: 299000,
        stock_quantity: 45,
        sku: 'TEE-BLACK-001',
        category_id: categories[0].id,
        tags: ['t-shirt', 'basic', 'unisex'],
        status: 'active',
      },
    ]);

    // Create product with variants
    await this.productsRepository.save({
      name: 'Premium Polo Shirt',
      slug: 'premium-polo-shirt',
      description: 'High quality cotton pique polo shirt with multiple color and size options',
      short_description: 'Premium cotton polo',
      price: 399000,
      images: [
        'https://via.placeholder.com/500x500?text=Polo+Black',
        'https://via.placeholder.com/500x500?text=Polo+White',
      ],
      variants: [
        { name: 'M - Black', sku: 'POLO-M-BLACK', price: 399000, stock: 10 },
        { name: 'M - White', sku: 'POLO-M-WHITE', price: 399000, stock: 8 },
        { name: 'L - Black', sku: 'POLO-L-BLACK', price: 419000, stock: 12 },
        { name: 'L - White', sku: 'POLO-L-WHITE', price: 419000, stock: 5 },
        { name: 'XL - Black', sku: 'POLO-XL-BLACK', price: 439000, stock: 6 },
        { name: 'XL - White', sku: 'POLO-XL-WHITE', price: 439000, stock: 4 },
      ],
      category_id: categories[1].id,
      tags: ['polo', 'men', 'premium'],
      status: 'active',
      is_featured: true,
    });

    console.log('✅ Seeding completed!');
  }
}
```

Run seeder:
```typescript
// src/main.ts or separate seed script
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProductsSeeder } from './products/seeders/products.seeder';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(ProductsSeeder);
  await seeder.seed();
  await app.close();
}

seed();
```

---
## 🚀 API Usage Examples

### Create Product Without Variants

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic White T-Shirt",
    "slug": "basic-white-tshirt",
    "description": "100% cotton comfortable t-shirt",
    "short_description": "Classic white tee",
    "price": 299000,
    "sale_price": 249000,
    "images": ["https://example.com/tshirt.jpg"],
    "stock_quantity": 50,
    "sku": "TEE-WHITE-001",
    "category_id": 1,
    "tags": ["t-shirt", "basic", "unisex"],
    "status": "active"
  }'
```

### Create Product With Variants

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Polo Shirt",
    "slug": "premium-polo-shirt",
    "description": "High quality polo shirt",
    "price": 399000,
    "images": ["https://example.com/polo.jpg"],
    "variants": [
      {"name": "M - Black", "sku": "POLO-M-BLACK", "price": 399000, "stock": 10},
      {"name": "L - Black", "sku": "POLO-L-BLACK", "price": 419000, "stock": 12}
    ],
    "category_id": 1,
    "tags": ["polo", "men"],
    "status": "active",
    "is_featured": true
  }'
```

### Get All Products with Filters

```bash
# Get active products, page 1, 20 items
GET http://localhost:3000/products?status=active&page=1&limit=20

# Get products by category
GET http://localhost:3000/products?category_id=1

# Get featured products
GET http://localhost:3000/products?is_featured=true

# Search products
GET http://localhost:3000/products/search?q=polo

# Combined filters
GET http://localhost:3000/products?category_id=1&status=active&sort_by=price&sort_order=ASC
```

### Get Product by Slug

```bash
GET http://localhost:3000/products/slug/premium-polo-shirt
```

### Update Product

```bash
curl -X PATCH http://localhost:3000/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 349000,
    "sale_price": 299000,
    "stock_quantity": 45
  }'
```

### Update Variant Stock

```bash
curl -X PATCH http://localhost:3000/products/2/variants/POLO-M-BLACK/stock \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 15
  }'
```

### Soft Delete Product

```bash
curl -X DELETE http://localhost:3000/products/1
```

---

## 📊 Response Examples

### List Products Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "Basic White T-Shirt",
      "slug": "basic-white-tshirt",
      "description": "100% cotton comfortable t-shirt",
      "short_description": "Classic white tee",
      "price": "299000.00",
      "sale_price": "249000.00",
      "images": ["https://example.com/tshirt.jpg"],
      "variants": [],
      "stock_quantity": 50,
      "sku": "TEE-WHITE-001",
      "tags": ["t-shirt", "basic", "unisex"],
      "status": "active",
      "is_featured": false,
      "category": {
        "id": 1,
        "name": "T-Shirts",
        "slug": "t-shirts"
      },
      "created_at": "2025-10-13T10:00:00.000Z",
      "updated_at": "2025-10-13T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Single Product Response

```json
{
  "id": 2,
  "name": "Premium Polo Shirt",
  "slug": "premium-polo-shirt",
  "description": "High quality cotton pique polo shirt",
  "short_description": "Premium cotton polo",
  "price": "399000.00",
  "sale_price": null,
  "images": [
    "https://example.com/polo-1.jpg",
    "https://example.com/polo-2.jpg"
  ],
  "variants": [
    {
      "name": "M - Black",
      "sku": "POLO-M-BLACK",
      "price": 399000,
      "stock": 10
    },
    {
      "name": "L - Black",
      "sku": "POLO-L-BLACK",
      "price": 419000,
      "stock": 12
    }
  ],
  "stock_quantity": 0,
  "sku": null,
  "tags": ["polo", "men", "premium"],
  "status": "active",
  "is_featured": true,
  "category": {
    "id": 1,
    "name": "Polo Shirts",
    "slug": "polo-shirts"
  },
  "meta_title": "Buy Premium Polo Shirt Online",
  "meta_description": "High quality cotton polo shirt...",
  "weight": "250.00",
  "dimensions": {
    "length": 70,
    "width": 50,
    "height": 2
  },
  "created_at": "2025-10-13T10:00:00.000Z",
  "updated_at": "2025-10-13T10:00:00.000Z"
}
```

---

## ⚙️ Environment Variables

```env
# .env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=ecommerce

# API
API_PREFIX=api
API_VERSION=v1
```

---

## 📝 Validation Summary

### Product Validation Rules
- ✅ `name`: Required, max 255 chars
- ✅ `slug`: Required, unique, URL-friendly
- ✅ `price`: Required, >= 0
- ✅ `sale_price`: Optional, must be <= price
- ✅ `images`: Array of valid URLs
- ✅ `variants`: If present, product shouldn't have SKU or stock_quantity
- ✅ `sku`: Unique across all products
- ✅ `status`: Must be one of: active, draft, out_of_stock, discontinued

### Business Logic
- Product with variants → `variants` array filled, `stock_quantity` = 0, `sku` = null
- Product without variants → `variants` = [], `stock_quantity` >= 0, `sku` required
- Variant SKUs must be unique globally
- Sale price must be less than or equal to regular price

---

## 🎯 Implementation Checklist

### Phase 1: Setup (30 mins)
- [ ] Create migration file
- [ ] Run migration
- [ ] Create entity files
- [ ] Create DTO files

### Phase 2: Core Logic (1 hour)
- [ ] Implement ProductsService
- [ ] Implement CategoriesService
- [ ] Add validation logic
- [ ] Add error handling

### Phase 3: API Layer (30 mins)
- [ ] Create ProductsController
- [ ] Create CategoriesController
- [ ] Setup module configuration
- [ ] Test API endpoints

### Phase 4: Testing & Documentation (30 mins)
- [ ] Write unit tests
- [ ] Test all endpoints manually
- [ ] Add Swagger documentation
- [ ] Create seeder (optional)

---

## 🔍 Common Issues & Solutions

### Issue: Slug already exists
**Solution:** Check uniqueness before saving, generate slug from name automatically

### Issue: Variant SKU conflicts
**Solution:** Validate all variant SKUs are unique globally, not just within product

### Issue: TypeORM not finding entities
**Solution:** Check `entities` path in TypeORM config matches your folder structure

### Issue: JSONB queries not working
**Solution:** Ensure PostgreSQL version >= 9.4, check GIN indexes are created

---

## 📚 Additional Resources

- **NestJS Documentation:** https://docs.nestjs.com
- **TypeORM Documentation:** https://typeorm.io
- **PostgreSQL JSONB:** https://www.postgresql.org/docs/current/datatype-json.html
- **Class Validator:** https://github.com/typestack/class-validator

---

## 💡 Tips for AI Cursor/Copilot

When using this documentation with AI assistants:

1. **Reference specific sections:**
   ```
   "Follow the Products Service section to implement findAll method"
   ```

2. **Copy-paste entire code blocks:**
   All code is production-ready and can be used directly

3. **Follow the implementation order:**
   Database → Entities → DTOs → Services → Controllers → Module

4. **Use the checklist:**
   Mark items as you complete them to track progress

---

**🎉 You're ready to implement! Start with the migration, then follow each section in order.**