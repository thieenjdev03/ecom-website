# Frontend API Field Reference — Product / User / Auth / Cart

Tổng hợp field schema thực tế (từ entity + DTO + `docs/openapi.json`) của 4 nhóm API để FE mapping data. Các doc chi tiết hơn về từng module đã có sẵn trong `docs/` (liệt kê ở cuối file) — file này là bản tổng hợp nhanh, tập trung vào field-level.

> Base path: xem `docs/openapi.json` (`servers`). Tất cả endpoint dưới đây là path tương đối, không có global prefix ngoại trừ `/api/v1` cho OTP.

---

## 1. Auth (`/auth`)

Chỉ có 2 endpoint đang hoạt động thật (module `src/modules/auth`). Không có refresh token, logout, forgot-password.

### POST /auth/register
Body — `RegisterDto`:

| field | type | required | ghi chú |
|---|---|---|---|
| email | string | ✅ | `@IsEmail` |
| password | string | ✅ | min length 8 |
| firstName | string | ✅ | |
| lastName | string | ✅ | |
| phoneNumber | string | ✅ | |
| country | string | ✅ | |
| marketingOptIn | boolean | ❌ | default `true` nếu không truyền |

Response: `{ id, email, role }`

### POST /auth/login
Body — `LoginDto`:

| field | type | required | ghi chú |
|---|---|---|---|
| email | string | ✅ | `@IsEmail` |
| password | string | ✅ | min length 8 |

Response: `{ accessToken: string, user: { id, email, role } }`

### JWT payload (giải mã `accessToken`)
```
{ sub: string /* user id */, email: string, role: 'admin' | 'user', iat, exp }
```
⚠️ Payload dùng `sub`, **không phải** `id` hay `userId`. Header dùng `Authorization: Bearer <accessToken>`. Token hết hạn sau 30 ngày.

### Roles
`Role` enum: `admin` | `user`. Dùng cho mọi field `role` trong User/JWT.

### Gotcha cho FE
- Không có endpoint refresh/logout — logout = xoá token phía client.
- `src/auth/` (thư mục cũ) chứa 1 luồng OTP login khác nhưng **không được mount vào app**, bỏ qua nếu thấy trong code, nó không chạy.

---

## 2. User

### `GET /me` (JwtGuard)
Trả về **raw User entity** (không phải `UserResponseDto`), gồm cả field không public như `passwordHash`/`refreshTokenHash` nếu service không strip — FE nên chỉ đọc field cần dùng, không log nguyên response.

### UserResponseDto (dùng ở `GET/PATCH /users/:id`, list)

| field | type | required | ghi chú |
|---|---|---|---|
| id | string | ✅ | |
| email | string | ✅ | |
| firstName | string | ❌ | |
| lastName | string | ❌ | |
| country | string | ❌ | |
| phoneNumber | string | ❌ | |
| role | `'admin'\|'user'` | ✅ | |
| profile | string | ❌ | |
| createdAt | Date (ISO string) | ✅ | |
| updatedAt | Date (ISO string) | ✅ | |
| addresses | array | ❌ | |
| wishlists | array | ❌ | |
| orders | array | ❌ | |
| cart | array | ❌ | **luôn là `[]`** — xem mục 4 |
| payments | array | ❌ | |

`GET /users` → `UserListResponseDto`: `{ data: UserResponseDto[], total, page, limit }`.

### CreateUserDto — `POST /users` (admin only)
| field | type | required |
|---|---|---|
| phoneNumber | string | ✅ |
| email | string (`@IsEmail`) | ✅ |
| password | string, min 6 | ✅ |
| role | `'admin'\|'user'` | ✅ |
| profile | string | ❌ |

### UpdateUserDto — `PATCH /users/:id` (admin only)
`email?`, `password?` (min 6), `role?`, `profile?` — tất cả optional.
⚠️ Không có `firstName`/`lastName`/`phoneNumber`/`country` trong DTO này — không thể sửa các field đó qua endpoint này.

### Wishlist — `/user/wishlist` (JwtGuard)
| endpoint | body |
|---|---|
| GET /user/wishlist | — |
| POST /user/wishlist | `{ note?: string }` |
| PATCH /user/wishlist/:id | `{ note?: string }` |
| DELETE /user/wishlist/:id | — |
| DELETE /user/wishlist | (xoá toàn bộ) |
| GET /user/wishlist/check?variantId= | — |

⚠️ `AddToWishlistDto`/`UpdateWishlistDto` chỉ có field `note` — **không có `productId`/`variantId`**, tức wishlist hiện chưa thực sự gắn được với 1 sản phẩm cụ thể (mỗi user chỉ có tối đa 1 record wishlist do unique constraint trên `userId`). `GET /user/wishlist/check?variantId=` nhận query nhưng backend không dùng nó. Coi đây là API chưa hoàn thiện, đừng build UI "wishlist theo sản phẩm" dựa vào nó cho tới khi backend bổ sung field.

### Phone numbers — `/user/phones` (JwtGuard)
| field | type | required |
|---|---|---|
| phoneNumber | string | ✅ |
| label | `'home'\|'work'\|'other'` | ❌ |
| isPrimary | boolean | ❌ |

Endpoints: `GET /user/phones`, `POST /user/phones`, `PATCH /user/phones/:id`, `DELETE /user/phones/:id`, `PATCH /user/phones/:id/set-primary`.

### Addresses — `/users/:userId/addresses`
Body `ShippingAddressDto`:

| field | type | required |
|---|---|---|
| full_name | string | ✅ |
| phone | string | ✅ |
| countryCode | string (2 ký tự) | ✅ |
| province | string | ✅ |
| district | string | ✅ |
| ward | string | ❌ |
| address_line | string | ✅ |
| address_line2 | string | ❌ |
| city | string | ❌ |
| postalCode | string | ❌ |
| label | string | ❌ |
| note | string | ❌ |
| isBilling | boolean | ❌ |
| isDefault | boolean | ❌ |

Endpoints: `GET /users/:userId/addresses`, `PUT /users/:userId/addresses/shipping`, `PATCH /users/:userId/addresses/:addressId`.

---

## 3. Product

### Product (entity, trả về từ GET — đã localize theo `locale`)

| field | type | ghi chú |
|---|---|---|
| id | uuid | |
| name | string (localized) hoặc `{en, vi}` tuỳ endpoint | multi-lang gốc là `LangObject` |
| slug | string (localized) | |
| description | string \| null | |
| short_description | string \| null | |
| price | number | |
| sale_price | number \| null | |
| cost_price | number \| null | (thường ẩn khỏi FE public) |
| images | string[] | default `[]` |
| variants | `ProductVariant[]` | default `[]`, xem bảng dưới |
| stock_quantity | number | chỉ dùng khi sản phẩm **không có** variants |
| sku | string \| null | chỉ dùng khi không có variants |
| barcode | string \| null | |
| category_id | uuid \| null | |
| category | `{id, name, slug}` | được enrich thêm khi GET |
| tags | string[] | default `[]` |
| status | `'active'\|'inactive'\|'draft'\|'out_of_stock'\|'discontinued'` | default `'active'` |
| is_featured | boolean | default `false` |
| enable_sale_tag | boolean | default `false` |
| meta_title / meta_description | string \| null | SEO |
| weight | number \| null | kg |
| dimensions | `{length?, width?, height?}` (cm) | |
| created_at / updated_at | Date | |

**ProductVariant** (nhúng trong `product.variants`, không phải bảng riêng):

| field | type | required |
|---|---|---|
| name | `{en, vi}` | ✅ |
| sku | string | ✅ |
| price | number | ✅ |
| stock | number | ✅ |
| barcode | string | ❌ |
| color_id | uuid | ✅ |
| size_id | uuid | ✅ |
| image_url | string (URL) | ❌ |

Khi GET, mỗi variant được enrich thêm object `color` và `size` đầy đủ bên cạnh `color_id`/`size_id` (xem entity Color/Size bên dưới) — FE có thể dùng thẳng `variant.color`/`variant.size` thay vì tự lookup.

### Color (`/colors`)
`id (uuid)`, `name (string)`, `hexCode (string, "#RRGGBB", nullable)`, `imageUrl (string, nullable)`, `createdAt`, `updatedAt`.

### Size (`/sizes`)
`id (uuid)`, `name (string)`, `category (Category, nullable)`, `sortOrder (number, default 0)`, `createdAt`, `updatedAt`.

### Category (`/categories`)
`id`, `name`, `slug (unique)`, `description (nullable)`, `image_url (nullable)`, `parent_id (nullable)`, `parent`/`children` (self-relation, phân cấp), `display_order (default 0)`, `is_active (default true)`, `created_at`, `updated_at`.

### Collection (`/collections`)
`id`, `name`, `slug (unique)`, `description (nullable)`, `banner_image_url (nullable)`, `seo_title (nullable)`, `seo_description (nullable)`, `is_active (default true)`, `created_at`, `updated_at`.

### CreateProductDto / UpdateProductDto (`POST/PATCH /products`)
Giống bảng Product entity ở trên, các field bắt buộc khi **tạo mới**: `name`, `slug`, `price` (số ≥0). `UpdateProductDto` = tất cả optional. `variants[]` nếu truyền thì mỗi item bắt buộc `name, sku, price, stock, color_id, size_id`.

### QueryProductDto (`GET /products`)
| param | type | default |
|---|---|---|
| locale | string | `'en'` |
| category_id | uuid | — |
| collection_id | uuid | — |
| status | `'active'\|'draft'\|'out_of_stock'\|'discontinued'` | — |
| is_featured | boolean | — |
| enable_sale_tag | boolean | — |
| search | string | — |
| page | number | 1 |
| limit | number | 20 (max 100) |
| sort_by | `'created_at'\|'updated_at'\|'name'\|'price'\|'status'` | `'created_at'` |
| sort_order | `'ASC'\|'DESC'` | `'DESC'` |

Response: `{ data: Product[], meta: { total, page, limit, totalPages } }`.

### Endpoints
```
POST   /products                          create
GET    /products                          list (QueryProductDto)
GET    /products/search?q=&limit=&locale= tìm kiếm nhanh, chỉ status=active
GET    /products/slug/:slug?locale=
GET    /products/:id?locale=
GET    /products/:id/stock                tổng stock (sum variants hoặc stock_quantity)
PATCH  /products/:id?locale=
PATCH  /products/:id/variants/:sku/stock  body { stock: number }
DELETE /products/:id                      soft delete, 204
```
Collections dùng **cursor pagination** (`?limit=&cursor=`), khác với offset pagination (`page`/`limit`) của Products/Categories/Users.

---

## 4. Cart

**Không có Cart API/entity/table trong backend.** Field `cart` trong `UserResponseDto` chỉ là placeholder — entity `User` không có cột/relation `cart`, nên backend luôn trả `cart: []` bất kể client làm gì. Không có endpoint `/cart` nào (đối chiếu `docs/openapi.json`).

### Khuyến nghị cho FE
Quản lý giỏ hàng hoàn toàn ở client (localStorage / state management), chỉ gửi lên server khi checkout qua `POST /orders`. Để đồng bộ shape giữa cart-client và order-item lúc submit, dùng cấu trúc `OrderItemDto`:

| field | type | required | ghi chú |
|---|---|---|---|
| productId | uuid | ✅ | |
| productName | string | ✅ | snapshot tại thời điểm đặt |
| productSlug | string | ✅ | |
| variantId | string | ❌ | |
| variantName | string | ❌ | |
| quantity | number | ✅ | min 1 |
| unitPrice | string | ✅ | dạng `"29.99"` (2 số thập phân, validate bằng regex) |
| totalPrice | string | ✅ | dạng `"59.98"` |
| sku | string | ❌ | |

`POST /orders` yêu cầu FE tự tính sẵn `items[]` (theo shape trên) + `summary` (`subtotal/shipping/tax/discount/total`, đều là string 2 số thập phân) — backend không tự tính lại giỏ hàng.

---

## 5. Gotchas tổng hợp (đáng lưu ý khi implement FE)

- **JWT payload dùng `sub`** cho user id, không phải `id`/`userId` — một số controller cũ (`user-phone.controller.ts`) đọc `req.user.id` sai, có thể lỗi 500/undefined phía backend nếu chưa fix — nếu gặp lỗi lạ ở API phone, đây là nguyên nhân khả dĩ.
- **`cart` luôn rỗng** — đừng dựa vào nó, xem mục 4.
- **Wishlist chưa gắn được với sản phẩm cụ thể** (thiếu `productId`) — mỗi user chỉ 1 record wishlist.
- **Products** có 2 chế độ tồn kho loại trừ nhau: sản phẩm có `variants[]` thì dùng `variant.stock`, sản phẩm không variant thì dùng `stock_quantity`/`sku` ở root.
- **Pagination không đồng nhất**: Products/Categories/Users dùng `page`+`limit`; Collections dùng `cursor`+`limit`.
- **`UpdateUserDto` thiếu field profile cá nhân** (`firstName`, `lastName`, `phoneNumber`, `country`) — nếu cần form "edit profile" đầy đủ, phải xác nhận với backend bổ sung DTO trước.

---

## Tài liệu chi tiết hơn (tham khảo thêm, không lặp lại ở đây)
- Product/Category: `docs/api_products.md`, `docs/product_schema_docs.md`, `docs/products_service_logic.md`, `docs/products_filter_by_collection.md`, `docs/categories_api_spec.md`, `docs/categories_api_frontend.md`
- Collections: `docs/collections_api.md`, `docs/collections_api_payloads.md`, `docs/COLLECTIONS_QUICK_REFERENCE.md`
- Sizes/Colors: `docs/sizes_colors_api.md`, `docs/reference_lists_for_product_creation.md`
- User/Me: `docs/me_api.md`
- Orders/Payment (checkout, kế tiếp sau cart): `docs/orders_backend_documentation.md`, `docs/order_detail_page_api.md`, `docs/api_documentation_orders_paypal.md`, `docs/frontend_paypal_integration.md`
- OpenAPI spec đầy đủ: `docs/openapi.json`
