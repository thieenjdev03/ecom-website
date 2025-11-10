# Orders API - Frontend Fixes Guide

## 🔴 Vấn đề hiện tại và cách fix

### 1. **Product ID phải là UUID string (ĐÃ FIX ở Backend)**

**Vấn đề:**
- Frontend đang gửi: `productId: 'fc734035-40fe-441c-a989-92004dc368fb'` ✅ (đúng format UUID)
- Backend đã được cập nhật để accept UUID string thay vì number

**Frontend không cần thay đổi gì** - Backend đã được fix để match với format UUID mà frontend đang gửi.

---

### 2. **Validation Rules cho Order Creation**

#### ✅ Request Body Format:

```typescript
{
  userId: string,              // UUID v4 - required
  items: [                     // Array - required, min 1 item
    {
      productId: string,       // UUID v4 - required (ĐÃ FIX)
      productName: string,      // Required, không được rỗng
      productSlug: string,      // Required, không được rỗng
      variantId?: string,       // Optional
      variantName?: string,      // Optional
      quantity: number,        // Required, phải > 0
      unitPrice: string,        // Required, format: "123.00" (2 decimal places)
      totalPrice: string,       // Required, format: "123.00" (2 decimal places)
      sku?: string             // Optional
    }
  ],
  summary: {                   // Required object
    subtotal: string,          // Required, format: "123.00"
    shipping: string,          // Required, format: "8.00"
    tax: string,               // Required, format: "12.30"
    discount: string,          // Required, format: "0.00"
    total: string,             // Required, format: "143.30"
    currency: string           // Required, không được rỗng
  },
  shipping_address?: {         // Optional (nếu không có shippingAddressId)
    full_name: string,         // Required nếu có shipping_address
    phone: string,             // Required nếu có shipping_address
    address_line: string,      // Required nếu có shipping_address
    city?: string,             // Optional
    ward?: string,             // Optional
    district?: string          // Optional
  },
  shippingAddressId?: string,  // Optional UUID (nếu không có shipping_address)
  billingAddressId?: string,   // Optional UUID
  paymentMethod?: string,      // Optional: 'PAYPAL' | 'STRIPE' | 'COD'
  notes?: string              // Optional
}
```

---

### 3. **Common Validation Errors và Cách Fix**

#### ❌ Error: "productId must be a valid UUID v4"
**Fix:** Đảm bảo `productId` là UUID string hợp lệ (format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)

#### ❌ Error: "Order must contain at least one item"
**Fix:** Đảm bảo `items` array có ít nhất 1 item

#### ❌ Error: "Item X: Product name is required"
**Fix:** Đảm bảo mỗi item có `productName` không rỗng

#### ❌ Error: "Item X: Unit price must be a string with exactly two decimal places"
**Fix:** Format giá phải là string với 2 chữ số thập phân:
- ✅ Đúng: `"123.00"`, `"29.99"`, `"0.50"`
- ❌ Sai: `123`, `"123"`, `"123.0"`, `"123.000"`

#### ❌ Error: "Order summary is missing required fields"
**Fix:** Đảm bảo `summary` có đầy đủ: `subtotal`, `shipping`, `tax`, `discount`, `total`, `currency`

#### ❌ Error: "Shipping information is required"
**Fix:** Phải cung cấp **một trong hai**:
- `shippingAddressId` (UUID của address đã lưu)
- HOẶC `shipping_address` object (address mới)

#### ❌ Error: "Cannot provide both shippingAddressId and shipping_address"
**Fix:** Chỉ cung cấp **một trong hai**, không được cung cấp cả hai

#### ❌ Error: "User with ID xxx not found"
**Fix:** Đảm bảo `userId` là UUID hợp lệ và user tồn tại trong database

#### ❌ Error: "Shipping address with ID xxx not found or does not belong to user"
**Fix:** Đảm bảo `shippingAddressId` tồn tại và thuộc về user đó

---

### 4. **Best Practices cho Frontend**

#### ✅ Format Price Values:
```typescript
// Helper function để format price
function formatPrice(price: number): string {
  return price.toFixed(2); // "123.00", "29.99"
}

// Usage
const item = {
  unitPrice: formatPrice(123),    // "123.00"
  totalPrice: formatPrice(123),   // "123.00"
};
```

#### ✅ Validate trước khi gửi:
```typescript
function validateOrder(order: CreateOrderDto): string[] {
  const errors: string[] = [];
  
  // Validate items
  if (!order.items || order.items.length === 0) {
    errors.push('Order must contain at least one item');
  }
  
  // Validate each item
  order.items?.forEach((item, index) => {
    if (!item.productId || !isUUID(item.productId)) {
      errors.push(`Item ${index + 1}: Invalid product ID`);
    }
    if (!item.unitPrice || !/^\d+\.\d{2}$/.test(item.unitPrice)) {
      errors.push(`Item ${index + 1}: Invalid unit price format`);
    }
    // ... more validations
  });
  
  // Validate summary
  if (!order.summary) {
    errors.push('Order summary is required');
  }
  
  // Validate shipping
  if (!order.shippingAddressId && !order.shipping_address) {
    errors.push('Shipping information is required');
  }
  
  return errors;
}
```

#### ✅ TypeScript Types:
```typescript
interface OrderItem {
  productId: string;        // UUID
  productName: string;
  productSlug: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: string;        // "123.00"
  totalPrice: string;       // "123.00"
  sku?: string;
}

interface OrderSummary {
  subtotal: string;         // "123.00"
  shipping: string;          // "8.00"
  tax: string;              // "12.30"
  discount: string;          // "0.00"
  total: string;            // "143.30"
  currency: string;         // "USD"
}

interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line: string;
  city?: string;
  ward?: string;
  district?: string;
}

interface CreateOrderDto {
  userId: string;           // UUID
  items: OrderItem[];
  summary: OrderSummary;
  shipping_address?: ShippingAddress;
  shippingAddressId?: string;  // UUID
  billingAddressId?: string;   // UUID
  paymentMethod?: 'PAYPAL' | 'STRIPE' | 'COD';
  notes?: string;
}
```

---

### 5. **Error Response Format**

Khi có lỗi, API sẽ trả về:

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Item 1: Product ID is required and must be a valid UUID.",
  "timestamp": "2025-01-08T01:14:23.000Z",
  "path": "/orders",
  "method": "POST"
}
```

Hoặc với multiple validation errors:

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Validation failed",
  "errors": [
    "productId must be a valid UUID v4",
    "unitPrice must be a string with exactly two decimal places"
  ],
  "timestamp": "2025-01-08T01:14:23.000Z",
  "path": "/orders",
  "method": "POST"
}
```

---

### 6. **Example Request (Correct Format)**

```json
{
  "userId": "be51a8c8-0d30-46fe-82af-a1f53b46de06",
  "items": [
    {
      "productId": "fc734035-40fe-441c-a989-92004dc368fb",
      "productName": "Áo sơ mi nam1123",
      "productSlug": "áo-sơ-mi-nam1123",
      "variantId": "fc734035-40fe-441c-a989-92004dc368fb-variant-0",
      "variantName": "5e35a8a1-cb26-4398-ab5d-5a67d7db2edd - c48983a2-6fc9-49ee-ac98-d86bb074a198",
      "quantity": 1,
      "unitPrice": "123.00",
      "totalPrice": "123.00",
      "sku": "fc734035-40fe-441c-a989-92004dc368fb-c48983a2-6fc9-49ee-ac98-d86bb074a198"
    }
  ],
  "summary": {
    "subtotal": "123.00",
    "shipping": "8.00",
    "tax": "12.30",
    "discount": "0.00",
    "total": "143.30",
    "currency": "USD"
  },
  "shipping_address": {
    "full_name": "Thien Nguyen",
    "phone": "0123456781",
    "address_line": "New York, NY, Hoa Kỳ, 1234",
    "city": "NY",
    "ward": "",
    "district": "VN"
  },
  "paymentMethod": "PAYPAL",
  "notes": ""
}
```

---

## ✅ Summary

**Backend đã được fix:**
- ✅ `productId` giờ accept UUID string (không còn là number)
- ✅ Validation messages rõ ràng và cụ thể
- ✅ Error handling tốt hơn

**Frontend cần đảm bảo:**
- ✅ `productId` là UUID string (đã đúng)
- ✅ Tất cả price values là string với format "123.00" (2 decimal places)
- ✅ Cung cấp đầy đủ required fields
- ✅ Chỉ cung cấp `shippingAddressId` HOẶC `shipping_address`, không phải cả hai

