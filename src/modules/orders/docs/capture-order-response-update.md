# Capture Order API Response - Update Request

## Current Response Structure

Hiện tại API `/paypal/capture-order` trả về response như sau:

```json
{
  "success": true,
  "status": "COMPLETED",
  "paypalTransactionId": "3CT03630HC968313M",
  "paidAmount": "119.00",
  "currency": "USD",
  "paidAt": "2025-11-15T21:34:31.736Z"
}
```

## Requested Additional Fields

Để frontend có thể xử lý và hiển thị thông tin đầy đủ sau khi thanh toán thành công, cần thêm các trường sau vào response:

### 1. Order Information (Required)

```json
{
  "orderId": "order-uuid-string",
  "orderNumber": "ORD-20250101-1234"
}
```

**Lý do:**
- Frontend cần `orderId` để redirect đến trang success với thông tin chính xác
- `orderNumber` giúp hiển thị cho user một cách dễ nhớ hơn UUID
- Đảm bảo frontend không phụ thuộc vào context/state có thể bị mất

### 2. Payer Information (Optional but Recommended)

```json
{
  "payer": {
    "email": "buyer@example.com",
    "name": {
      "given_name": "John",
      "surname": "Doe"
    }
  }
}
```

**Lý do:**
- Hiển thị thông tin người thanh toán cho user xác nhận
- Có thể dùng để gửi email xác nhận
- PayPal API thường trả về thông tin này trong capture response

### 3. Updated Response Structure

Response đầy đủ nên có cấu trúc như sau:

```json
{
  "success": true,
  "status": "COMPLETED",
  "orderId": "order-uuid-string",
  "orderNumber": "ORD-20250101-1234",
  "paypalOrderId": "6S5011234B5562345",
  "paypalTransactionId": "3CT03630HC968313M",
  "paidAmount": "119.00",
  "currency": "USD",
  "paidAt": "2025-11-15T21:34:31.736Z",
  "payer": {
    "email": "buyer@example.com",
    "name": {
      "given_name": "John",
      "surname": "Doe"
    }
  }
}
```

## Implementation Notes

1. **orderId và orderNumber**: Backend đã có trong database sau khi update order, chỉ cần thêm vào response
2. **paypalOrderId**: Có thể lấy từ request body hoặc từ order record
3. **payer information**: Có thể lấy từ PayPal capture response (`capture.payer`)

## Frontend Usage

Sau khi nhận response này, frontend có thể:
1. Redirect đến `/checkout/success?orderId={orderId}` một cách chính xác
2. Hiển thị orderNumber cho user ngay lập tức
3. Hiển thị thông tin payer để xác nhận
4. Không cần phụ thuộc vào context/state có thể bị mất

## Priority

- **High Priority**: `orderId`, `orderNumber` (cần thiết cho flow hiện tại)
- **Medium Priority**: `paypalOrderId` (hữu ích cho tracking)
- **Low Priority**: `payer` information (nice to have, có thể lấy từ order API sau)

