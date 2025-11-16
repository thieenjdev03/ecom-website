# Product API Query & Filter Documentation

## Tổng quan

API Products cung cấp các endpoint để query, filter, search và lấy thông tin sản phẩm với hỗ trợ đa ngôn ngữ (multi-language).

## Endpoints

### 1. GET `/products` - Lấy danh sách sản phẩm với filters

Lấy danh sách sản phẩm với các tùy chọn filter, sort, và pagination.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `locale` | string | No | `en` | Ngôn ngữ hiển thị (en, vi, ...) |
| `category_id` | UUID | No | - | Filter theo category ID |
| `status` | enum | No | - | Filter theo trạng thái: `active`, `draft`, `out_of_stock`, `discontinued` |
| `is_featured` | boolean | No | - | Filter sản phẩm nổi bật (`true`/`false`) |
| `enable_sale_tag` | boolean | No | - | Filter sản phẩm có sale tag |
| `search` | string | No | - | Tìm kiếm trong tên và mô tả sản phẩm |
| `page` | number | No | `1` | Số trang (min: 1) |
| `limit` | number | No | `20` | Số lượng sản phẩm mỗi trang (min: 1, max: 100) |
| `sort_by` | enum | No | `created_at` | Sắp xếp theo: `created_at`, `updated_at`, `name`, `price`, `status` |
| `sort_order` | enum | No | `DESC` | Thứ tự sắp xếp: `ASC`, `DESC` |

**Response Format:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "slug": "product-slug",
      "description": "Product description",
      "short_description": "Short description",
      "price": "100.00",
      "sale_price": "80.00",
      "cost_price": "50.00",
      "images": ["url1", "url2"],
      "stock_quantity": 100,
      "sku": "SKU-001",
      "barcode": "123456789",
      "tags": ["tag1", "tag2"],
      "status": "active",
      "is_featured": true,
      "enable_sale_tag": true,
      "meta_title": "Meta title",
      "meta_description": "Meta description",
      "weight": "1.5",
      "dimensions": {
        "length": 10,
        "width": 5,
        "height": 3
      },
      "category": {
        "id": "category-uuid",
        "name": "Category Name",
        "slug": "category-slug"
      },
      "variants": [
        {
          "name": "Variant Name",
          "color_id": "color-uuid",
          "size_id": "size-uuid",
          "sku": "VARIANT-SKU-001",
          "price": "90.00",
          "stock": 50,
          "barcode": "987654321",
          "image_url": "variant-image-url",
          "color": {
            "id": "color-uuid",
            "name": "Red",
            "hexCode": "#FF0000"
          },
          "size": {
            "id": "size-uuid",
            "name": "M"
          }
        }
      ],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Ví dụ sử dụng:**

```bash
# Lấy tất cả sản phẩm
GET /products

# Filter theo category và status
GET /products?category_id=b4b2b07f-6825-402b-bd2c-f9aef8cfbba5&status=active

# Lấy sản phẩm nổi bật, sắp xếp theo giá tăng dần
GET /products?is_featured=true&sort_by=price&sort_order=ASC

# Tìm kiếm sản phẩm
GET /products?search=polo&locale=vi

# Pagination
GET /products?page=2&limit=10

# Kết hợp nhiều filters
GET /products?category_id=xxx&status=active&is_featured=true&sort_by=created_at&sort_order=DESC&page=1&limit=20&locale=vi
```

### 2. GET `/products/search` - Tìm kiếm sản phẩm

Tìm kiếm sản phẩm theo từ khóa trong tên và mô tả. Chỉ trả về sản phẩm có status `active`.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Từ khóa tìm kiếm |
| `limit` | number | No | `20` | Số lượng kết quả tối đa |
| `locale` | string | No | `en` | Ngôn ngữ hiển thị |

**Response Format:**

```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    // ... các trường khác tương tự như GET /products
  }
]
```

**Ví dụ sử dụng:**

```bash
# Tìm kiếm sản phẩm
GET /products/search?q=polo&limit=10&locale=vi
```

### 3. GET `/products/slug/:slug` - Lấy sản phẩm theo slug

Lấy thông tin chi tiết sản phẩm theo slug.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Slug của sản phẩm |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `locale` | string | No | `en` | Ngôn ngữ hiển thị |

**Logic:**
- Tìm kiếm slug trong locale được chỉ định
- Nếu không tìm thấy và locale khác `en`, tự động fallback sang tiếng Anh
- Loại trừ sản phẩm đã bị xóa mềm (soft-deleted)

**Response Format:**

```json
{
  "id": "uuid",
  "name": "Product Name",
  // ... các trường khác tương tự như GET /products
}
```

**Ví dụ sử dụng:**

```bash
# Lấy sản phẩm theo slug
GET /products/slug/ao-polo-nam?locale=vi
GET /products/slug/mens-polo-shirt?locale=en
```

### 4. GET `/products/:id` - Lấy sản phẩm theo ID

Lấy thông tin chi tiết sản phẩm theo ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | ID của sản phẩm |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `locale` | string | No | `en` | Ngôn ngữ hiển thị |

**Ví dụ sử dụng:**

```bash
GET /products/b4b2b07f-6825-402b-bd2c-f9aef8cfbba5?locale=vi
```

### 5. GET `/products/:id/stock` - Lấy tổng số lượng tồn kho

Lấy tổng số lượng tồn kho của sản phẩm.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | ID của sản phẩm |

**Response Format:**

```json
100
```

**Logic:**
- Nếu sản phẩm có variants: tổng stock của tất cả variants
- Nếu sản phẩm không có variants: trả về `stock_quantity`

## Filter Logic

### Status Filter

| Value | Description |
|-------|-------------|
| `active` | Sản phẩm đang hoạt động |
| `draft` | Sản phẩm ở chế độ nháp |
| `out_of_stock` | Sản phẩm hết hàng |
| `discontinued` | Sản phẩm ngừng sản xuất |

### Category Filter

- Filter theo `category_id` (UUID)
- Chỉ trả về sản phẩm thuộc category được chỉ định

### Featured Filter

- `is_featured=true`: Chỉ lấy sản phẩm nổi bật
- `is_featured=false`: Chỉ lấy sản phẩm không nổi bật
- Không truyền: Lấy tất cả (có và không có nổi bật)

### Search Filter

- Tìm kiếm trong trường `name` và `description` (JSONB)
- Sử dụng `ILIKE` (case-insensitive)
- Hỗ trợ partial matching (tìm kiếm một phần)

### Sorting

**Các trường có thể sắp xếp:**
- `created_at`: Ngày tạo
- `updated_at`: Ngày cập nhật
- `name`: Tên sản phẩm (lưu ý: do name là JSONB, sẽ sort theo `created_at` thay thế)
- `price`: Giá sản phẩm
- `status`: Trạng thái

**Thứ tự sắp xếp:**
- `ASC`: Tăng dần
- `DESC`: Giảm dần (mặc định)

### Pagination

- `page`: Số trang (bắt đầu từ 1)
- `limit`: Số lượng items mỗi trang (min: 1, max: 100, default: 20)
- Response bao gồm metadata: `total`, `page`, `limit`, `totalPages`

## Multi-language Support

Tất cả các endpoint đều hỗ trợ parameter `locale` để lấy dữ liệu theo ngôn ngữ:

- Các trường multi-language: `name`, `slug`, `description`, `short_description`, `meta_title`, `meta_description`
- Format: `{ "en": "English text", "vi": "Tiếng Việt" }`
- Fallback: Nếu không tìm thấy trong locale được chỉ định, tự động fallback sang `en`
- Default: Nếu không truyền `locale`, mặc định là `en`

## Soft Delete

Tất cả các query đều tự động loại trừ sản phẩm đã bị xóa mềm (`deleted_at IS NULL`).

## Error Handling

| Status Code | Description |
|-------------|-------------|
| `200` | Thành công |
| `400` | Bad Request - Tham số không hợp lệ |
| `404` | Not Found - Không tìm thấy sản phẩm |
| `500` | Internal Server Error |

## Best Practices

1. **Pagination**: Luôn sử dụng pagination cho danh sách sản phẩm để tránh load quá nhiều dữ liệu
2. **Locale**: Luôn chỉ định `locale` phù hợp với người dùng
3. **Filter**: Kết hợp nhiều filters để có kết quả chính xác hơn
4. **Search**: Sử dụng endpoint `/products/search` cho tìm kiếm nhanh, `/products?search=...` cho tìm kiếm kèm filters
5. **Slug**: Ưu tiên sử dụng slug thay vì ID cho SEO-friendly URLs

## Notes

- Tất cả giá tiền được lưu dưới dạng `decimal(10,2)`
- Sản phẩm có thể có variants (màu sắc, kích thước) hoặc không
- Nếu sản phẩm có variants, `stock_quantity` sẽ là 0 và stock được quản lý ở level variant
- Images là array of URLs
- Tags là array of strings

