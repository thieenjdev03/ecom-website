### Product × Size × Color – Mối quan hệ và luồng tích hợp

Tài liệu này mô tả cách `products`, `sizes`, `colors` liên quan và cách FRONTEND sử dụng để tạo/hiển thị biến thể sản phẩm theo Size × Color.

Thành phần liên quan:
- `Product` (biến thể lưu trong trường `variants` – jsonb)
- `Size` (`src/modules/sizes`) – entity riêng, có thể gắn với `Category`
- `Color` (`src/modules/colors`) – entity riêng

Hiện trạng model:
- `ProductVariant` gồm: `name`, `color_id`, `size_id`, `sku`, `price`, `stock`, `barcode?`.
- `color_id` và `size_id` là tham chiếu logic (UUID/string) tới entity `Color` và `Size`.
- `Size` có thể ràng buộc theo `Category` để hiển thị các size phù hợp từng loại hàng.

Hàm ý thực thi ở FRONTEND (hiện tại):
- Biến thể Product đại diện cho 1 cặp (Size, Color) và lưu rõ `color_id`, `size_id` trong JSONB.
- FRONTEND lấy danh sách `sizes` (có thể filter theo `categoryId`) và `colors` để dựng ma trận Size × Color, sau đó sinh `variants[]` (bao gồm `color_id`, `size_id`) để gửi lên API tạo/cập nhật Product.

API tham chiếu nhanh
- Sizes
  - POST `/sizes` (tạo)
  - GET `/sizes?categoryId=` (liệt kê, có thể lọc theo `categoryId`)
  - GET `/sizes/:id`, PATCH `/sizes/:id`, DELETE `/sizes/:id`
- Colors
  - POST `/colors` (tạo)
  - GET `/colors` (liệt kê)
  - GET `/colors/:id`, PATCH `/colors/:id`, DELETE `/colors/:id`
- Products (liên quan variants/stock)
  - POST `/products` (tạo product, có thể kèm `variants[]`)
  - PATCH `/products/:id` (cập nhật product/variants)
  - PATCH `/products/:id/variants/:sku/stock` (điều chỉnh stock 1 biến thể)
  - GET `/products` (danh sách + filters), GET `/products/:id`, GET `/products/slug/:slug`, GET `/products/:id/stock`, DELETE `/products/:id`

Quy tắc nghiệp vụ cần tuân thủ (tại `ProductsService`):
- Nếu cung cấp `variants[]` (>0):
  - KHÔNG được đặt `stock_quantity` > 0 ở product cha
  - KHÔNG được đặt `sku` ở product cha
- `sale_price` (nếu có) phải `<= price`
- `slug` product phải unique; `sku` product (nếu dùng chế độ không-variants) phải unique

Luồng FE đề xuất để tạo Product theo Size × Color
1) Chọn `Category` (nếu có) → gọi `GET /sizes?categoryId=` để lấy size phù hợp; gọi `GET /colors` để lấy màu.
2) Dựng ma trận Size × Color người dùng chọn (ví dụ: Sizes = [S,M,L], Colors = [Black, Blue]).
3) Sinh `variants[]` theo quy ước đặt tên và SKU nhất quán, ví dụ:
   - `name = "{Size} - {Color}"` → "M - Black"
   - `sku = "{BASE}-{SIZE}-{COLOR}"` → "POLO-M-BLACK" (đảm bảo unique)
   - `price` mỗi biến thể (có thể dùng `price` chung hoặc theo biến thể)
   - `stock` ban đầu (0 hoặc giá trị nhập)
4) Gửi POST `/products` body gồm các trường product chung + `variants[]`. Lưu ý:
   - Không gửi `stock_quantity` và không gửi `sku` của product cha khi đã có `variants`.
5) Khi cần chỉnh tồn kho 1 biến thể: dùng `PATCH /products/:id/variants/:sku/stock` với `{ stock: number }`.

Ví dụ payload tạo Product (Size × Color, có `color_id`/`size_id`)
```json
{
  "name": "Polo Shirt",
  "slug": "polo-shirt",
  "price": 399000,
  "category_id": 1,
  "variants": [
    { "name": "S - Black", "color_id": "<color-uuid>", "size_id": "<size-uuid>", "sku": "POLO-S-BLACK", "price": 399000, "stock": 10 },
    { "name": "M - Black", "color_id": "<color-uuid>", "size_id": "<size-uuid>", "sku": "POLO-M-BLACK", "price": 399000, "stock": 15 },
    { "name": "S - Blue",  "color_id": "<color-uuid>", "size_id": "<size-uuid>", "sku": "POLO-S-BLUE",  "price": 399000, "stock": 5  },
    { "name": "M - Blue",  "color_id": "<color-uuid>", "size_id": "<size-uuid>", "sku": "POLO-M-BLUE",  "price": 399000, "stock": 8  }
  ]
}
```

Ví dụ cập nhật tồn kho 1 biến thể
```json
{
  "stock": 25
}
```
(Endpoint: `PATCH /products/:id/variants/POLO-M-BLACK/stock`)

Hiển thị ở FE
- Trang form Product:
  - Toggle "Quản lý theo biến thể" → nếu bật, hiển thị lưới Size × Color.
  - Chọn sizes (từ `/sizes`) và colors (từ `/colors`) → tự sinh danh sách variants.
  - Cho phép chỉnh `price`/`stock` từng biến thể; đảm bảo SKU duy nhất.
  - Không hiển thị `stock_quantity` và `sku` của product cha khi dùng variants.
- Trang chi tiết Product:
  - Dùng `GET /products/:id/stock` để hiển thị tổng tồn kho (sum theo variants nếu có).
  - Cho phép chỉnh nhanh stock 1 biến thể qua endpoint chuyên biệt.

Định hướng mở rộng backend (tương lai)
- Nếu cần liên kết rõ ràng tới `Size`/`Color`, có thể mở rộng `ProductVariant` lưu `sizeId`, `colorId` (UUID/number) thay vì encode qua `name`.
- Có thể bổ sung bảng `variant_attributes` hoặc schema `attributes: [{ key, value, refId? }]` cho tính mở rộng (ví dụ chất liệu, kiểu dáng...).

Ghi chú
- `Size` hiện liên kết tới `Category` giúp giới hạn danh sách size theo ngành hàng.
- `Color` là danh mục chung; FE quyết định màu nào được áp vào từng product.
- Tất cả ràng buộc quan trọng liên quan đến variants đã được backend kiểm tra trong `ProductsService.validateProduct`.


