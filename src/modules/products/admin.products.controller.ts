import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateFullProductDto } from './dto/create-full-product.dto';

@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('full')
  createFull(@Body() dto: CreateFullProductDto) {
    return this.productsService.createFull(dto);
  }


  @Post(':id/variants/generate')
  generateVariants(
    @Param('id') productId: string,
    @Body()
    combinations: {
      sku: string;
      name?: string;
      priceOriginal: string;
      priceFinal?: string;
      currency?: string;
      stockOnHand?: number;
      thumbnailUrl?: string;
    }[],
  ) {
    return this.productsService.generateVariantsFromCombinations(productId, combinations);
  }

  @Patch('variants/:id')
  updateVariant(@Param('id') id: string, @Body() dto: any) {
    return this.productsService.updateVariant(id, dto);
  }

  @Patch('variants/:id/stock')
  adjustStock(@Param('id') id: string, @Body() payload: { stockOnHand: number }) {
    return this.productsService.adjustVariantStock(id, payload.stockOnHand);
  }

  @Post(':id/media')
  addMedia(
    @Param('id') productId: string,
    @Body()
    payload: { url: string; type?: 'image' | 'video'; position?: number; isPrimary?: boolean; isHover?: boolean; variantId?: string | null; alt?: string }[],
  ) {
    return this.productsService.addMedia(productId, payload);
  }
}


