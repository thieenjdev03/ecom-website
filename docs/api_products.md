## API Tài liệu: Products (Thêm, Sửa, Xoá)

Tài liệu này mô tả chi tiết các endpoint quản lý sản phẩm: tạo mới, cập nhật, xoá, và một số thao tác liên quan đến tồn kho biến thể. Bao gồm payload mẫu, quy tắc validation/business, phản hồi thành công và lỗi phổ biến.

Base path: `/products`

### Quy ước chung
- **Loại dữ liệu số tiền**: backend lưu dạng số thập phân với 2 chữ số (precision 10, scale 2). Gửi số bình thường (vd: `399000`).
- **Variants vs stock**: Nếu sản phẩm có `variants` thì không được đặt `stock_quantity` và `sku` ở cấp sản phẩm (xem Business rules).
- **Unique**: `slug` là bắt buộc và unique. `sku` cấp sản phẩm là unique (nếu dùng chế độ không-variant).
- **Soft delete**: Xoá sản phẩm dùng soft delete, trường `deleted_at` được đặt, bản ghi không bị mất vĩnh viễn.

### Quy ước nội dung HTML và trạng thái

Các field nội dung của sản phẩm nhận object đa ngôn ngữ `{ "vi": "...", "en": "..." }`. Giá trị được lưu ở dạng HTML để frontend hiển thị đúng bố cục:

| Field | Mục đích | HTML nên dùng |
| --- | --- | --- |
| `description` | Mô tả sản phẩm | `<p>`, `<strong>`, `<ul>`, `<li>`, `<br>` |
| `short_description` | Thành phần và chất gây dị ứng | `<p>`, `<strong>`, `<ul>`, `<li>` |
| `usage_instructions` | Hướng dẫn sử dụng | `<p>`, `<ol>`, `<ul>`, `<li>`, `<strong>` |
| `nutrition_information` | Alias cũ của `usage_instructions` để tương thích API | `<p>`, `<ol>`, `<ul>`, `<li>`, `<strong>` |
| `notes` | Chú ý, bảo quản, cảnh báo | `<p>`, `<ul>`, `<li>`, `<strong>` |

Backend sẽ sanitize lúc **create/update** và một lần nữa lúc trả response. Dữ liệu vẫn được lưu trong cột database `nutrition_information` để tương thích migration cũ, còn API mới dùng key `usage_instructions`. Các thẻ nguy hiểm (script, iframe, event handler...) bị loại bỏ; chỉ nên gửi HTML trình bày, không gửi JavaScript. Frontend admin có nút **Xem trước** để kiểm tra ảnh, giá, biến thể, trạng thái và bốn khối HTML trước khi bấm **Lưu**.

Trạng thái mới dùng trong form quản trị gồm:

- `active` — Đăng bán
- `draft` — Nháp
- `inactive` — Ẩn

Hai giá trị cũ `out_of_stock` và `discontinued` vẫn được backend đọc và hiển thị nhãn “dữ liệu cũ” để không làm mất dữ liệu lịch sử, nhưng không còn xuất hiện trong form/filter tạo mới.

---

### 1) Tạo sản phẩm (Create)
- Method: `POST`
- URL: `/products`

#### Request body (CreateProductDto)
Các trường chính (chỉ hiển thị trường quan trọng):
- `name` (string, required, ≤255)
- `slug` (string, required, ≤255, unique)
- `description` (LocalizedStringDto HTML, optional)
- `short_description` (LocalizedStringDto HTML, optional)
- `usage_instructions` (LocalizedStringDto HTML, optional)
- `nutrition_information` (LocalizedStringDto HTML, optional; alias cũ của `usage_instructions`)
- `notes` (LocalizedStringDto HTML, optional)
- `price` (number, required, ≥0)
- `sale_price` (number, optional, ≥0, phải ≤ `price` nếu gửi)
- `cost_price` (number, optional, ≥0)
- `images` (string[], optional)
- `variants` (ProductVariantDto[], optional)
  - Khi dùng variants: Mỗi phần tử gồm `name` (string), `sku` (string), `price` (number), `stock` (number), `barcode` (optional), `color_id` (string), `size_id` (string)
- `stock_quantity` (number, optional, ≥0) — Không dùng nếu có `variants`
- `sku` (string, optional, ≤100, unique) — Không dùng nếu có `variants`
- `barcode` (string, optional, ≤100)
- `category_id` (number, optional)
- `tags` (string[], optional)
- `status` (enum: `active|draft|inactive`, optional; mặc định `active`)
- `is_featured` (boolean, optional; mặc định `false`)
- `meta_title` (string, optional, ≤255)
- `meta_description` (string, optional, ≤500)
- `weight` (number, optional)

#### Business rules (được backend kiểm tra)
- `sale_price` không được lớn hơn `price`.
- Nếu gửi `variants` (mảng dài > 0) thì:
  - Không được gửi `stock_quantity` > 0 ở cấp sản phẩm.
  - Không được gửi `sku` ở cấp sản phẩm.
- `slug` phải unique; nếu trùng sẽ trả lỗi.
- Nếu có `sku` ở cấp sản phẩm (chế độ không-variant), `sku` phải unique.

#### Ví dụ request (không dùng variants)
```bash
curl -X POST 'http://localhost:3000/products' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Premium Polo Shirt",
    "slug": "premium-polo-shirt",
    "price": 399000,
    "sale_price": 349000,
    "sku": "POLO-001",
    "stock_quantity": 50,
    "category_id": 1,
    "images": ["https://example.com/image1.jpg"],
    "tags": ["polo", "men", "premium"],
    "status": "active",
    "is_featured": false
  }'
```

#### Ví dụ nội dung HTML song ngữ
```json
{
  "name": { "vi": "Kem vani Mingo", "en": "Mingo Vanilla Ice Cream" },
  "slug": { "vi": "kem-vani-mingo", "en": "mingo-vanilla-ice-cream" },
  "description": {
    "vi": "<p>Kem tươi vị vani, <strong>mềm mịn</strong> và thơm.</p>",
    "en": "<p>Fresh vanilla ice cream with a <strong>smooth</strong> texture.</p>"
  },
  "short_description": {
    "vi": "<p>Có chứa <strong>sữa, đậu nành</strong>.</p>",
    "en": "<p>Contains <strong>milk and soy</strong>.</p>"
  },
  "usage_instructions": {
    "vi": "<ol><li>Để kem mềm 5 phút trước khi dùng.</li><li>Dùng ngay sau khi mở hộp.</li></ol>",
    "en": "<ol><li>Soften for 5 minutes before serving.</li><li>Consume immediately after opening.</li></ol>"
  },
  "notes": {
    "vi": "<p>Bảo quản đông lạnh. Không cấp đông lại sau khi rã đông.</p>",
    "en": "<p>Keep frozen. Do not refreeze after thawing.</p>"
  }
}
```

#### Ví dụ request (dùng variants)
```bash
curl -X POST 'http://localhost:3000/products' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Premium Polo Shirt",
    "slug": "premium-polo-variant",
    "price": 399000,
    "variants": [
      {
        "name": "M - Black",
        "sku": "POLO-M-BLACK",
        "price": 399000,
        "stock": 10,
        "color_id": "1",
        "size_id": "1"
      },
      {
        "name": "L - Black",
        "sku": "POLO-L-BLACK",
        "price": 399000,
        "stock": 5,
        "color_id": "1",
        "size_id": "2"
      }
    ],
    "category_id": 1
  }'
```

#### Phản hồi thành công (201)
```json
{
  "id": 123,
  "name": "Premium Polo Shirt",
  "slug": "premium-polo-shirt",
  "price": 399000,
  "sale_price": 349000,
  "sku": "POLO-001",
  "stock_quantity": 50,
  "category_id": 1,
  "images": ["https://example.com/image1.jpg"],
  "variants": [],
  "status": "active",
  "is_featured": false,
  "tags": [],
  "created_at": "2025-10-30T08:00:00.000Z",
  "updated_at": "2025-10-30T08:00:00.000Z"
}
```

#### Lỗi phổ biến
- 400: `Sale price cannot be greater than regular price`
- 400: `Product with variants should not have stock_quantity set`
- 400: `Product with variants should not have SKU set`
- 400: `Slug "..." already exists` (hoặc 409 khi vi phạm unique ở cấp DB)
- 400: `Invalid category_id (foreign key not found)`

---

### 2) Cập nhật sản phẩm (Update)
- Method: `PATCH`
- URL: `/products/:id`

#### Request body (UpdateProductDto)
- Tất cả trường giống Create nhưng đều optional. Các ràng buộc business giữ nguyên:
  - Nếu cập nhật dẫn đến có `variants` > 0 thì không được có `stock_quantity` > 0 hoặc `sku` ở cấp sản phẩm.
  - Nếu đổi `slug` thì `slug` mới phải unique.
  - Nếu đặt `sku` ở cấp sản phẩm (không-variant), `sku` phải unique.

#### Ví dụ request
```bash
curl -X PATCH 'http://localhost:3000/products/123' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Premium Polo Shirt v2",
    "sale_price": 329000,
    "tags": ["polo", "new"]
  }'
```

#### Phản hồi thành công (200)
- Trả về đối tượng product đã cập nhật (giống schema ở phần create response).

#### Lỗi phổ biến
- 404: `Product #123 not found`
- 400/409: Vi phạm các quy tắc business hoặc unique (`slug`, `sku`).

---

### 3) Xoá sản phẩm (Delete - Soft delete)
- Method: `DELETE`
- URL: `/products/:id`
- Hành vi: Soft delete (đặt `deleted_at`), không trả body.

#### Ví dụ request
```bash
curl -X DELETE 'http://localhost:3000/products/123'
```

#### Phản hồi thành công (204)
- Không có body.

#### Lỗi phổ biến
- 404: `Product #123 not found`
- 400: `Unable to delete product` (lỗi tổng quát nếu có vấn đề khác)

---

### 4) Cập nhật tồn kho theo SKU biến thể
- Method: `PATCH`
- URL: `/products/:id/variants/:sku/stock`
- Body: `{ "stock": number }` với `stock` ≥ 0

#### Business rules
- Sản phẩm phải có `variants`.
- Tồn tại biến thể có `sku` tương ứng.
- `stock` không âm.

#### Ví dụ request
```bash
curl -X PATCH 'http://localhost:3000/products/123/variants/POLO-M-BLACK/stock' \
  -H 'Content-Type: application/json' \
  -d '{ "stock": 15 }'
```

#### Phản hồi thành công (200)
- Trả về đối tượng product sau khi cập nhật (toàn bộ sản phẩm, bao gồm mảng `variants`).

#### Lỗi phổ biến
- 404: `Product #123 not found`
- 400: `Product has no variants`
- 404: `Variant with SKU "POLO-M-BLACK" not found`
- 400: `Stock cannot be negative`

---

### 5) Các endpoint liên quan (tham khảo nhanh)
- Lấy chi tiết theo ID: `GET /products/:id`
- Lấy chi tiết theo slug: `GET /products/slug/:slug`
- Tìm kiếm: `GET /products/search?q=keyword&limit=20`
- Tính tổng tồn kho: `GET /products/:id/stock` (tổng của `variants.stock`, hoặc `stock_quantity` nếu không có variants)
- Danh sách với filter/pagination/sort: `GET /products`
  - Query (tham khảo): `page`, `limit`, `category_id`, `collection_id` ✨, `status`, `is_featured`, `search`, `sort_by` (`created_at|price|name`), `sort_order` (`ASC|DESC`)
  - **Mới**: `collection_id` - Filter products theo collection UUID (ví dụ: `/products?collection_id=550e8400-e29b-41d4-a716-446655440000`)
  - Có thể kết hợp nhiều filters: `/products?collection_id=xxx&category_id=yyy&status=active&search=shirt`
  - Chi tiết: Xem [Products Filter by Collection](./products_filter_by_collection.md)

---

### Ghi chú triển khai phía Backend
- Validation sử dụng `class-validator` theo các DTO trong `src/modules/products/dto`.
- Business rules & mapping lỗi DB nằm ở `ProductsService` (`src/modules/products/products.service.ts`).
- Quan hệ `category_id` tham chiếu `categories.id`; vi phạm FK sẽ trả về `Invalid category_id (foreign key not found)`.


