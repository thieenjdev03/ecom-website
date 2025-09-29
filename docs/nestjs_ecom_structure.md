# Cấu trúc dự án NestJS E-commerce (bản đơn giản)

## 1) Cấu trúc thư mục gọn

    apps/api/
      src/
        main.ts
        app.module.ts
        config/              # cấu hình .env (config = cấu hình typed)
          app.config.ts
          db.config.ts
        common/              # tiện ích dùng chung
          guards/
          interceptors/
          filters/
          dto/
        database/
          typeorm.config.ts  # DataSource (kết nối DB)
          migrations/
        modules/
          auth/
          users/
          products/
          categories/
          orders/
          payments/          # Paypal
          files/             # Cloudinary (ký signature)
          mail/              # MailerSend

## 2) Module bắt buộc (MVP)

-   auth: login/refresh/logout (JWT), guard role.
-   users: CRUD user + địa chỉ.
-   products + categories: CRUD sản phẩm/danh mục; attach media.
-   orders: tạo đơn từ giỏ, cập nhật trạng thái.
-   payments (paypal): create order → capture → webhook update.
-   files (cloudinary): endpoint ký signature để FE upload trực tiếp.
-   mail (mailersend): gửi email đơn hàng, reset mật khẩu.

## 3) TypeORM & Migration

**database/typeorm.config.ts**

``` ts
import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../modules/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
```

## 4) Entities tối thiểu

``` ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column() passwordHash: string;
  @Column({ default: 'USER' }) role: 'ADMIN' | 'USER';
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ unique: true }) slug: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'numeric', precision: 10, scale: 2 }) price: string;
  @Column({ default: 'VND' }) currency: string;
  @Column({ default: 'ACTIVE' }) status: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) total: string;
  @Column({ default: 'PENDING' }) status: string;
}
```

## 5) Controller/Service mẫu

``` ts
@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}
  @Post() create(@Body() dto: CreateProductDto) { return this.svc.create(dto); }
  @Get() findAll() { return this.svc.findAll(); }
}
```

## 6) Paypal & Cloudinary & MailerSend

-   payments: gọi PayPal API (create/capture/webhook).
-   files: ký Cloudinary signature cho upload trực tiếp.
-   mail: MailerSend API để gửi transactional email.

## 7) app.module.ts

``` ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: () => (require('./database/typeorm.config').default.options) }),
    AuthModule, UsersModule, ProductsModule, CategoriesModule, OrdersModule,
    PaymentsModule, FilesModule, MailModule,
  ],
})
export class AppModule {}
```

## 8) .env (tối thiểu)

    DATABASE_URL=postgresql://ecom:ecom@localhost:5432/ecom
    JWT_ACCESS_SECRET=dev_access_secret
    JWT_REFRESH_SECRET=dev_refresh_secret

    CLOUDINARY_CLOUD_NAME=xxx
    CLOUDINARY_API_KEY=xxx
    CLOUDINARY_API_SECRET=xxx

    MAILERSEND_API_TOKEN=ms_xxx
    MAIL_FROM_EMAIL=noreply@yourdomain.com
    MAIL_FROM_NAME=Your Brand

    PAYPAL_CLIENT_ID=xxx
    PAYPAL_CLIENT_SECRET=xxx
    PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
    PAYPAL_WEBHOOK_ID=xxx

## 9) Checklist dựng nhanh

-   [ ] nest new api → thêm TypeORM + Postgres.
-   [ ] Tạo entities: User, Product, Category, Order.
-   [ ] m:gen + m:run (migration đầu tiên).
-   [ ] Viết auth, guard RolesGuard.
-   [ ] CRUD products/categories.
-   [ ] files (Cloudinary), mail (MailerSend).
-   [ ] payments (Paypal).
-   [ ] Bật Swagger (/docs) và CORS/Helmet.
