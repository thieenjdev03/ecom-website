import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin.products.controller';
import { Product } from './product.entity';
import { ProductVariant } from './entity/product-variant.entity';
import { ProductMedia } from './entity/product-media.entity';
import { ProductAttribute } from './entity/product-attribute.entity';
import { ProductPriceRule } from './entity/product-price-rule.entity';
import { GlobalOption } from './entity/option.entity';
import { GlobalOptionValue } from './entity/option-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      GlobalOption,
      GlobalOptionValue,
      ProductVariant,
      ProductMedia,
      ProductAttribute,
      ProductPriceRule,
    ]),
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
