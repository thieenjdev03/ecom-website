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
  create(@Body() createProductDto: CreateProductDto, @Query('locale') locale?: string) {
    return this.productsService.create(createProductDto, locale || 'en');
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
  search(@Query('q') keyword: string, @Query('limit') limit?: number, @Query('locale') locale?: string) {
    return this.productsService.search(keyword, limit, locale || 'en');
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.productsService.findBySlug(slug, locale || 'en');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string, @Query('locale') locale?: string) {
    return this.productsService.findOne(id, locale || 'en');
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get total stock for product' })
  @ApiResponse({ status: 200, description: 'Stock count retrieved' })
  getTotalStock(@Param('id') id: string) {
    return this.productsService.getTotalStock(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Query('locale') locale?: string) {
    return this.productsService.update(id, updateProductDto, locale || 'en');
  }

  @Patch(':id/variants/:sku/stock')
  @ApiOperation({ summary: 'Update variant stock' })
  @ApiResponse({ status: 200, description: 'Variant stock updated' })
  updateVariantStock(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @Body('stock', ParseIntPipe) stock: number,
    @Query('locale') locale?: string,
  ) {
    return this.productsService.updateVariantStock(id, sku, stock, locale || 'en');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
