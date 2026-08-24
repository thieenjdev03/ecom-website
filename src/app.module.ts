import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import dbConfig from './config/db.config';
import shippingConfig from './config/shipping.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { MailModule } from './modules/mail/mail.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ColorsModule } from './modules/colors/colors.module';
import { SizesModule } from './modules/sizes/sizes.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OtpModule } from './modules/otp_service/otp.module';
import { PaypalModule } from './modules/paypal/paypal.module';
import { HealthModule } from './modules/health/health.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { CareersModule } from './modules/careers/careers.module';
import { BrandsModule } from './modules/brands/brands.module';
import { HomepageModule } from './modules/homepage/homepage.module';
import { DistributorsModule } from './modules/distributors/distributors.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { CartModule } from './modules/cart/cart.module';
import { PointsModule } from './modules/points/points.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { AuditModule } from './audit/audit.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, shippingConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get('database') as any;
        return {
          ...databaseConfig,
          autoLoadEntities: true,
          ssl: process.env.DATABASE_URL?.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    FilesModule,
    MailModule,
    AddressesModule,
    OtpModule,
    ProductsModule,
    OrdersModule,
    ColorsModule,
    SizesModule,
    PaypalModule,
    ShippingModule,
    MarketingModule,
    CollectionsModule,
    CareersModule,
    BrandsModule,
    HomepageModule,
    DistributorsModule,
    PoliciesModule,
    CartModule,
    PointsModule,
    CheckoutModule,
    AuditModule,
  ],
})
export class AppModule {}
