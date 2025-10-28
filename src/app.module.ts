import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import dbConfig from './config/db.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { MailModule } from './modules/mail/mail.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ColorsModule } from './modules/colors/colors.module';
import { SizesModule } from './modules/sizes/sizes.module';
import { ProductsModule } from './modules/products/products.module';
import { OtpModule } from './modules/otp_service/otp.module';
import { PaypalModule } from './modules/paypal/paypal.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig],
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
    AuthModule,
    UsersModule,
    FilesModule,
    MailModule,
    AddressesModule,
    OtpModule,
    ProductsModule,
    ColorsModule,
    SizesModule,
    PaypalModule,
  ],
})
export class AppModule {}
