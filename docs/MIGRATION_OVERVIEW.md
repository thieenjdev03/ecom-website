# Tài liệu tổng quan hệ thống – phục vụ Migration

> Mục đích: Tài liệu này mô tả kiến trúc, data model, business logic và các điểm tích hợp hiện tại của backend `ecom-website`, để làm đầu vào cho việc **migrate sang một nền tảng bán hàng khác** (Shopify/Medusa/Saleor, hoặc một hệ thống tự viết khác). Đọc xong tài liệu này, một đội kỹ thuật khác không cần đọc code vẫn có thể lập kế hoạch mapping dữ liệu và tính năng.

---

## 1. Tóm tắt hệ thống

| | |
|---|---|
| Loại | REST API backend cho e-commerce |
| Framework | NestJS 11 (Express) |
| Ngôn ngữ | TypeScript |
| DB | PostgreSQL (TypeORM 0.3, migration-based, `synchronize: false`) |
| Auth | JWT (access token) + refresh token hash lưu trong bảng `user` |
| Thanh toán | PayPal (Checkout Server SDK), có webhook |
| Ảnh/File | Cloudinary (client ký signature, upload trực tiếp từ FE) |
| Email | Resend (chính) + SMTP nodemailer (dự phòng) |
| Phí vận chuyển | Google Sheets (đọc realtime qua Google Sheets API, cache TTL) — **không** có bảng shipping-rate trong DB |
| Đa ngôn ngữ | Có — các trường sản phẩm (`name`, `slug`, `description`...) lưu dạng JSONB `{ "en": "...", "vi": "..." }` |
| Đa tiền tệ | Không rõ ràng — `currency` lưu trong `summary` của order (JSONB), mặc định theo config shipping (VND) |
| Không có giỏ hàng (cart) entity | Đơn hàng được tạo thẳng từ payload FE gửi lên (xem seed script `seed:carts` chỉ là dữ liệu mock, không có `CartModule` trong `app.module.ts`) |

---

## 2. Kiến trúc & cấu trúc thư mục

```
src/
├── app.module.ts            # Root module — nạp tất cả feature module
├── main.ts                  # Bootstrap: body-parser custom cho PayPal webhook, Swagger tại /docs
├── config/                  # app.config, db.config, shipping.config (ConfigModule)
├── database/                # typeorm.config.ts (dùng cho CLI migration)
├── database/migrations/     # (RỖNG — xem mục 8 "Nợ kỹ thuật")
├── migrations/              # migration thật nằm ở đây (11 file)
├── common/                  # guards, interceptors, filters dùng chung
├── auth/                    # ⚠ module auth "cũ" — xem mục 8
└── modules/
    ├── auth/                # module auth thật được app.module.ts sử dụng
    ├── users/                # User, Address liên kết, phone numbers, wishlist
    ├── addresses/            # Sổ địa chỉ giao/nhận hàng
    ├── products/             # Product + Category
    ├── colors/, sizes/, variants/   # Thuộc tính biến thể (variants/ gần như không dùng — xem mục 8)
    ├── collections/          # Bộ sưu tập sản phẩm (many-to-many qua product_collections)
    ├── orders/                # Order, OrderStatus, tracking history
    ├── paypal/                # Tích hợp thanh toán PayPal + log webhook event
    ├── shipping/              # Tính phí ship từ Google Sheets
    ├── marketing/              # Thu thập email marketing (newsletter/checkout opt-in)
    ├── otp_service/            # OTP xác thực email
    ├── files/                  # Cloudinary signature/upload
    ├── mail/                   # Gửi email transactional
    └── health/                 # Healthcheck
```

Điểm đáng chú ý về kiến trúc: đây là **monolith module hóa theo domain** (mỗi domain có entity/dto/service/controller riêng), không theo CQRS, không event bus, không queue. Toàn bộ business logic nằm trong `*.service.ts`, gọi thẳng TypeORM repository.

---

## 3. Data model (nguồn sự thật để migrate dữ liệu)

### 3.1 Product (`products`)
Trường quan trọng nhất khi migrate — không giống model chuẩn của Shopify/Medusa:

- `name`, `slug`, `description`, `short_description`, `meta_title`, `meta_description`: **JSONB đa ngôn ngữ** dạng `{ [locale]: string | null }` (không phải string đơn).
- `price`, `sale_price`, `cost_price`: decimal(10,2) — **ở cấp Product**, không ở cấp variant.
- `variants`: **mảng JSONB nhúng trong bản ghi Product** (`ProductVariant[]`), KHÔNG phải bảng riêng dù có entity `Variant` — mỗi phần tử gồm `name` (đa ngôn ngữ), `color_id`, `size_id`, `sku`, `price`, `stock`, `barcode`, `image_url`. `color_id`/`size_id` tham chiếu tới bảng `colors`/`sizes` nhưng không có FK constraint DB thật (chỉ là uuid string trong JSON).
- `images`: mảng URL (JSONB), ảnh đầu tiên dùng làm thumbnail mặc định.
- `stock_quantity`: tồn kho tổng (ngoài tồn kho theo từng variant trong JSON `variants[].stock`).
- `category_id`: FK tới `categories` (1 sản phẩm chỉ có 1 category).
- `status`: enum string `active | inactive | draft | out_of_stock | discontinued`.
- `tags`: mảng string JSONB.
- `weight`, `dimensions` (length/width/height): dùng để tính phí ship.
- Soft delete qua `deleted_at` (TypeORM `@DeleteDateColumn`).
- Sản phẩm — Collection: many-to-many qua bảng nối `product_collections` (unique `product_id + collection_id`).

**Điểm cần lưu ý khi map sang platform khác**: hầu hết platform (Shopify, Medusa) coi *variant* là entity độc lập có SKU/giá/tồn kho riêng và product chỉ là "container". Ở đây variant là JSON lồng trong product → khi export cần "flatten" từng phần tử `variants[]` thành variant record ở hệ thống đích, và bản thân Product cũng có `price`/`stock_quantity` riêng cần quyết định map vào đâu (variant mặc định, hay bỏ).

### 3.2 Category (`categories`)
Cây phân cấp qua `parent_id` tự tham chiếu (self-referencing FK), có `display_order`, `is_active`, `slug` unique.

### 3.3 Collection (`collections`) + `product_collections`
Collection có `slug` unique, `banner_image_url`, SEO fields, `is_active`. Quan hệ N-N với Product qua bảng nối riêng (không nhúng JSON) — dùng cursor-based pagination (xem `docs/collections_api_payloads.md`).

### 3.4 Color / Size (`colors`, `sizes`)
- `colors`: `name`, `hex_code`, `image_url` — dùng chung toàn hệ thống (không gắn riêng theo category).
- `sizes`: `name`, `sort_order`, và **có FK tới `categories`** (size là theo category, ví dụ size giày khác size áo).
- `variants` entity/table tồn tại (`name` field) nhưng **không thấy được sử dụng** ở Product (product tự nhúng `ProductVariant` JSON, không FK tới bảng `variants`) — nghi ngờ là code mồ côi.

### 3.5 User (`user`) + phụ trợ
- `user`: email unique, `passwordHash`, `role` (enum Postgres `admin|user`), `refreshTokenHash`, `profile`.
- `user_phone_numbers`: nhiều số điện thoại/1 user, có `label` (home/work/other), `isPrimary`.
- `user_wishlist_products` (`UserWishlist`): **Unique theo `userId`** — nghĩa là schema hiện tại chỉ cho phép **1 dòng wishlist / user** với 1 trường `note` text, KHÔNG có cột chứa danh sách product id rõ ràng trong entity đã đọc (cần đối chiếu lại DTO/migration thực tế trước khi migrate, có thể danh sách sản phẩm được lưu ở nơi khác hoặc đây là thiết kế dở dang).
- `addresses`: sổ địa chỉ, tách rõ `province/district/ward/streetLine1/streetLine2`, có `isShipping`/`isBilling`/`isDefault`, toạ độ `latitude/longitude`.

### 3.6 Order (`orders`)
- **Không có bảng `order_items` riêng** — `items: OrderItem[]` và `summary: OrderSummary` (subtotal/shipping/tax/discount/total/currency) đều là JSONB snapshot tại thời điểm đặt hàng (chuẩn "denormalized snapshot" — tốt cho migrate vì đã đóng gói sẵn, nhưng khó join/aggregate bằng SQL).
- `status`: enum string dài với 14 trạng thái vận chuyển chi tiết (`PENDING_PAYMENT → PAID → PROCESSING → PACKED → READY_TO_GO → AT_CARRIER_FACILITY → IN_TRANSIT → ARRIVED_IN_COUNTRY → AT_LOCAL_FACILITY → OUT_FOR_DELIVERY → DELIVERED`, cộng `CANCELLED/FAILED/REFUNDED`) — thiết kế cho **shipping xuyên biên giới** (cross-border, có "arrived in country").
- `tracking_history: TrackingHistoryItem[]` (JSONB) — audit trail mọi lần đổi status kèm `changed_by`.
- Liên kết `shippingAddressId`/`billingAddressId` tới bảng `addresses` (snapshot theo id, không copy toàn bộ địa chỉ vào order — rủi ro nếu address bị sửa/xoá sau khi đặt hàng).
- PayPal fields nhúng thẳng vào Order: `paypalOrderId`, `paypalTransactionId`, `paidAmount`, `paidCurrency`, `paidAt`.

### 3.7 PayPal event log (`paypal_events`)
Lưu toàn bộ webhook payload (`rawData` jsonb) để idempotency (unique `eventId`) và audit.

### 3.8 Marketing (`marketing_contacts`)
Email opt-in, `source` (register/modal/checkout/import), `tags` jsonb, `subscribed`/`unsubscribedAt` — dùng cho newsletter, tách biệt khỏi `user`.

### 3.9 OTP (`email_otps`)
OTP 6 số theo email, có `expiresAt`, `isVerified`.

### 3.10 Sơ đồ quan hệ (rút gọn)

```
User 1───N Address
User 1───1 UserWishlist
User 1───N Order
Order N───1 Address (shipping) , N───1 Address (billing)
Order N───1 User
Category 1───N Category (self, parent/children)
Category 1───N Product
Category 1───N Size
Product N───N Collection  (qua product_collections)
Product 1───N ProductVariant   (nhúng JSON, KHÔNG phải bảng)
PaypalEvent  (độc lập, liên kết lỏng lẻo qua orderId string)
MarketingContact  (độc lập, liên kết lỏng lẻo qua userId string)
```

---

## 4. API surface (theo controller thực tế)

| Module | Base path (suy ra) | Ghi chú |
|---|---|---|
| auth | `/auth` | login, refresh, logout, roles guard, JWT strategy |
| users | `/users`, `/me`, `/users/:id/phones`, `/users/:id/wishlist` | CRUD user, profile, phone, wishlist |
| products | `/products`, `/categories` | filter theo `collection_id` (mới thêm), search, variant stock update |
| collections | `/collections` | CRUD + cursor pagination |
| colors, sizes | `/colors`, `/sizes` | thuộc tính biến thể, size gắn theo category |
| addresses | `/addresses` | sổ địa chỉ user |
| orders | `/orders` | tạo đơn, đổi status (có lịch sử), tra cứu theo order number / paypal order id |
| paypal | `/paypal` (webhook tại `/paypal/webhook`) | create/capture order, webhook xử lý raw body riêng |
| shipping | `/shipping` | tính phí ship real-time từ Google Sheet |
| marketing | `/marketing` | đăng ký nhận email |
| otp_service | `/otp` | gửi/xác thực OTP email |
| files | `/files` | Cloudinary signature, upload |
| mail | `/mail` | gửi email transactional (order confirmation, reset password, welcome) |
| health | `/health` | healthcheck |

Toàn bộ API có **Swagger tự sinh tại `/docs`** (`/docs/json`, `/docs/yaml`) — đây là nguồn OpenAPI spec chính xác nhất, nên **export file này trước khi migrate** (`npm run openapi:export`) làm hợp đồng API tham chiếu.

---

## 5. Auth & phân quyền

- JWT access token, payload gồm `userId`, `role`, `ver` (version — dùng để revoke token hàng loạt khi đổi mật khẩu?), `twofa`.
- Refresh token: hash lưu trong `user.refreshTokenHash` (không có bảng session riêng, không hỗ trợ multi-device revoke từng thiết bị).
- 2 role: `admin`, `user` — không có role theo cửa hàng/multi-tenant.
- `RolesGuard` có **bypass đặc biệt cho non-production**: `GET /users` luôn public khi `NODE_ENV !== production` — cần xoá/né khi migrate logic auth để tránh mang theo lỗ hổng bảo mật dev-only này sang môi trường mới.

---

## 6. Tích hợp bên thứ ba (điểm cần re-config khi migrate)

| Dịch vụ | Vai trò | Biến môi trường | Rủi ro khi migrate |
|---|---|---|---|
| PostgreSQL | DB chính | `DATABASE_URL` | Chuẩn, dễ migrate (pg_dump/restore) |
| Cloudinary | Lưu trữ & CDN ảnh | `CLOUDINARY_*` | Ảnh sản phẩm hiện là URL Cloudinary tuyệt đối lưu trong JSONB — nếu đổi CDN cần rewrite toàn bộ `images`/`variants[].image_url` |
| PayPal | Thanh toán | `PAYPAL_MODE`, `PAYPAL_CLIENT_ID/SECRET`, `PAYPAL_WEBHOOK_ID` | Không có Stripe dù `Order.paymentMethod` có type `'STRIPE'` — cổng Stripe **chưa được implement** dù đã đặt chỗ trong type |
| Resend / SMTP | Email transactional | `RESEND_API_KEY`, `MAIL_*` | 2 provider song song (fallback), cần chọn 1 khi sang hệ mới |
| Google Sheets API | Bảng giá ship | `GOOGLE_SHEETS_*`, `GOOGLE_APPLICATION_CREDENTIALS` | **Không chuẩn** — hầu hết platform e-commerce có shipping-zone model riêng trong DB/admin UI; đây là điểm sẽ phải re-implement hoàn toàn, không "migrate" được, chỉ có thể "export dữ liệu từ Sheet rồi import vào hệ mới" |

---

## 7. Business logic đáng chú ý (không tự nhiên suy ra được từ tên bảng)

1. **Order snapshot, không dynamic pricing**: `items[]` và `summary` đóng băng giá tại thời điểm đặt hàng — nếu hệ thống mới tính lại giá từ Product hiện tại, số liệu lịch sử đơn hàng cũ sẽ sai lệch. Khi migrate **phải giữ nguyên JSONB này as-is**, không được suy diễn lại từ Product.
2. **Tracking history đầy đủ 14 trạng thái** phục vụ shipping quốc tế — nếu hệ thống đích (vd Shopify) chỉ có fulfillment status đơn giản (unfulfilled/fulfilled/shipped/delivered), cần bảng mapping trạng thái N→ít, và quyết định giữ lại `tracking_history` gốc dưới dạng metadata/note vì sẽ mất chi tiết.
3. **Đa ngôn ngữ ở cấp field, không phải ở cấp record**: khác với Shopify (mỗi locale là 1 bản dịch riêng qua Translate API) — cần transform JSONB `{en, vi}` → multi-locale resource của platform đích.
4. **Giá theo Product, biến thể chỉ override giá/tồn kho khi có `variants[]`**: cần xác định rule "giá hiệu lực" hiện tại (variant.price hay product.price) trước khi map sang variant-first platform.
5. **Phí ship tính runtime qua Google Sheets** theo `country/province/district/weight/method`, có cache TTL — đây là logic nghiệp vụ duy nhất không nằm trong DB, cần được trích xuất thành bảng shipping-zone tĩnh trước khi migrate.
6. **Idempotency PayPal qua bảng riêng** (`paypal_events`, unique `eventId`) — pattern tốt, nên giữ nguyên nếu hệ thống mới vẫn dùng PayPal, hoặc bỏ nếu đổi PSP.
7. **`changeOrderStatus` ghi `changedBy` ưu tiên `req.user.id`** (theo commit gần nhất) — audit trail người thao tác, cần có cột tương đương ở hệ thống đích nếu muốn giữ truy vết.

---

## 8. Nợ kỹ thuật / điểm bất thường cần dọn trước khi migrate

- **Trùng lặp module auth**: tồn tại cả `src/auth/*` và `src/modules/auth/*`. `app.module.ts` chỉ import `modules/auth`. `src/auth` nhiều khả năng là code cũ chưa dọn — cần xác nhận rồi xoá để tránh nhầm lẫn khi đối chiếu logic.
- **`src/database/migrations/` rỗng**, migration thật nằm ở `src/migrations/` (11 file) trong khi `db.config.ts` (dùng lúc runtime) trỏ tới `src/database/migrations`, còn `data-source.ts` / `typeorm.config.ts` (dùng cho CLI) trỏ tới `src/migrations`. Runtime app hiện **không tự chạy migration nào** (thư mục nó trỏ tới rỗng) — nghĩa là schema thực tế trong DB phải được tạo bằng CLI (`npm run migration:run` dùng `typeorm.config.ts`), chứ không phải lúc app boot. Cần làm rõ trước khi dump schema.
- **2 cấu hình DB song song không đồng nhất**: `data-source.ts` (root) dùng biến `DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME`, còn toàn bộ phần còn lại của app dùng `DATABASE_URL` duy nhất. `env.example` chỉ khai báo `DATABASE_URL` — `data-source.ts` có thể là file mồ côi/không dùng thực tế.
- **`variants` module/entity gần như không được tham chiếu** từ Product — khả năng là thiết kế ban đầu (variant = bảng riêng) đã bị thay bằng JSONB nhúng nhưng chưa dọn code cũ.
- **`UserWishlist` thiết kế lạ**: `Unique(['userId'])` giới hạn 1 row/user nhưng tên bảng là `user_wishlist_products` (số nhiều) — cần đọc kỹ DTO/API thực tế (`user-wishlist.controller.ts`) trước khi giả định cấu trúc dữ liệu wishlist khi export.
- **Cổng Stripe khai báo type nhưng chưa implement** (`Order.paymentMethod: 'PAYPAL' | 'STRIPE' | 'COD'` nhưng chỉ có `PaypalModule`) — COD cũng không thấy service riêng, có thể chỉ là set status thủ công.
- **`RolesGuard` bypass `GET /users` khi non-production`** — lỗ hổng chỉ nên tồn tại ở dev, kiểm tra kỹ không mang theo sang môi trường mới.
- **File `env.example` mới được thêm/sửa** ở root ngày hôm nay (theo git status) nhưng chưa commit — xác nhận nội dung khớp với `.env` thực tế trước khi dùng làm checklist biến môi trường cho hệ thống đích.

---

## 9. Checklist gợi ý khi migrate sang hệ thống bán hàng khác

1. **Export OpenAPI spec hiện tại** (`npm run openapi:export` → `docs/openapi.json`) làm baseline đối chiếu tính năng.
2. **Dump toàn bộ bảng Postgres** (đặc biệt `products`, `orders`, `collections`, `product_collections`, `addresses`, `user`) — ưu tiên giữ nguyên JSONB gốc (`items`, `summary`, `tracking_history`, `variants`) làm archive, không convert vội.
3. **Flatten `products.variants[]`** thành bảng variant chuẩn ở hệ đích: map `sku, price, stock, color_id→tên màu, size_id→tên size, image_url`.
4. **Convert JSONB đa ngôn ngữ** (`name`, `description`, `slug`, `meta_*`) sang mô hình đa ngôn ngữ của hệ đích (per-locale record hoặc translation table).
5. **Trích xuất bảng giá ship từ Google Sheet** hiện tại thành file tĩnh (CSV/JSON) rồi import vào shipping-zone/shipping-rate của hệ đích — đây là phần **không thể tự động migrate**, phải làm thủ công hoặc viết script đọc Sheet 1 lần.
6. **Map 14 trạng thái đơn hàng** sang state machine của hệ đích; giữ `tracking_history` cũ dưới dạng note/metadata để không mất audit trail.
7. **Đối chiếu tài khoản PayPal** (`PAYPAL_CLIENT_ID/SECRET`, `PAYPAL_WEBHOOK_ID`) — nếu hệ đích có PSP tích hợp sẵn (vd Shopify Payments), quyết định giữ PayPal làm gateway phụ hay ngưng hẳn; đơn hàng cũ vẫn cần `paypalOrderId/paypalTransactionId` để đối soát kế toán.
8. **Ảnh Cloudinary**: giữ nguyên URL (đa số platform chấp nhận external image URL) hoặc viết script tải về + upload lại vào storage của hệ đích.
9. **Email đang gửi qua Resend** — nếu hệ đích không hỗ trợ custom provider, cần map lại template (order confirmation, welcome, password reset) sang hệ thống email của platform mới.
10. **User password**: `passwordHash` (bcrypt) — nếu hệ đích cũng dùng bcrypt có thể import thẳng hash; nếu không, user sẽ cần reset mật khẩu qua OTP/email flow đã có sẵn (`otp_service`).
11. Dọn nợ kỹ thuật ở mục 8 (đặc biệt module `auth` trùng và migration path lệch) **trước** khi dump schema, để tránh generate schema từ nhánh code sai.

---

## 10. Nguồn tham chiếu bổ sung trong repo

Các tài liệu domain chi tiết hơn đã có sẵn (viết bằng tiếng Việt, khá đầy đủ), nên đọc song song khi cần đi sâu:

- `docs/product_schema_docs.md` — chi tiết từng field Product, validation rule.
- `docs/orders_backend_documentation.md` — luồng nghiệp vụ order đầy đủ nhất trong repo.
- `docs/collections_quickstart.md`, `docs/collections_api_payloads.md` — Collections API & cursor pagination.
- `docs/paypal_payment_handling.md`, `docs/paypal_sandbox_local_setup.md` — luồng thanh toán & webhook PayPal.
- `docs/sizes_colors_api.md`, `docs/reference_lists_for_product_creation.md` — thuộc tính biến thể.
- `docs/frontend_api_integration.md`, `docs/frontend_paypal_integration.md` — hợp đồng API phía FE đang dùng thật.
