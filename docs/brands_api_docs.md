# Brands API — Tài liệu cho Frontend

Tài liệu tham chiếu API module **Brands** (Thương hiệu) và tích hợp brand vào Product.
Dùng cho cả admin (`ecom-client`) lẫn storefront (`mingo-store`).

> **Nguồn chuẩn**: `ecom-website/src/modules/brands/*` và `src/modules/products/*`.
> Field name giữ nguyên **snake_case** đúng như API trả về — không đổi tên ở FE để tránh lệch mapping.

---

## 0. Envelope chung

Toàn bộ response đi qua `TransformInterceptor` toàn cục, được bọc thành:

```jsonc
{ "data": <payload>, "message": "...", "success": true }
```

⇒ Payload thật nằm ở `response.data.data`. Với axios: `res.data.data`.
Với helper SWR sẵn có trong repo, luôn unwrap 1 lớp: `const payload = data?.data ?? data`.

---

## 1. Base path & phân quyền

Controller mount ở **`/brands`** (KHÔNG phải `/admin/brands` như distributor/policy — lưu ý khi khai báo endpoint).

| Method & Path            | Quyền           | Ghi chú                                  |
| ------------------------ | --------------- | ---------------------------------------- |
| `POST /brands`           | **Admin** (JWT) | Tạo brand                                |
| `GET /brands`            | Public          | Danh sách (mảng thuần, không phân trang) |
| `GET /brands/slug/:slug` | Public          | Chi tiết theo slug                       |
| `GET /brands/:id`        | Public          | Chi tiết theo UUID                       |
| `PATCH /brands/:id`      | **Admin** (JWT) | Cập nhật (partial)                       |
| `DELETE /brands/:id`     | **Admin** (JWT) | Xoá mềm (soft-delete), trả **204**       |

Endpoint admin cần header `Authorization: Bearer <accessToken>`.

---

## 2. Kiểu dữ liệu

### BrandDto (response)

```ts
type BrandDto = {
  id: string;               // uuid
  name: string;             // "Mingo"
  slug: string;             // "mingo" — unique
  logo_url: string | null;  // URL ảnh logo (Cloudinary)
  description: string | null;
  display_order: number;    // sắp xếp tăng dần, mặc định 0
  is_active: boolean;       // ẩn/hiện, mặc định true
  created_at: string;       // ISO date-time
  updated_at: string;
};
```

### CreateBrandDto (body cho POST)

| Field           | Kiểu    | Bắt buộc | Ràng buộc                          |
| --------------- | ------- | -------- | ---------------------------------- |
| `name`          | string  | ✅        | 1–255 ký tự                        |
| `slug`          | string  | ✅        | ≤ 280 ký tự, **unique** toàn hệ    |
| `logo_url`      | string  | ❌        | ≤ 500 ký tự                        |
| `description`   | string  | ❌        | text tự do                         |
| `display_order` | number  | ❌        | integer ≥ 0 (mặc định 0)           |
| `is_active`     | boolean | ❌        | mặc định `true`                    |

### UpdateBrandDto (body cho PATCH)

`PartialType(CreateBrandDto)` — **mọi field optional**. Chỉ gửi field cần đổi.
Đổi `slug` sang giá trị đã tồn tại → **409 Conflict**.

---

## 3. Chi tiết từng endpoint

### 3.1. `POST /brands` — Tạo brand (admin)

Request:

```http
POST /brands
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mingo",
  "slug": "mingo",
  "logo_url": "https://res.cloudinary.com/.../mingo.png",
  "description": "Thương hiệu kem Mingo",
  "display_order": 1,
  "is_active": true
}
```

Response `201`:

```jsonc
{ "data": { "id": "...", "name": "Mingo", "slug": "mingo", ... }, "success": true }
```

Lỗi:
- `409` — slug đã tồn tại (`Brand with slug "mingo" already exists`).
- `400` — sai kiểu/validation.
- `401/403` — thiếu token / không phải admin.

### 3.2. `GET /brands` — Danh sách

Query params (optional):

| Param    | Kiểu    | Ý nghĩa                       |
| -------- | ------- | ----------------------------- |
| `active` | boolean | `true` → chỉ brand đang active |

Trả về **mảng thuần** `BrandDto[]`, đã sort theo `display_order ASC, name ASC`:

```jsonc
{ "data": [ { "id": "...", "name": "Mingo", ... }, ... ], "success": true }
```

> ⚠️ Đây **không** phải response phân trang `{ data, total, page, limit }`. Sau khi unwrap envelope, `data` chính là mảng brand.

### 3.3. `GET /brands/slug/:slug` — Chi tiết theo slug

Response `200`: `BrandDto`. Không thấy → `404`.

### 3.4. `GET /brands/:id` — Chi tiết theo UUID

Response `200`: `BrandDto`. Không thấy → `404`. Dùng cho trang admin edit.

### 3.5. `PATCH /brands/:id` — Cập nhật (admin)

Body partial, ví dụ chỉ đổi trạng thái:

```http
PATCH /brands/<id>
Authorization: Bearer <token>

{ "is_active": false }
```

Response `200`: `BrandDto` sau cập nhật.

### 3.6. `DELETE /brands/:id` — Xoá mềm (admin)

Response `204` (no content). Brand bị đánh dấu `deleted_at`, không còn xuất hiện ở list.
Slug vẫn bị giữ chỗ (uniqueness check dùng `withDeleted`) — không thể tạo lại brand mới trùng slug đã xoá.

---

## 4. Tích hợp Brand vào Product

### 4.1. Gán brand khi tạo/sửa product

`CreateProductDto` và `UpdateProductDto` nhận thêm field:

```ts
brand_id?: string | null; // UUID của brand
```

- **Tạo** (`POST /products`): thêm `brand_id` vào body (optional).
- **Sửa** (`PATCH /products/:id`):
  - gửi `brand_id: "<uuid>"` để đổi brand.
  - gửi `brand_id: null` để **gỡ** brand.
  - **không** gửi key `brand_id` → giữ nguyên brand hiện tại.
- `brand_id` không tồn tại → **400** `Brand with ID "..." not found`.

Ví dụ:

```http
PATCH /products/<productId>
Authorization: Bearer <token>

{ "brand_id": "b4b2b07f-6825-402b-bd2c-f9aef8cfbba5" }
```

### 4.2. Brand trong response product

Mọi response product (`GET /products`, `GET /products/:id`, `GET /products/slug/:slug`,
kết quả create/update) đều kèm object brand tóm tắt:

```ts
type ProductBrandSummary = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

// trong ProductResponseDto:
brand: ProductBrandSummary | null; // null nếu product chưa gán brand
```

### 4.3. Lọc product theo brand

`GET /products` nhận thêm query param:

```
GET /products?brand_id=<uuid>&page=1&limit=20
```

Kết hợp được với các filter khác (`category_id`, `collection_id`, `status`, `search`, ...).
Response giữ nguyên dạng phân trang `{ data: Product[], meta: { total, page, limit, totalPages } }`.

---

## 5. Upload logo brand

Dùng lại endpoint file có sẵn: `POST /files/upload` (admin, field `file`, ≤ 5MB, Cloudinary).
Trả về `{ url, ... }`; lấy `url` gán vào `logo_url`.

> ⚠️ Khi upload `FormData` bằng axios/fetch, **KHÔNG** tự set header
> `Content-Type: multipart/form-data`. Để trình duyệt/axios tự sinh header kèm `boundary`,
> nếu không sẽ lỗi `400 Multipart: Boundary not found`.

---

## 6. Checklist tích hợp FE

- [ ] Endpoint brands trỏ `/brands` (không phải `/admin/brands`).
- [ ] `GET /brands` unwrap ra **mảng** (không phải object phân trang).
- [ ] Form brand: validate `name`, `slug` unique (bắt 409), `display_order` ≥ 0.
- [ ] Product form: thêm selector Brand ⇄ `brand_id` (cho phép “Không có / None” = null).
- [ ] Product list (nếu cần): filter theo `brand_id`.
- [ ] Upload logo: reuse `/files/upload`, không set Content-Type thủ công.
