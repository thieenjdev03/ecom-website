# NestJS E-commerce Server

Dự án NestJS E-commerce với cấu trúc module hoàn chỉnh.

## Cấu trúc dự án

```
src/
├── config/              # Cấu hình ứng dụng
│   ├── app.config.ts
│   └── db.config.ts
├── common/              # Tiện ích dùng chung
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── dtos/
├── database/            # Cấu hình database và migrations
│   ├── typeorm.config.ts
│   └── migrations/
├── modules/             # Các module chính
│   ├── auth/           # Xác thực JWT
│   ├── users/          # Quản lý người dùng
│   ├── products/       # Quản lý sản phẩm
│   ├── categories/     # Quản lý danh mục
│   ├── orders/         # Quản lý đơn hàng
│   ├── payments/       # Tích hợp PayPal
│   ├── files/          # Upload file với Cloudinary
│   └── mail/           # Gửi email với MailerSend
├── main.ts
└── app.module.ts
```

## Cài đặt

1. Clone repository
2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `env.example`:
```bash
cp env.example .env
```

4. Cập nhật các biến môi trường trong `.env`

5. Chạy migration:
```bash
npm run migration:run
```

6. Khởi động ứng dụng:
```bash
npm run start:dev
```

## Scripts

- `npm run start:dev` - Chạy ứng dụng ở chế độ development
- `npm run build` - Build ứng dụng
- `npm run lint` - Lint code
- `npm run test` - Chạy tests
- `npm run migration:generate` - Tạo migration mới
- `npm run migration:run` - Chạy migrations
- `npm run migration:revert` - Revert migration cuối cùng

## API Endpoints

### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Đăng xuất

### Users
- `GET /users` - Lấy danh sách users
- `POST /users` - Tạo user mới
- `GET /users/:id` - Lấy thông tin user
- `PATCH /users/:id` - Cập nhật user
- `DELETE /users/:id` - Xóa user

### Products
- `GET /products` - Lấy danh sách sản phẩm
- `POST /products` - Tạo sản phẩm mới
- `GET /products/:id` - Lấy thông tin sản phẩm
- `PATCH /products/:id` - Cập nhật sản phẩm
- `DELETE /products/:id` - Xóa sản phẩm

### Categories
- `GET /categories` - Lấy danh sách danh mục
- `POST /categories` - Tạo danh mục mới
- `GET /categories/:id` - Lấy thông tin danh mục
- `PATCH /categories/:id` - Cập nhật danh mục
- `DELETE /categories/:id` - Xóa danh mục

### Orders
- `GET /orders` - Lấy danh sách đơn hàng
- `POST /orders` - Tạo đơn hàng mới
- `GET /orders/:id` - Lấy thông tin đơn hàng
- `PATCH /orders/:id` - Cập nhật đơn hàng
- `DELETE /orders/:id` - Xóa đơn hàng

### Payments
- `POST /payments/paypal/create` - Tạo PayPal order
- `POST /payments/paypal/capture/:orderId` - Capture PayPal order
- `POST /payments/paypal/webhook` - PayPal webhook

### Files
- `GET /files/cloudinary/signature` - Lấy Cloudinary signature
- `POST /files/upload` - Upload file

### Mail
- `POST /mail/order-confirmation` - Gửi email xác nhận đơn hàng
- `POST /mail/password-reset` - Gửi email reset mật khẩu
- `POST /mail/welcome` - Gửi email chào mừng

## Công nghệ sử dụng

- **Framework**: NestJS
- **Database**: PostgreSQL với TypeORM
- **Authentication**: JWT
- **File Upload**: Cloudinary
- **Payment**: PayPal
- **Email**: MailerSend
- **Validation**: class-validator
- **Documentation**: Swagger

## Tính năng chính

- ✅ Authentication & Authorization với JWT
- ✅ CRUD Users, Products, Categories, Orders
- ✅ File upload với Cloudinary
- ✅ Payment integration với PayPal
- ✅ Email service với MailerSend
- ✅ Global validation, filters, interceptors
- ✅ Database migrations
- ✅ Environment configuration
- ✅ CORS và security headers
# ecom-website
# ecom-website
