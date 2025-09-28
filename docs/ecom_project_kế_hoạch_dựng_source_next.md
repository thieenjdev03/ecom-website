# Mục tiêu

Dựng nhanh bộ mã nguồn (source) cho dự án Ecom gồm **Landing Page**, **Dashboard quản trị (Minimals + Next.js)** và **Backend NestJS**, có CI/CD, Docker, cơ sở dữ liệu, xác thực, tài liệu API.

> Lưu ý cách diễn giải: sau mỗi thuật ngữ chuyên môn sẽ có giải thích ngắn gọn trong ngoặc.

---

## 0) Kiến trúc tổng quan

```
monorepo (pnpm + Turborepo – bộ công cụ quản lý nhiều project trong 1 repo, tối ưu lệnh build)
├─ apps/
│  ├─ web-landing (Next.js – framework React cho web, thư mục app/)
│  ├─ web-admin (Next.js + Minimals – template dashboard)
│  └─ api (NestJS – framework backend TypeScript kiểu module)
├─ packages/
│  ├─ ui (thư viện UI dùng chung: components, theme, hooks)
│  ├─ config (eslint, tsconfig, tailwind, zod schemas dùng lại)
│  └─ api-client (client sinh tự động từ OpenAPI – đặc tả API sinh mã)
├─ infra/ (docker-compose, k8s manifest, scripts)
└─ .gitlab-ci.yml (pipeline CI/CD GitLab)
```

**Thành phần hạ tầng dev:**

- **PostgreSQL** (CSDL quan hệ, đáng tin cậy)
- **Redis** (cache/bộ nhớ đệm, giữ session/tốc độ)
- **MinIO** (S3-compatible storage – kho ảnh/object dev nội bộ)
- **MailHog** (SMTP giả lập – test email)
- **Traefik/NGINX** (reverse proxy – điều phối route http nội bộ, tuỳ chọn)

---

## 1) Khởi tạo repo & công cụ nền tảng

**1.1 Monorepo**

- Chọn **pnpm** (trình quản lý gói nhanh) + **Turborepo** (chạy lệnh build/test theo cache) để quản lý nhiều app.
- Alternatives: **Nx** (bộ công cụ monorepo đầy đủ), nhưng Turborepo đủ nhẹ.

**1.2 Chuẩn code**

- **ESLint** (kiểm tra lỗi code), **Prettier** (định dạng), **Husky** + **lint-staged** (hook kiểm tra trước khi commit), **Commitlint** (chuẩn hoá message).

**1.3 Cấu trúc nhánh Git**

- `main` (ổn định sản xuất), `develop` (tích hợp), `feat/*`, `fix/*`, `chore/*`.

---

## 2) Frontend – Next.js

Tách 2 app: `web-landing` (marketing/SEO) và `web-admin` (dashboard Minimals).

**2.1 Công nghệ & thư viện**

- **Next.js 14/15 (app router)**, **TypeScript**.
- **Tailwind CSS** (utility-first CSS – class tiện dụng), **shadcn/ui** (bộ components sẵn), **Framer Motion** (animation), **Lucide** (icon).
- **React Hook Form** (quản lý form), **Zod** (schema validate – kiểm tra dữ liệu), **TanStack Query/React Query** (data fetching + cache – quản lý trạng thái server), **Axios** (HTTP client).
- **next-intl** hoặc **next-translate** (i18n – đa ngôn ngữ) nếu cần.
- **next-seo** (SEO meta), **Sentry** (theo dõi lỗi – optional).

**2.2 Tích hợp Minimals cho web-admin**

- Import template Minimals vào `apps/web-admin`.
- Chuẩn hoá theme (màu, font Inter), layout, sidebar/menu, breadcrumb.

**2.3 Kiến trúc code frontend**

```
apps/web-admin/
├─ app/ (app router: layout.tsx, page.tsx, route groups)
├─ features/ (mỗi domain: users, products, orders, …)
│  └─ products/
│     ├─ pages (danh sách/chi tiết)
│     ├─ components (table, form)
│     ├─ hooks (useProductQuery, …)
│     └─ schemas (zod schemas)
├─ lib/ (helpers, axios instance, auth utils)
└─ types/ (type chung)
```

**2.4 Xác thực (Auth) phía FE**

- Dùng **next-auth** (thư viện auth) với **Credentials Provider** gọi API NestJS `/auth/login` trả về **JWT** (JSON Web Token – mã xác thực), lưu **httpOnly cookie** (an toàn XSS) + refresh token.
- Guard route admin (middleware) kiểm tra quyền (RBAC – phân quyền theo vai trò).

**2.5 Các trang chính**

- Landing: Home, Features, Pricing, Blog, Contact, Auth (Sign-in/Up), Legal.
- Admin: Dashboard (KPIs), Orders, Products, Categories, Inventory, Users, Roles/Permissions, Coupons, Settings, CMS (bài viết/FAQ), Files.

**2.6 UX công cụ**

- Bảng (DataTable) có tìm kiếm, sort, filter, paginate.
- Form CRUD dùng `react-hook-form` + `zodResolver`.
- Upload ảnh → MinIO/S3 qua signed URL (URL ký – quyền tạm thời để upload trực tiếp).

---

## 3) Backend – NestJS

**3.1 Module hoá**

```
apps/api/src/
├─ app.module.ts
├─ common/ (pipes – ống xử lý, filters – bắt lỗi, interceptors – chặn/chuyển đổi, decorators – chú thích)
├─ config/ (dotenv, config module)
├─ database/ (PrismaService/TypeORM DataSource, migrations – phiên bản DB)
├─ modules/
│  ├─ auth/ (JWT, refresh, RBAC)
│  ├─ users/
│  ├─ products/ (product, variant, attribute, category, media)
│  ├─ inventory/ (stock, warehouses)
│  ├─ carts/ (cart, cart_item)
│  ├─ orders/ (order, order_item, address, status)
│  ├─ payments/ (provider: PayPal/Stripe stub – điểm tích hợp sau)
│  ├─ shipments/ (đơn vị vận chuyển, phí – stub)
│  ├─ cms/ (posts, pages, faq)
│  └─ files/ (presigned S3/MinIO)
└─ main.ts (bootstrap, global pipes, versioning)
```

**3.2 CSDL & ORM**

- Ưu tiên **Prisma** (ORM hiện đại, migration nhanh) hoặc **TypeORM** (truyền thống Nest hay dùng). Ở đây chọn **Prisma** cho MVP.

**3.3 Mô hình dữ liệu (tối thiểu)**

- **User**(id, email, password\_hash, role, name, phone, …)
- **Product**(id, name, slug, description, price, currency, status, categoryId, …)
- **ProductVariant**(sku, options, price, stock)
- **Category**(tree – cây danh mục)
- **Media**(url, type)
- **Cart/CartItem**
- **Order/OrderItem**(status, total, paymentStatus, shipmentStatus)
- **Address**(userId, type: shipping/billing)
- **Coupon**(code, discount, rules)

**3.4 API chuẩn & Versioning**

- REST v1: `/api/v1/...`, mở **Swagger** (UI tài liệu API tự động) tại `/docs`.
- Tạo **OpenAPI JSON** → sinh **api-client** package dùng cho FE.

**3.5 Bảo mật**

- **Helmet** (headers an toàn), **CORS** (chính sách nguồn chéo), rate limit (giới hạn tần suất), audit log (theo dõi tác vụ admin).
- Lưu **refresh token** dạng hashed trong DB; revoke khi logout.

**3.6 Email & Files**

- SMTP: MailHog trong dev. Template email (Handlebars/Nunjucks).
- Upload: presigned URL tới MinIO (S3 compatible), hoặc qua API gateway tuỳ yêu cầu.

---

## 4) Hạ tầng Dev – Docker Compose

**4.1 docker-compose.dev.yml (ví dụ rút gọn)**

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ecom
      POSTGRES_USER: ecom
      POSTGRES_PASSWORD: ecom
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: miniopass
    ports: ["9000:9000", "9001:9001"]
    volumes:
      - minio:/data

  mailhog:
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]

volumes:
  pgdata:
  minio:
```

**4.2 .env mẫu (dev)**

```
# Backend
DATABASE_URL="postgresql://ecom:ecom@localhost:5432/ecom?schema=public"
JWT_ACCESS_SECRET="dev_access_secret"
JWT_REFRESH_SECRET="dev_refresh_secret"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minio"
S3_SECRET_KEY="miniopass"
S3_BUCKET="ecom"
MAIL_HOST="localhost"
MAIL_PORT=1025
MAIL_USER=""
MAIL_PASS=""
APP_URL="http://localhost:3000"
ADMIN_URL="http://localhost:3001"

# Frontend
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_S3_PUBLIC_URL="http://localhost:9000/ecom"
```

---

## 5) Luồng Auth tiêu chuẩn

1. FE gửi email/password → `POST /auth/login`.
2. API xác thực, trả **access token** (sống ngắn) + set **refresh token** vào httpOnly cookie.
3. FE đính kèm access token gọi API tiếp; khi hết hạn → gọi `/auth/refresh`.
4. Logout → xoá refresh token trong DB & xoá cookie.

---

## 6) Pipeline CI/CD (GitLab)

**.gitlab-ci.yml (rút gọn ý tưởng)**

- Stages: `lint` → `test` → `build` → `deploy`.
- Job lint/test chạy cho `apps/*` theo thay đổi (turborepo cache).
- Build Docker image: `api`, `web-admin`, `web-landing`.
- Deploy: môi trường `dev` (Docker Compose) / `prod` (k8s tuỳ chọn).

---

## 7) Definition of Done (MVP)

- ✅ Monorepo chạy `pnpm install`, `pnpm dev` cho 3 app.
- ✅ Docker Compose up: Postgres, Redis, MinIO, MailHog OK.
- ✅ Prisma migrate + seed admin.
- ✅ Auth: đăng nhập/đăng xuất/refresh, RBAC Admin/User.
- ✅ CRUD Products/Categories/Media (upload ảnh) từ admin.
- ✅ Orders xem danh sách/chi tiết; cập nhật status.
- ✅ Landing có trang chủ + pricing + contact form (gửi vào MailHog).
- ✅ Swagger docs + OpenAPI client dùng ở FE.

---

## 8) Kế hoạch thực thi theo ngày (tham khảo)

**Ngày 1–2**: Monorepo, Docker, Postgres/Redis/MinIO/MailHog, Next.js trống, NestJS skeleton.

**Ngày 3–4**: Auth (login/refresh), Prisma schema, seed, Swagger, OpenAPI client.

**Ngày 5–6**: Admin Minimals: layout, menu, bảng Products/Categories, form CRUD, upload ảnh (presigned URL).

**Ngày 7**: Orders/Users cơ bản, Landing pages, contact form.

**Ngày 8**: CI/CD rút gọn, hardening bảo mật, review & polish.

---

## 9) Danh sách endpoint (rút gọn)

- `POST /auth/login` `POST /auth/refresh` `POST /auth/logout`
- `GET /users/me` `GET /users` `POST /users` …
- `GET /products` `POST /products` `PATCH /products/:id` `DELETE /products/:id`
- `GET /categories` `POST /categories` …
- `POST /files/presign` (tạo URL ký)
- `GET /orders` `GET /orders/:id` `PATCH /orders/:id`

---

## 10) Prisma schema (ví dụ rút gọn)

```prisma
model User {
  id            String  @id @default(cuid())
  email         String  @unique
  passwordHash  String
  name          String?
  role          Role    @default(USER)
  addresses     Address[]
  orders        Order[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Role { ADMIN USER }

model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  parentId  String?
  parent    Category? @relation("CategoryToCategory", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryToCategory")
  products  Product[]
}

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10,2)
  currency    String   @default("VND")
  status      String   @default("ACTIVE")
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  String
  media       Media[]
  variants    ProductVariant[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProductVariant {
  id        String  @id @default(cuid())
  product   Product @relation(fields: [productId], references: [id])
  productId String
  sku       String  @unique
  price     Decimal @db.Decimal(10,2)
  stock     Int     @default(0)
}

model Media {
  id        String  @id @default(cuid())
  url       String
  type      String
  product   Product? @relation(fields: [productId], references: [id])
  productId String?
}
```
Phần 9: Bổ sung đầy đủ code Cloudinary
	•	NestJS: FilesModule, FilesService ký signature, FilesController (GET /files/cloudinary/signature).
	•	Next.js (Admin): trang upload trực tiếp lên Cloudinary, form FormData, nhận secure_url.
	•	Entity Media (TypeORM) + lưu metadata.
	•	Ghi chú bảo mật & vận hành.
	•	Phần 11: MailerSend (NestJS)
	•	MailModule, MailService gọi API https://api.mailersend.com/v1/email, ví dụ gửi bằng template + variables.
Phần 12: TypeORM Quickstart
	•	data-source.ts, scripts m:gen/m:run/m:revert, hướng dẫn tạo migration đầu tiên.
Phần 13: Component CloudinaryUploader tái sử dụng cho Admin.
Phần 14: Notes bảo mật & hiệu năng (CSP, giới hạn file, retry/backoff).