# Hướng dẫn quy trình upload (tạo) sản phẩm cho Admin

## Tổng quan
Tài liệu này mô tả chi tiết các bước để admin tạo mới sản phẩm, thêm biến thể (variants), quản lý tồn kho, thêm media (ảnh/video), chọn biến thể mặc định và publish sản phẩm. Các ví dụ sử dụng `curl` với header `Authorization: Bearer <TOKEN>`.

## Tiền đề
- Đã đăng nhập admin để lấy `access_token`
- Header chung:
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN>`
- Khuyến nghị: tạo sản phẩm ở trạng thái `draft`, hoàn tất nội dung rồi chuyển `published`.

## Quy trình từng bước

### Bước 1: Tạo sản phẩm (Draft)
```bash
curl -X POST https://your-api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "title": "New T-Shirt",
    "slug": "new-t-shirt",
    "description": "Comfortable cotton t-shirt",
    "status": "draft"
  }'
```
Ghi lại `product.id` từ response để dùng ở các bước tiếp theo.

### Bước 2: Tạo các biến thể (Generate Variants)
```bash
curl -X POST https://your-api/admin/products/<PRODUCT_ID>/variants/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '[
    {
      "sku": "TSHIRT-RED-M",
      "name": "Red / M",
      "priceOriginal": "199000",
      "priceFinal": "159000",
      "currency": "VND",
      "stockOnHand": 50
    },
    {
      "sku": "TSHIRT-BLUE-L",
      "name": "Blue / L",
      "priceOriginal": "199000",
      "priceFinal": "159000",
      "currency": "VND",
      "stockOnHand": 30
    }
  ]'
```

### Bước 3: Điều chỉnh tồn kho (nếu cần)
```bash
curl -X PATCH https://your-api/admin/products/variants/<VARIANT_ID>/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{ "stockOnHand": 100 }'
```

### Bước 4: Thêm media (ảnh/video) cho sản phẩm
```bash
curl -X POST https://your-api/admin/products/<PRODUCT_ID>/media \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '[
    {
      "url": "https://example.com/primary.jpg",
      "type": "image",
      "position": 0,
      "isPrimary": true,
      "isHover": false,
      "alt": "Primary image"
    },
    {
      "url": "https://example.com/hover.jpg",
      "type": "image",
      "position": 1,
      "isHover": true,
      "alt": "Hover image"
    }
  ]'
```

### Bước 5: Chọn biến thể mặc định (Default Variant) — tùy chọn
```bash
curl -X PATCH https://your-api/products/<PRODUCT_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{ "defaultVariantId": "<VARIANT_ID>" }'
```

### Bước 6: Cập nhật thông tin sản phẩm — tùy chọn
```bash
curl -X PATCH https://your-api/products/<PRODUCT_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "title": "New T-Shirt (Updated)",
    "price": "0",
    "priceOriginal": "0",
    "attribute": ""
  }'
```

### Bước 7: Publish sản phẩm
```bash
curl -X PATCH https://your-api/products/<PRODUCT_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{ "status": "published" }'
```

### Bước 8: Kiểm tra hiển thị
- Theo `slug`:
```bash
curl -X GET https://your-api/products/slug/new-t-shirt
```
- Hoặc theo `id`:
```bash
curl -X GET https://your-api/products/<PRODUCT_ID>
```
Xác minh các trường `variants`, `media`, `attributes` trong response.

## Gợi ý xử lý lỗi thường gặp
- `409 Conflict`: trùng `slug` → đổi `slug` khác, chuẩn hóa URL-friendly
- `400 Bad Request`: thiếu/bất hợp lệ trường bắt buộc → kiểm tra message trả về
- `404 Not Found`: `productId`/`variantId` không tồn tại

## Checklist trước khi publish
- Tiêu đề, mô tả rõ ràng, từ khóa tìm kiếm phù hợp
- Media đầy đủ: 1 ảnh primary, 1 ảnh hover (nếu có), thứ tự chuẩn
- Variants đúng giá, tồn kho, SKU duy nhất
- Đặt `defaultVariantId` nếu cần hiển thị nhanh
- Trạng thái `published` sau khi hoàn tất

## Tham chiếu
- API tài liệu chi tiết: xem `src/modules/products/docs/PRODUCTS_API_DOCUMENTATION.md`


