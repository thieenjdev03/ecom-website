import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ProductResponseDto, ProductListDto } from './dto/product-response.dto';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@Body() createProductDto: CreateProductDto, @Query('locale') locale?: string) {
    return this.productsService.create(createProductDto, locale || 'en');
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiOkResponse({ type: ProductListDto })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by keyword' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  search(@Query('q') keyword: string, @Query('limit') limit?: number, @Query('locale') locale?: string) {
    return this.productsService.search(keyword, limit, locale || 'en');
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.productsService.findBySlug(slug, locale || 'en');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ type: ProductResponseDto })
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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  @ApiOkResponse({ type: ProductResponseDto })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Query('locale') locale?: string) {
    return this.productsService.update(id, updateProductDto, locale || 'en');
  }

  @Patch(':id/variants/:sku/stock')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update variant stock' })
  @ApiOkResponse({ type: ProductResponseDto })
  updateVariantStock(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @Body('stock', ParseIntPipe) stock: number,
    @Query('locale') locale?: string,
  ) {
    return this.productsService.updateVariantStock(id, sku, stock, locale || 'en');
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
