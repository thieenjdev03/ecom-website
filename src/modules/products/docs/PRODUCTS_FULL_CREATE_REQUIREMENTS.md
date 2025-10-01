# Requirements: Full Product Create (Simple-First)

## 0) Triết lý
- Một endpoint duy nhất: tạo mọi thứ trong 1 lần gọi.
- POST-only (không PATCH/PUT).
- Transaction: tất cả thành công hoặc rollback.
- Không bắt buộc idempotency (có thể thêm sau).

---

## 1) Endpoint

- Method: `POST`
- Path: `/admin/products/full`
- Headers:
  - `Authorization: Bearer <TOKEN>`
  - `Content-Type: application/json`

- Yêu cầu: tối thiểu cần có `product.title` và ít nhất 1 phần tử trong `variants`.

### Request body
```json
{
  "product": {
    "id": "optional-uuid",
    "title": "New T-Shirt",
    "slug": "new-t-shirt",
    "description": "Comfortable cotton t-shirt",
    "status": "draft"
  },
  "variants": [
    {
      "id": "optional-uuid",
      "sku": "TSHIRT-RED-M",
      "name": "Red / M",
      "priceOriginal": 199000,
      "priceFinal": 159000,
      "currency": "VND",
      "stockOnHand": 50,
      "attributes": { "color": "Red", "size": "M" }
    }
  ],
  "media": [
    {
      "id": "optional-uuid",
      "url": "https://cdn.example.com/primary.jpg",
      "type": "image",
      "isPrimary": true,
      "isHover": false,
      "position": 0,
      "alt": "Primary"
    }
  ],
  "defaultVariant": { "by": "sku", "value": "TSHIRT-RED-M" },
  "publish": true
}
```

Ghi chú thuật ngữ ngắn gọn:
- Transaction: chạy trong 1 phiên giao dịch DB; lỗi là hoàn tác toàn bộ.
- attributes: cặp key–value tự do (để filter sau này).

### Response
- `201` khi tạo mới, `200` khi upsert
```json
{
  "product": { "id": "uuid", "title": "New T-Shirt", "slug": "new-t-shirt", "status": "published" },
  "variants": [{ "id": "uuid", "sku": "TSHIRT-RED-M", "stockOnHand": 50 }],
  "media": [{ "id": "uuid", "url": "https://cdn.example.com/primary.jpg", "isPrimary": true }],
  "defaultVariantId": "uuid"
}
```

---

## 2) Luồng xử lý (rút gọn)
1. BEGIN TRANSACTION
2. Nếu có `product.id` → upsert (cập nhật); nếu không → create (`status` mặc định `draft` nếu không gửi).
3. Tạo/Upsert variants:
   - Bắt buộc: `sku`, `priceFinal`, `currency`, `stockOnHand`.
4. Tạo/Upsert media:
   - Cho phép rỗng; nếu có, enforce chỉ 1 `isPrimary=true` và tối đa 1 `isHover=true`.
5. Đặt defaultVariant (theo `id` hoặc `sku`; nếu không gửi → lấy variant đầu tiên).
6. Nếu `publish=true` → set `status="published"`.
7. COMMIT (nếu lỗi → ROLLBACK và trả code phù hợp).

---

## 3) Rule tối thiểu
- Product
  - `title`: bắt buộc, 2–200 ký tự.
  - `slug`: nếu bỏ trống → tự sinh từ `title` (lowercase, a–z0–9-).
- Variant
  - `sku`: bắt buộc, unique trong 1 product.
  - `currency`: bắt buộc (ví dụ cho phép VND, USD—config sau).
  - `priceOriginal ≥ 0` (optional); `priceFinal ≥ 0` (bắt buộc); nếu cả 2 có → `priceFinal ≤ priceOriginal`.
  - `stockOnHand` là số nguyên ≥ 0.
- Media
  - `url` HTTPS; `type ∈ {image,video}`.
  - Tối đa 1 `isPrimary=true`; tối đa 1 `isHover=true`.
- Publish
  - Chỉ publish khi có ít nhất 1 variant.
  - Không bắt buộc phải có ảnh (đơn giản trước; có thể nâng cấp sau).

---

## 4) Mã lỗi (tối giản)
- `400`: body sai/thiếu trường bắt buộc; `priceFinal > priceOriginal`; `stockOnHand < 0`; nhiều ảnh `isPrimary`.
- `401`: thiếu/invalid token.
- `403`: không đủ quyền (không phải admin).
- `404`: `product.id`/`variant.id` không tồn tại khi upsert.
- `409`: `sku` trùng trong cùng product; `slug` trùng (khi không tự sinh được).

Message trả về ngắn, rõ: code, message, field?.

---

## 5) Bảo mật & Giới hạn
- Role yêu cầu: admin (RBAC—phân quyền theo vai trò).
- Rate limit nhẹ: 20 req/min/user.
- Body limit: 1 MB.

---

## 6) Ví dụ curl
```bash
curl -X POST https://your-api/admin/products/full \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "product": { "title": "New T-Shirt", "slug": "new-t-shirt", "status": "draft" },
    "variants": [{
      "sku": "TSHIRT-RED-M",
      "name": "Red / M",
      "priceOriginal": 199000,
      "priceFinal": 159000,
      "currency": "VND",
      "stockOnHand": 50
    }],
    "media": [{
      "url": "https://cdn.example.com/primary.jpg",
      "type": "image",
      "isPrimary": true,
      "position": 0
    }],
    "defaultVariant": { "by": "sku", "value": "TSHIRT-RED-M" },
    "publish": true
  }'
```

---

## 7) Gợi ý triển khai nhanh (NestJS—pseudo)
- DTO: `CreateFullProductDto` (`product`, `variants[]`, `media[]`, `defaultVariant?`, `publish?`).
- Controller: `POST /admin/products/full` → `productsFullController.create(dto)`.
- Service: `productsFullService.create(dto)` với transaction (TypeORM/Prisma).
- Validate bằng `class-validator` (đơn giản, rule tối thiểu như trên).
- Repository: `products`, `product_variants`, `product_media`.
- Slug util: hàm `toSlug(title)` sinh slug a–z0–9-.

---

Ghi chú: Khi chạy ổn, có thể nâng cấp nhẹ: thêm idempotency và presigned upload mà không đổi hợp đồng chính.
