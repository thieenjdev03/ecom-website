Dưới đây là phiên bản cập nhật hoàn chỉnh (v2) của tài liệu bạn gửi, đã bổ sung đầy đủ 3 phần quan trọng:
➕ /paypal/capture-order, 🧾 Chuẩn hóa giá trị tiền tệ, và 💳 thêm paymentMethod + các field thanh toán trong Orders API.
Tài liệu đã được tinh chỉnh để frontend–backend có thể dùng ngay khi tích hợp thực tế.

⸻

📚 API Documentation – Orders & PayPal Integration (v2)

🔗 Base URL

https://your-api-domain.com/api

🔐 Authentication

All endpoints require JWT authentication:

Authorization: Bearer <your-jwt-token>


⸻

📦 Orders API

Create Order

POST /orders

Creates a new order with items and payment details.

Request Body:

{
  "userId": "uuid-string",
  "items": [
    {
      "productId": 1,
      "productName": "Premium T-Shirt",
      "productSlug": "premium-t-shirt",
      "variantId": "variant-123",
      "variantName": "Red - Large",
      "quantity": 2,
      "unitPrice": "29.99",
      "totalPrice": "59.98",
      "sku": "TSH-001-RED-L"
    }
  ],
  "summary": {
    "subtotal": "59.98",
    "shipping": "5.99",
    "tax": "6.60",
    "discount": "0.00",
    "total": "72.57",
    "currency": "USD"
  },
  "shippingAddressId": "uuid-string",
  "billingAddressId": "uuid-string",
  "notes": "Please deliver after 5 PM"
}

💡 Note: All currency values are formatted as strings with two decimal places, following PayPal’s requirements.
The backend will recalculate subtotal, tax, and total from product data to ensure accuracy.

Response:

{
  "id": "order-uuid",
  "orderNumber": "ORD-20250101-1234",
  "userId": "user-uuid",
  "status": "PENDING",
  "paymentMethod": "PAYPAL",
  "items": [...],
  "summary": {...},
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-01T10:00:00Z"
}


⸻

Get All Orders (Admin Only)

GET /orders?userId=uuid&status=PENDING

Response:

[
  {
    "id": "order-uuid",
    "orderNumber": "ORD-20250101-1234",
    "status": "PAID",
    "paymentMethod": "PAYPAL",
    "paypalOrderId": "6S5011234B5562345",
    "paypalTransactionId": "3GG57250SL7328348",
    "paidAmount": "72.57",
    "paidCurrency": "USD",
    "paidAt": "2025-01-01T10:05:00Z",
    "user": {...},
    "items": [...],
    "summary": {...},
    "createdAt": "2025-01-01T10:00:00Z"
  }
]


⸻

Get My Orders

GET /orders/my-orders

Returns orders belonging to the authenticated user.

Response: Same structure as above.

⸻

Get Order by ID

GET /orders/{id}

Response:

{
  "id": "order-uuid",
  "orderNumber": "ORD-20250101-1234",
  "status": "PAID",
  "paymentMethod": "PAYPAL",
  "paypalOrderId": "6S5011234B5562345",
  "paypalTransactionId": "3GG57250SL7328348",
  "paidAmount": "72.57",
  "paidCurrency": "USD",
  "paidAt": "2025-01-01T10:05:00Z",
  "items": [...],
  "summary": {...},
  "shippingAddress": {...},
  "billingAddress": {...},
  "createdAt": "2025-01-01T10:00:00Z"
}


⸻

Get Order by Order Number

GET /orders/number/{orderNumber}
Same response as above.

⸻

Update Order (Admin Only)

PATCH /orders/{id}

Request Body:

{
  "status": "SHIPPED",
  "trackingNumber": "1Z999AA1234567890",
  "carrier": "UPS",
  "internalNotes": "Customer requested expedited shipping"
}

Response: Updated order object.

⸻

Delete Order (Admin Only)

DELETE /orders/{id}

Response:

{
  "message": "Order deleted successfully"
}


⸻

💳 PayPal API

Create PayPal Order

POST /paypal/create-order

Creates a new PayPal order.

Request Body:

{
  "value": "72.57",
  "currency": "USD",
  "description": "Order #ORD-20250101-1234"
}

Response:

{
  "success": true,
  "orderId": "6S5011234B5562345",
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=6S5011234B5562345",
  "status": "CREATED"
}


⸻

➕ Capture PayPal Order

POST /paypal/capture-order

Captures a PayPal payment after customer approval.

Request Body:

{
  "paypalOrderId": "6S5011234B5562345",
  "orderId": "order-uuid"
}

Response:

{
  "success": true,
  "status": "COMPLETED",
  "paypalTransactionId": "3GG57250SL7328348",
  "paidAmount": "72.57",
  "currency": "USD",
  "paidAt": "2025-01-01T10:05:00Z"
}

💡 Note: This endpoint should be called by the frontend after the PayPal checkout approval (onApprove event).
The backend will verify and finalize the payment with PayPal before updating the order’s status to PAID.

⸻

PayPal Webhook (Internal)

POST /paypal/webhook

Handles PayPal webhook notifications.

Headers:

paypal-auth-algo: SHA256withRSA
paypal-cert-url: https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca123a-4d6a-9c9e-1234567890ab
paypal-transmission-id: 12345678-1234-1234-1234-123456789012
paypal-transmission-sig: signature-string
paypal-transmission-time: 2025-01-01T10:00:00Z

Response:
200 OK (PayPal requires 200 to stop retries)

⸻

📊 Data Models

Order Status Values
	•	PENDING
	•	PAID
	•	PROCESSING
	•	SHIPPED
	•	DELIVERED
	•	CANCELLED
	•	FAILED
	•	REFUNDED

⸻

Order Item Structure

interface OrderItem {
  productId: number;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: string;   // formatted "xx.xx"
  totalPrice: string;  // formatted "xx.xx"
  sku?: string;
}


⸻

Order Summary Structure

interface OrderSummary {
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
}


⸻

Payment Fields (new)

interface PaymentInfo {
  paymentMethod: "PAYPAL" | "STRIPE" | "COD";
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paidAmount?: string;
  paidCurrency?: string;
  paidAt?: string;
}


⸻

🚨 Error Responses

400 Bad Request

{
  "statusCode": 400,
  "message": "Invalid order data",
  "error": "Bad Request"
}

401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

404 Not Found

{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}

500 Internal Server Error

{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}


⸻

🔄 Payment Flow Example

Step 1: Create Order

const order = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    userId: user.id,
    items: cartItems,
    summary: orderSummary,
    shippingAddressId: address.id,
    paymentMethod: 'PAYPAL'
  })
});

Step 2: Create PayPal Order

const paypalOrder = await fetch('/api/paypal/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    value: order.summary.total,
    currency: order.summary.currency,
    description: `Order #${order.orderNumber}`
  })
});

Step 3: Redirect to PayPal

if (paypalOrder.success) {
  window.location.href = paypalOrder.approveUrl;
}

Step 4: Capture PayPal Order (after user pays)

const capture = await fetch('/api/paypal/capture-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    paypalOrderId: paypalOrder.orderId,
    orderId: order.id
  })
});


⸻

📝 Notes
	1.	All monetary values are strings (two decimals) for PayPal compatibility.
	2.	Order summary is recalculated on backend to prevent tampering.
	3.	PayPal capture endpoint finalizes payment and updates order.
	4.	Webhook adds redundancy — safe for async payment notifications.
	5.	Payment fields now stored directly in the Order entity for clarity.
