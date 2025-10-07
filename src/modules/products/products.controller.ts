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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProductDto, ProductVariantDto } from './dto/product-response.dto';

@ApiTags('Products')
@ApiBearerAuth('bearer')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product with optional variants' })
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({ description: 'Product created', type: ProductDto })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  @ApiOkResponse({ description: 'List of products', type: [ProductDto] })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Product details', type: ProductDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ description: 'Updated product', type: ProductDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Product deleted' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.remove(id);
  }

  // Colors
  @Post(':id/colors')
  @ApiOperation({ summary: 'Add colors to product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Product with updated colors', type: ProductDto })
  addColors(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('colorIds') colorIds: string[],
  ) {
    return this.productsService.addColors(id, colorIds);
  }

  @Delete(':id/colors/:colorId')
  @ApiOperation({ summary: 'Remove one color from product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiParam({ name: 'colorId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Product with updated colors', type: ProductDto })
  removeColor(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('colorId', new ParseUUIDPipe()) colorId: string,
  ) {
    return this.productsService.removeColor(id, colorId);
  }

  // Sizes
  @Post(':id/sizes')
  @ApiOperation({ summary: 'Add sizes to product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Product with updated sizes', type: ProductDto })
  addSizes(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('sizeIds') sizeIds: string[],
  ) {
    return this.productsService.addSizes(id, sizeIds);
  }

  @Delete(':id/sizes/:sizeId')
  @ApiOperation({ summary: 'Remove one size from product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiParam({ name: 'sizeId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Product with updated sizes', type: ProductDto })
  removeSize(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('sizeId', new ParseUUIDPipe()) sizeId: string,
  ) {
    return this.productsService.removeSize(id, sizeId);
  }

  // Variants
  @Post(':id/variants')
  @ApiOperation({ summary: 'Add a new variant to product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiCreatedResponse({ description: 'Variant created', type: ProductVariantDto })
  addVariant(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() variantDto: CreateVariantDto,
  ) {
    return this.productsService.addVariant(id, variantDto);
  }

  @Patch(':id/variants/:variantId')
  @ApiOperation({ summary: 'Update a variant' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiParam({ name: 'variantId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Updated variant', type: ProductVariantDto })
  updateVariant(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('variantId', new ParseUUIDPipe()) variantId: string,
    @Body() updateData: Partial<CreateVariantDto>,
  ) {
    return this.productsService.updateVariant(id, variantId, updateData);
  }

  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a variant' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiParam({ name: 'variantId', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Variant deleted' })
  removeVariant(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('variantId', new ParseUUIDPipe()) variantId: string,
  ) {
    return this.productsService.removeVariant(id, variantId);
  }

  @Post(':id/variants/bulk')
  @ApiOperation({ summary: 'Add multiple variants to product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiCreatedResponse({ description: 'Variants created', type: [ProductVariantDto] })
  addVariantsBulk(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() variantDtos: CreateVariantDto[],
  ) {
    return this.productsService.addVariantsBulk(id, variantDtos);
  }
}


