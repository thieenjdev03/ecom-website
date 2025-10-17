### ProductsService – Tài liệu logic hiện tại cho FE CRUD sản phẩm

Tài liệu này mô tả chi tiết logic hiện tại của `ProductsService` và các endpoint liên quan để FRONTEND có thể xây dựng luồng CRUD sản phẩm một cách an toàn và nhất quán.

- **Module**: `src/modules/products`
- **Entities**: `Product`, `Category`
- **Controllers**: `ProductsController`, `CategoriesController`
- **Services**: `ProductsService`, `CategoriesService`

### Tổng quan dữ liệu
me
- `Product`
  - Khóa: `id`
  - Định danh SEO: `slug` (unique)
  - Thông tin chính: `name`, `description`, `short_description`, `price`, `sale_price`, `cost_price`
  - Media & meta: `images` (jsonb), `meta_title`, `meta_description`
  - Tồn kho: `stock_quantity` (dùng khi KHÔNG có variants), `variants` (jsonb: gồm `name`, `color_id`, `size_id`, `sku`, `price`, `stock`, `barcode?`)
  - Phân loại: `category_id` (nullable), quan hệ `ManyToOne` tới `Category`
  - Khác: `sku` (unique, nullable – chỉ dùng khi KHÔNG có variants), `barcode?`, `tags` (jsonb), `status` (`active|draft|out_of_stock|discontinued`), `is_featured`, `weight`, `dimensions?`
  - Soft delete: trường `deleted_at`

- `Category`
  - Khóa: `id`
  - `slug` (unique), `name`, `description?`, `image_url?`, `parent_id?`, `display_order`, `is_active`

### Ràng buộc nghiệp vụ (ProductsService.validateProduct)

- Nếu có `variants` (mảng > 0):
  - Không được set `stock_quantity` > 0
  - Không được set `sku` cho product cha (SKU quản lý ở từng variant)
- `sale_price` (nếu có) không được lớn hơn `price`.
- `slug` của product phải unique. `sku` product (khi không có variants) phải unique.

### Endpoints – Products

Base path: `/products`

1) POST `/products` – Tạo sản phẩm
- Body theo `CreateProductDto` (xem phần DTO bên dưới).
- Luồng xử lý:
  - Validate DTO theo class-validator
  - Kiểm tra logic nghiệp vụ (variants vs stock_quantity/sku; sale_price <= price)
  - Kiểm tra unique `slug`, và `sku` (nếu có)
  - Lưu `Product`
- Kết quả: 201 + object `Product`
- Lỗi thường gặp: 400 (vi phạm ràng buộc nghiệp vụ/unique), 422 (vi phạm validate)

2) GET `/products` – Danh sách sản phẩm có filter, tìm kiếm, phân trang, sắp xếp
- Query theo `QueryProductDto`:
  - `page` (default 1), `limit` (default 20, max 100)
  - `category_id?`, `status?`, `is_featured?`, `search?`
  - `sort_by` in [`created_at`, `price`, `name`] (default `created_at`)
  - `sort_order` in [`ASC`, `DESC`] (default `DESC`)
- Luồng xử lý:
  - Bỏ qua bản ghi có `deleted_at` (chỉ lấy chưa soft delete)
  - Áp dụng các filter và search (ILIKE theo `name`, `description`)
  - Phân trang + sắp xếp
- Kết quả: 200
  - `{ data: Product[], meta: { total, page, limit, totalPages } }`

3) GET `/products/search?q=keyword&limit=20` – Tìm kiếm nhanh
- Chỉ trả về `status = active` và chưa bị soft delete
- Tìm theo ILIKE `name` hoặc `description`
- Kết quả: 200 `Product[]`

4) GET `/products/slug/:slug` – Lấy sản phẩm theo slug
- Trả về 404 nếu không tìm thấy

5) GET `/products/:id` – Lấy sản phẩm theo id
- Trả về 404 nếu không tìm thấy

6) GET `/products/:id/stock` – Tổng tồn kho
- Nếu có `variants`: tổng `sum(variant.stock)`
- Nếu không có `variants`: dùng `stock_quantity`

7) PATCH `/products/:id` – Cập nhật sản phẩm
- Body theo `UpdateProductDto` (partial của `CreateProductDto`)
- Luồng xử lý:
  - Load product; 404 nếu không tồn tại
  - Nếu body có thay đổi: áp dụng validate nghiệp vụ như khi tạo
  - Nếu đổi `slug`: kiểm tra unique
  - Lưu lại

8) PATCH `/products/:id/variants/:sku/stock` – Cập nhật tồn kho cho 1 variant
- Body: `{ stock: number }`
- Luồng xử lý:
  - Load product; 404 nếu không tồn tại
  - Product phải có `variants`; nếu không -> 400
  - Tìm variant theo `sku`; nếu không -> 404
  - Gán `variant.stock = newStock` và lưu product

9) DELETE `/products/:id` – Xóa mềm sản phẩm
- Soft delete: set `deleted_at` thay vì xóa cứng
- Kết quả: 204 No Content

### Endpoints – Categories (phục vụ chọn Category khi CRUD Product)

Base path: `/categories`

- POST `/categories` – Tạo category (check unique `slug`)
- GET `/categories` – Lấy tất cả (order theo `display_order`, `name`)
- GET `/categories/active` – Lấy category đang `is_active=true`
- GET `/categories/slug/:slug` – Theo slug
- GET `/categories/:id` – Theo id, có trả quan hệ `parent`
- PATCH `/categories/:id` – Cập nhật (check unique `slug` nếu thay đổi)
- DELETE `/categories/:id` – Xóa cứng

### DTO tham chiếu chính

- CreateProductDto (các field quan trọng):
  - `name` (string, <=255, bắt buộc)
  - `slug` (string, <=255, bắt buộc, unique)
  - `description?` (string)
  - `short_description?` (string, <=500)
  - `price` (number, >=0, bắt buộc)
  - `sale_price?` (number, >=0, <= price)
  - `cost_price?` (number, >=0)
  - `images?` (string[])
  - `variants?` (ProductVariantDto[])
  - `stock_quantity?` (number, >=0) – chỉ khi KHÔNG có variants
  - `sku?` (string, <=100, unique) – chỉ khi KHÔNG có variants
  - `barcode?` (string, <=100)
  - `category_id?` (number)
  - `tags?` (string[])
  - `status?` one of `active|draft|out_of_stock|discontinued` (default: `active`)
  - `is_featured?` (boolean, default: false)
  - `meta_title?` (string, <=255), `meta_description?` (string, <=500)
  - `weight?` (number, >=0)

- ProductVariantDto:
  - `name` (string, bắt buộc)
  - `sku` (string, bắt buộc)
  - `price` (number, >=0, bắt buộc)
  - `stock` (number, >=0, bắt buộc)
  - `barcode?` (string)

- QueryProductDto:
  - `category_id?` (number)
  - `status?` (`active|draft|out_of_stock|discontinued`)
  - `is_featured?` (boolean)
  - `search?` (string)
  - `page?` (>=1, default 1)
  - `limit?` (1..100, default 20)
  - `sort_by?` in [`created_at`, `price`, `name`], default `created_at`
  - `sort_order?` in [`ASC`, `DESC`], default `DESC`

### Quy tắc FE cần tuân thủ khi CRUD

- **Tạo mới**:
  - Nếu tạo theo dạng đơn giản (không có variants): gửi `price`, `stock_quantity`, có thể thêm `sku` (unique). KHÔNG gửi `variants`.
  - Nếu tạo theo dạng có `variants`: gửi mảng `variants` với từng `sku`, `price`, `stock`. KHÔNG gửi `stock_quantity` và KHÔNG đặt `sku` ở product cha.
  - Bắt buộc `slug` unique. FE nên gợi ý hoặc kiểm tra collision trước khi gửi (ví dụ gợi ý `slug` từ `name`).
  - Nếu có `sale_price`, đảm bảo `sale_price <= price`.

- **Cập nhật**:
  - Khi chuyển đổi giữa hai mô hình tồn kho (đơn giản <-> variants), FE phải dọn dữ liệu xung đột:
    - Nếu thêm `variants`, hãy bỏ `stock_quantity` và `sku` cha.
    - Nếu bỏ `variants` để dùng `stock_quantity`, hãy xoá `variants` và thiết lập `sku` cha nếu cần.
  - Đổi `slug` phải tránh trùng.

- **Xoá**:
  - Sản phẩm bị soft delete – không xuất hiện trong danh sách mặc định. API trả 204.

- **Danh sách & Tìm kiếm**:
  - Sử dụng `GET /products` với `page`, `limit`, filter và search theo nhu cầu. FE cần đọc `meta.totalPages` để phân trang.
  - Tìm nhanh bằng `/products/search` chỉ trả về sản phẩm `active`.

- **Tồn kho**:
  - Để hiển thị tổng tồn kho: gọi `GET /products/:id/stock`.
  - Để cập nhật tồn kho 1 biến thể: `PATCH /products/:id/variants/:sku/stock` với `stock` mới.

### Ví dụ payload

Tạo product đơn giản (không variants):
```json
{
  "name": "Premium Polo Shirt",
  "slug": "premium-polo-shirt",
  "price": 399000,
  "sale_price": 349000,
  "stock_quantity": 50,
  "sku": "POLO-001",
  "category_id": 1,
  "images": ["https://example.com/image1.jpg"],
  "tags": ["polo", "men"],
  "status": "active",
  "is_featured": false
}
```

Tạo product có variants (kèm `color_id`, `size_id`):
```json
{
  "name": "Polo Shirt Variants",
  "slug": "polo-shirt-variants",
  "price": 399000,
  "variants": [
    {"name": "M - Black", "color_id": "<color-uuid>", "size_id": "<size-uuid>", "sku": "POLO-M-BLACK", "price": 399000, "stock": 10},
    {"name": "L - Blue",  "color_id": "<color-uuid>", "size_id": "<size-uuid>", "sku": "POLO-L-BLUE",  "price": 399000, "stock": 5}
  ],
  "category_id": 1
}
```

Update product (đổi slug, đổi giá):
```json
{
  "slug": "premium-polo-2025",
  "price": 409000,
  "sale_price": 359000
}
```

Update tồn kho 1 variant:
```json
{
  "stock": 25
}
```

### Mã lỗi và thông điệp dự kiến

- 400 Bad Request
  - `Sale price cannot be greater than regular price`
  - `Product with variants should not have stock_quantity set`
  - `Product with variants should not have SKU set`
  - `Slug "..." already exists`
  - `SKU "..." already exists`
- 404 Not Found
  - `Product #id not found`
  - `Product with slug "..." not found`
  - `Variant with SKU "..." not found`

### Gợi ý UI/Flow cho FE CRUD

- Form tạo/sửa:
  - Toggle “Quản lý theo biến thể” để quyết định hiển thị nhóm trường `variants` hoặc `stock_quantity + sku`.
  - Auto-generate `slug` theo `name` với khả năng chỉnh tay. Cảnh báo nếu trùng.
  - Nếu nhập `sale_price` > `price`, hiển thị lỗi tức thì.

- Danh sách:
  - Thanh filter: `status`, `category`, `featured`, `search`.
  - Sắp xếp: `created_at`, `price`, `name`.
  - Phân trang dựa trên `meta.totalPages`.

- Chi tiết:
  - Hiển thị tổng tồn kho từ `/products/:id/stock`.
  - Nếu có variants, hiển thị grid các variants với nút cập nhật nhanh `stock` bằng endpoint riêng.

### Tham chiếu mã nguồn

- `src/modules/products/products.service.ts`
- `src/modules/products/products.controller.ts`
- `src/modules/products/dto/*.ts`
- `src/modules/products/entities/*.ts`

### Products Service Logic and API Contract

This document describes the current behavior and business rules of the `products` module so an AI or frontend can implement full CRUD and related flows correctly.

Applies to: `src/modules/products/products.service.ts`, `products.controller.ts`, `entities/product.entity.ts`, and DTOs in `src/modules/products/dto/`.

---

## Entity Model: `Product`

- **Core fields**
  - `id:number` (auto)
  - `name:string` (<=255)
  - `slug:string` (unique, <=255)
  - `description?:string`
  - `short_description?:string` (<=500)
  - `price:number` (decimal(10,2), required)
  - `sale_price?:number` (decimal(10,2))
  - `cost_price?:number` (decimal(10,2))
  - `images:string[]` (jsonb, default [])
- `variants:ProductVariant[]` (jsonb, default [])
  - `ProductVariant = { name:string; color_id:string; size_id:string; sku:string; price:number; stock:number; barcode?:string }`
  - `stock_quantity:number` (default 0)
  - `sku?:string` (unique, for non-variant products)
  - `barcode?:string`
  - `category_id?:number` and relation `category`
  - `tags:string[]` (jsonb, default [])
  - `status:'active'|'draft'|'out_of_stock'|'discontinued'` (default 'active')
  - `is_featured:boolean` (default false)
  - `meta_title?:string` (<=255)
  - `meta_description?:string` (<=500)
  - `weight?:number` (decimal(8,2))
  - `dimensions?:{ length:number; width:number; height:number }`
  - `created_at, updated_at, deleted_at` (soft delete enabled)

Key invariants:
- If `variants` is non-empty:
  - `stock_quantity` must not be set (>0) and `sku` must not be set.
- `sale_price` must be <= `price` when both provided.
- `slug` must be unique; `sku` must be unique (if provided).

---

## DTOs and Validation

- `CreateProductDto` requires: `name`, `slug`, `price`.
  - Optional: `description`, `short_description`, `sale_price`, `cost_price`, `images[]`, `variants[]`, `stock_quantity`, `sku`, `barcode`, `category_id`, `tags[]`, `status`, `is_featured`, `meta_title`, `meta_description`, `weight`.
  - Class-validator rules enforce types, lengths, enums, and numeric mins. Business rules (below) are checked in service.
- `UpdateProductDto = Partial<CreateProductDto>`.
- `QueryProductDto` supports filters and pagination:
  - `category_id?:number`, `status?:enum`, `is_featured?:boolean`, `search?:string` (ILIKE on `name` and `description`)
  - Paging: `page` (default 1), `limit` (default 20, max 100)
  - Sorting: `sort_by` in [`created_at`, `price`, `name`]; `sort_order` in [`ASC`, `DESC`]

---

## Service Logic Summary

### Create
1. Validate business rules via `validateProduct`:
   - `sale_price <= price`.
   - If `variants.length > 0`: forbids `stock_quantity > 0` and forbids root `sku`.
2. Uniqueness checks:
   - `slug` must be unique.
   - If `sku` provided (non-variant product), `sku` must be unique.
3. Persist `createProductDto` as a new `Product`.

Errors:
- 400 if business rule violated or slug/sku duplicate.

### Find All (List with Filters)
1. Build query with left join `category` and `product.deleted_at IS NULL`.
2. Optional filters: `status`, `category_id`, `is_featured`.
3. Search: `(name ILIKE :search OR description ILIKE :search)`.
4. Sorting by `sort_by` and `sort_order`.
5. Pagination with `page`, `limit`.
6. Returns `{ data: Product[]; meta: { total, page, limit, totalPages } }`.

### Find One by ID
1. Fetch with `relations: ['category']`.
2. 404 if not found.

### Find One by Slug
1. Fetch by `slug` with `relations: ['category']`.
2. 404 if not found.

### Update
1. Load product by `id` (404 if missing).
2. If any fields provided, re-run `validateProduct`.
3. If `slug` changes, re-check uniqueness.
4. Merge fields, save.

Errors:
- 400 if business rule violated or new slug duplicates.

### Remove (Soft Delete)
1. Ensure product exists, then `softDelete(id)`.
2. Subsequent list/search exclude `deleted_at` by default.

### Stock Helpers
- `getTotalStock(id)`:
  - If variants exist, returns sum of `variant.stock`.
  - Else returns `stock_quantity`.
- `updateVariantStock(id, sku, newStock)`:
  - Requires variants to exist, finds variant by SKU, updates `stock`, saves product.
  - 404 if variant SKU not found, 400 if product has no variants.

### Search Shortcut
- `search(keyword, limit=20)` returns active, non-deleted products where `name` or `description` matches keyword (ILIKE). No pagination metadata.

---

## REST API Endpoints

Base path: `/products`

- POST `/products`
  - Body: `CreateProductDto`
  - 201 Created -> `Product`
  - 400 on validation or uniqueness error

- GET `/products`
  - Query: `QueryProductDto`
  - 200 OK -> `{ data: Product[]; meta: { total, page, limit, totalPages } }`

- GET `/products/search?q=keyword&limit=20`
  - 200 OK -> `Product[]`

- GET `/products/slug/:slug`
  - 200 OK -> `Product`
  - 404 if not found

- GET `/products/:id`
  - 200 OK -> `Product`
  - 404 if not found

- GET `/products/:id/stock`
  - 200 OK -> `number` (total stock)

- PATCH `/products/:id`
  - Body: `UpdateProductDto`
  - 200 OK -> `Product`
  - 400/404 on error

- PATCH `/products/:id/variants/:sku/stock`
  - Body: `{ stock:number }`
  - 200 OK -> `Product` (updated)
  - 400 if product has no variants; 404 if variant not found

- DELETE `/products/:id`
  - 204 No Content

---

## Frontend CRUD Flows (Happy Paths)

### Create product without variants
1. Generate unique `slug` (e.g., slugify name; confirm uniqueness if desired via backend 400 handling).
2. Send POST `/products` with body:
```json
{
  "name": "Premium Polo Shirt",
  "slug": "premium-polo-shirt",
  "price": 399000,
  "sale_price": 349000,
  "images": ["https://.../polo.jpg"],
  "stock_quantity": 50,
  "sku": "POLO-001",
  "status": "active",
  "category_id": 1,
  "tags": ["polo","men","premium"],
  "is_featured": false
}
```
3. Handle 201 with created product; handle 400 if `sale_price > price` or duplicate `slug`/`sku`.

### Create product with variants
1. Omit root `sku` and `stock_quantity`.
2. Provide `variants` array, each with `name`, `sku`, `price`, `stock`.
```json
{
  "name": "Classic T-Shirt",
  "slug": "classic-tshirt",
  "price": 199000,
  "variants": [
    { "name": "S / Black", "sku": "TSHIRT-S-BLK", "price": 199000, "stock": 20 },
    { "name": "M / Black", "sku": "TSHIRT-M-BLK", "price": 199000, "stock": 30 }
  ],
  "status": "active"
}
```
3. 400 if `stock_quantity` or root `sku` is provided together with variants.

### Update product
1. PATCH `/products/:id` with changed fields.
2. If changing `slug`, ensure uniqueness; backend returns 400 if duplicate.
3. If switching between variant and non-variant modes, respect invariants above.

### List products (filters, paging, sort)
Example: `GET /products?category_id=1&status=active&search=polo&page=1&limit=20&sort_by=created_at&sort_order=DESC` -> `{ data, meta }`.

### Delete product
`DELETE /products/:id` -> 204. Product is soft-deleted and excluded from list/search thereafter.

### Read helpers
- `GET /products/slug/:slug` for SEO routes.
- `GET /products/:id/stock` to display stock summary (variant sum vs root stock).
- `PATCH /products/:id/variants/:sku/stock` to adjust stock of a specific variant.

---

## Error Handling Contract

- 400 Bad Request
  - Violation of business rules:
    - `sale_price` > `price`
    - Product has `variants` but also a root `sku` or `stock_quantity > 0`
  - Duplicate `slug` or `sku`
- 404 Not Found
  - Product id/slug not found
  - Variant SKU not found when updating variant stock

Errors follow NestJS default HttpException JSON shape. FE should extract `message` for display.

---

## Notes for Integrators

- All list/search endpoints exclude soft-deleted items automatically.
- `status` is an FE-controlled state; backend does not auto-compute it based on stock.
- Variant management beyond stock update is not exposed as separate endpoints; variants are included as an array on the product document.
- Monetary fields are decimals; FE should format and send numbers in the smallest currency unit policy being used by the app (current service expects standard numeric values as shown).


