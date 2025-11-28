# Order Detail Page - API Documentation

## Overview

This document provides complete API documentation and frontend requirements for implementing the **Order Detail Page** where admin/seller can view comprehensive order information including customer details, order items, payment status, shipping information, and tracking.

---

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Response Structure](#response-structure)
3. [Frontend Requirements](#frontend-requirements)
4. [UI Layout Suggestions](#ui-layout-suggestions)
5. [Update APIs](#update-apis)

---

## API Endpoints

### GET Order Detail

#### Endpoint

```
GET /orders/:orderId
```

#### Headers

| Key           | Value                   | Required |
| ------------- | ----------------------- | -------- |
| Authorization | `Bearer <access_token>` | Yes      |
| Accept        | `application/json`      | Yes      |

#### Path Parameters

| Parameter | Type   | Description           | Example                                |
| --------- | ------ | --------------------- | -------------------------------------- |
| orderId   | string | Order UUID            | `2313cdd6-e689-45da-947c-18c414a44dcf` |

#### Example Request

```bash
curl -X GET \
  'http://localhost:3000/orders/2313cdd6-e689-45da-947c-18c414a44dcf' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
```

#### Response Body (Success - 200)

```json
{
  "id": "2313cdd6-e689-45da-947c-18c414a44dcf",
  "userId": "be51a8c8-0d30-46fe-82af-a1f53b46de06",
  "orderNumber": "ORD-20251105-0001",
  "status": "PAID",
  "paymentMethod": "PAYPAL",
  "paypalOrderId": "PAYPAL-1762451881791-0",
  "paypalTransactionId": "TXN-1762451881791-0",
  "paidAmount": "249000.00",
  "paidCurrency": "USD",
  "paidAt": "2025-11-04T17:58:01.791Z",
  
  "items": [
    {
      "sku": "TEE-WHITE-001",
      "quantity": 1,
      "productId": "1",
      "unitPrice": "249000.00",
      "totalPrice": "249000.00",
      "productName": "Basic White T-Shirt",
      "productSlug": "basic-white-tshirt",
      "variantId": "variant-123",
      "variantName": "White - Large",
      "productThumbnailUrl": "https://res.cloudinary.com/example/image/upload/w_300,h_300,c_fill/q_auto/f_auto/product-image.jpg"
    }
  ],
  
  "summary": {
    "tax": "24900.00",
    "total": "323900.00",
    "currency": "VND",
    "discount": "0.00",
    "shipping": "50000.00",
    "subtotal": "249000.00"
  },
  
  "shippingAddressId": "e058edac-42d8-4553-856a-ba7baaab6f07",
  "billingAddressId": "e058edac-42d8-4553-856a-ba7baaab6f07",
  "notes": "Please deliver in the morning",
  "internalNotes": null,
  "trackingNumber": null,
  "carrier": null,
  "shippedAt": null,
  "deliveredAt": null,
  "createdAt": "2025-11-04T17:58:01.791Z",
  "updatedAt": "2025-11-06T10:58:01.790Z",
  
  "user": {
    "id": "be51a8c8-0d30-46fe-82af-a1f53b46de06",
    "email": "buy@gmail.com",
    "firstName": "GKIM TEST",
    "lastName": "Thiện 1",
    "country": "Vietnam",
    "phoneNumber": "+84 826426888"
  },
  
  "shippingAddress": {
    "id": "e058edac-42d8-4553-856a-ba7baaab6f07",
    "recipientName": "GKIM TEST Thiện 1",
    "recipientPhone": "+84 826426888",
    "label": "Home",
    "province": "Ho Chi Minh City",
    "district": "District 1",
    "ward": "Ben Nghe Ward",
    "streetLine1": "123 Nguyen Hue Street",
    "streetLine2": "Apartment 4B",
    "postalCode": "700000",
    "note": "Please ring the doorbell"
  },
  
  "billingAddress": {
    "id": "e058edac-42d8-4553-856a-ba7baaab6f07",
    "recipientName": "GKIM TEST Thiện 1",
    "recipientPhone": "+84 826426888",
    "label": "Home",
    "province": "Ho Chi Minh City",
    "district": "District 1",
    "ward": "Ben Nghe Ward",
    "streetLine1": "123 Nguyen Hue Street",
    "streetLine2": "Apartment 4B",
    "postalCode": "700000",
    "note": "Please ring the doorbell"
  }
}
```

#### Response Codes

| Code | Description                    |
| ---- | ------------------------------ |
| 200  | Order retrieved successfully    |
| 401  | Unauthorized - Invalid token   |
| 404  | Order not found                |
| 500  | Internal server error          |

#### Error Response

```json
{
  "statusCode": 404,
  "message": "Order with ID 2313cdd6-e689-45da-947c-18c414a44dcf not found",
  "error": "Not Found"
}
```

---

## Response Structure

### Order Status Values

| Status                | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `PENDING_PAYMENT`     | Waiting for the customer to finish checkout/payment                |
| `PAID`                | Funds captured successfully                                        |
| `PROCESSING`          | Backoffice is building the order, creating bill, validating stock  |
| `PACKED`              | Items packed and sealed                                            |
| `READY_TO_GO`         | Packed order staged in internal warehouse, awaiting carrier handoff|
| `AT_CARRIER_FACILITY` | Package received by the first carrier hub                          |
| `IN_TRANSIT`          | Package is moving between carrier hubs/countries                   |
| `ARRIVED_IN_COUNTRY`  | Package reached the destination country                            |
| `AT_LOCAL_FACILITY`   | Package at the final-mile warehouse near the customer              |
| `OUT_FOR_DELIVERY`    | Local courier is on the way to the customer                        |
| `DELIVERED`           | Package delivered successfully                                     |

> `CANCELLED`, `FAILED`, and `REFUNDED` are still available for exceptional payment flows but they are outside of the standard fulfillment pipeline above.

### Payment Method Values

| Method  | Description              |
| ------- | ------------------------ |
| `PAYPAL` | PayPal payment           |
| `STRIPE` | Stripe/Card payment     |
| `COD`    | Cash on Delivery         |

### Order Item Structure

Each item in the `items` array contains:

| Field              | Type   | Description                                    |
| ------------------ | ------ | ---------------------------------------------- |
| `productId`        | string | Product UUID                                   |
| `productName`      | string | Product name                                   |
| `productSlug`      | string | Product slug for URL                           |
| `productThumbnailUrl` | string | Product thumbnail image URL (optional)     |
| `variantId`        | string | Variant UUID (if applicable)                   |
| `variantName`      | string | Variant name (e.g., "Red - Large")            |
| `quantity`         | number | Quantity ordered                               |
| `unitPrice`        | string | Unit price (formatted with 2 decimals)         |
| `totalPrice`       | string | Total price for this item (formatted)          |
| `sku`              | string | SKU code (optional)                            |

### Order Summary Structure

| Field      | Type   | Description                          |
| ---------- | ------ | ------------------------------------ |
| `subtotal` | string | Subtotal before tax/shipping         |
| `shipping` | string | Shipping cost                        |
| `tax`      | string | Tax amount                           |
| `discount` | string | Discount amount                      |
| `total`    | string | Total amount                         |
| `currency` | string | Currency code (USD, VND, etc.)       |

### Address Structure

| Field           | Type   | Description                    |
| -------------- | ------ | ------------------------------ |
| `id`           | string | Address UUID                   |
| `recipientName` | string | Recipient full name            |
| `recipientPhone` | string | Recipient phone number         |
| `label`        | string | Address label (Home, Office)   |
| `province`     | string | Province/State                 |
| `district`     | string | District                       |
| `ward`         | string | Ward/Neighborhood              |
| `streetLine1`  | string | Primary street address          |
| `streetLine2`  | string | Secondary address (optional)    |
| `postalCode`   | string | Postal/ZIP code                |
| `note`         | string | Delivery notes (optional)      |

---

## Frontend Requirements

### 1. Header Section

**Display:**
- **Order Number**: `order.orderNumber` (e.g., "ORD-20251105-0001")
- **Order Status**: Badge with status color coding
  - `PENDING_PAYMENT`: Amber
  - `PAID`: Navy
  - `PROCESSING`: Purple
  - `PACKED`: Teal
  - `READY_TO_GO`: Indigo
  - `AT_CARRIER_FACILITY`: Cyan
  - `IN_TRANSIT`: Royal blue
  - `ARRIVED_IN_COUNTRY`: Lime
  - `AT_LOCAL_FACILITY`: Light green
  - `OUT_FOR_DELIVERY`: Orange
  - `DELIVERED`: Green
  - `CANCELLED` / `FAILED`: Red
  - `REFUNDED`: Gray
- **Payment Method**: Display `order.paymentMethod` (PAYPAL, STRIPE, COD)
- **Payment Status**:
  - If `order.paidAt` exists → Display: "Paid at: {formatted date}"
  - If `order.paidAt` is null → Display badge "Unpaid" + Button "Mark as Paid" (Admin only)

### 2. Customer Information Card

**Display:**
- **Full Name**: `user.firstName + " " + user.lastName`
- **Email**: `user.email`
- **Phone**: `user.phoneNumber`
- **Country**: `user.country`

**Actions:**
- Button: **"View User Profile"** → Navigate to `/admin/users/:userId`
- Button: **"Blacklist Customer"** → Open confirmation modal (Admin only)

**Fallback:**
- If `shippingAddress` is null but `notes` contains address info → Parse and display formatted address from `notes`

### 3. Order Items Table

**Table Columns:**

| Column       | Data Source                    | Notes                                    |
| ------------ | ------------------------------ | ---------------------------------------- |
| Product      | `item.productName`             | Link to `/products/:productSlug`         |
| Variant      | `item.variantName`             | Display if exists, else "-"              |
| Unit Price   | `item.unitPrice`               | Format: `{currency} {amount}`            |
| Quantity     | `item.quantity`                | Number display                           |
| Total Price  | `item.totalPrice`              | Format: `{currency} {amount}`           |

**Features:**
- Product name is clickable → Navigate to product detail page
- Display product thumbnail if `item.productThumbnailUrl` exists
- Hover effect on rows
- Responsive: Stack columns on mobile

**Example Table:**

```
| Product              | Variant      | Unit Price | Qty | Total Price |
| -------------------- | ------------ | ---------- | --- | ----------- |
| Basic White T-Shirt | White - Large| $249.00    | 1   | $249.00     |
| [Thumbnail Image]    |              |            |     |             |
```

### 4. Order Summary Card

**Display Format:**

```
┌─────────────────────────────┐
│ Order Summary               │
├─────────────────────────────┤
│ Subtotal:    $249.00        │
│ Shipping:    $50.00         │
│ Discount:    $0.00          │
│ Tax:         $24.90         │
│ ─────────────────────────── │
│ Total:       $323.90 VND   │
└─────────────────────────────┘
```

**Data Source:**
- `summary.subtotal`
- `summary.shipping`
- `summary.discount`
- `summary.tax`
- `summary.total` + `summary.currency`

### 5. Shipping & Billing Information

**If `shippingAddress` exists:**

Display formatted address:

```
Recipient Name: {shippingAddress.recipientName}
Phone: {shippingAddress.recipientPhone}
Address: {shippingAddress.streetLine1}
         {shippingAddress.streetLine2}
         {shippingAddress.ward}, {shippingAddress.district}
         {shippingAddress.province}, {shippingAddress.country}
Postal Code: {shippingAddress.postalCode}
Note: {shippingAddress.note}
```

**If `shippingAddress` is null:**

Parse from `notes` field (if contains "Shipping Address:" prefix):

```
Shipping Address: {name}, {phone}, {address}, {city}, {district}, {ward}
```

→ Frontend should parse this string and display in formatted layout.

**Actions:**
- Button: **"Edit Address"** (Admin only) → Open edit modal
- Button: **"Copy Full Address"** → Copy formatted address to clipboard

**Billing Address:**
- Display same format as shipping address
- If `billingAddress` is null, show message: "Same as shipping address"

### 6. Payment Details

**Display:**

```
Payment Method: {order.paymentMethod}
Paid Amount: {order.paidAmount} {order.paidCurrency}
PayPal Order ID: {order.paypalOrderId || "N/A"}
PayPal Transaction ID: {order.paypalTransactionId || "N/A"}
```

**If `order.paidAt` is null:**

- Badge: **"Unpaid"** (Red)
- Button: **"Send Payment Reminder"** → Trigger email to customer

### 7. Shipping Status & Tracking

**Display Timeline:**

```
Order Created → Paid → Shipped → Out for Delivery → Delivered
     ✓            ✓        ✓            ⏳              ⏳
```

**Status Indicators:**
- ✓ = Completed
- ⏳ = Pending
- ✗ = Failed/Cancelled

**Tracking Information:**

```
Carrier: {order.carrier || "Not set"}
Tracking Number: {order.trackingNumber || "Not set"}
Shipped At: {order.shippedAt || "Not shipped"}
Delivered At: {order.deliveredAt || "Not delivered"}
```

**Actions:**
- Button: **"Update Tracking"** (Admin only) → Open modal to update carrier + tracking number
- Button: **"Mark as Delivered"** (Admin only) → Confirm and update status

### 8. Internal Notes (Admin Only)

**Display:**
- Textarea input bound to `order.internalNotes`
- Auto-save on blur or manual "Save" button
- Character counter (optional)

---

## UI Layout Suggestions

### Desktop Layout (2-Column)

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Order # | Status Badge | Payment Method | Actions   │
├──────────────────────────┬──────────────────────────────────┤
│ LEFT COLUMN              │ RIGHT COLUMN                     │
│                          │                                  │
│ ┌──────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ Order Items Table    │ │ │ Order Summary Card           │ │
│ │                      │ │ │                              │ │
│ │ [Items list]         │ │ │ Subtotal: $249.00            │ │
│ │                      │ │ │ Shipping: $50.00            │ │
│ │                      │ │ │ Tax: $24.90                  │ │
│ │                      │ │ │ Total: $323.90              │ │
│ └──────────────────────┘ │ └──────────────────────────────┘ │
│                          │                                  │
│ ┌──────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ Customer Information │ │ │ Payment Details               │ │
│ │                      │ │ │                              │ │
│ │ Name: John Doe       │ │ │ Method: PayPal               │ │
│ │ Email: john@...      │ │ │ Paid: $249.00 USD           │ │
│ │ Phone: +84...        │ │ │                              │ │
│ │ [View Profile]       │ │ └──────────────────────────────┘ │
│ └──────────────────────┘ │                                  │
│                          │ ┌──────────────────────────────┐ │
│ ┌──────────────────────┐ │ │ Shipping Status & Tracking   │ │
│ │ Shipping Address     │ │ │                              │ │
│ │                      │ │ │ [Timeline visualization]     │ │
│ │ 123 Main St...       │ │ │ Carrier: DHL                │ │
│ │ [Edit] [Copy]        │ │ │ Tracking: 1Z999AA...         │ │
│ └──────────────────────┘ │ │ [Update Tracking]             │ │
│                          │ └──────────────────────────────┘ │
│ ┌──────────────────────┐ │                                  │
│ │ Billing Address      │ │ ┌──────────────────────────────┐ │
│ │ (Same as shipping)   │ │ │ Internal Notes (Admin)      │ │
│ └──────────────────────┘ │ │ [Textarea]                    │ │
│                          │ └──────────────────────────────┘ │
└──────────────────────────┴──────────────────────────────────┘
```

### Mobile Layout (Stacked)

- Header (full width)
- Order Items Table (full width, scrollable)
- Order Summary Card (full width)
- Customer Information (full width)
- Shipping Address (full width)
- Billing Address (full width)
- Payment Details (full width)
- Shipping Status (full width)
- Internal Notes (full width)

---

## Update APIs

### PATCH Update Order Status

#### Endpoint

```
PATCH /orders/:orderId/status
```

#### Headers

| Key           | Value                   |
| ------------- | ----------------------- |
| Authorization | `Bearer <access_token>` |
| Content-Type   | `application/json`      |

#### Request Body

```json
{
  "status": "READY_TO_GO"
}
```

#### Valid Status Transitions

| Current Status         | Valid Next Statuses                                              |
| ---------------------- | ---------------------------------------------------------------- |
| `PENDING_PAYMENT`      | `PAID`, `CANCELLED`, `FAILED`                                    |
| `PAID`                 | `PROCESSING`, `CANCELLED`, `REFUNDED`                            |
| `PROCESSING`           | `PACKED`, `CANCELLED`                                            |
| `PACKED`               | `READY_TO_GO`                                                    |
| `READY_TO_GO`          | `AT_CARRIER_FACILITY`                                            |
| `AT_CARRIER_FACILITY`  | `IN_TRANSIT`                                                     |
| `IN_TRANSIT`           | `ARRIVED_IN_COUNTRY`                                             |
| `ARRIVED_IN_COUNTRY`   | `AT_LOCAL_FACILITY`                                              |
| `AT_LOCAL_FACILITY`    | `OUT_FOR_DELIVERY`                                               |
| `OUT_FOR_DELIVERY`     | `DELIVERED`                                                      |
| `DELIVERED`            | `REFUNDED`                                                       |
| `FAILED`               | `PENDING_PAYMENT`                                                |
| `CANCELLED` / `REFUNDED` | (no further transitions)                                      |

#### Response (200)

```json
{
  "id": "2313cdd6-e689-45da-947c-18c414a44dcf",
  "orderNumber": "ORD-20251105-0001",
  "status": "READY_TO_GO",
  "updatedAt": "2025-11-06T12:00:00.000Z"
}
```

---

### PATCH Update Tracking Information

#### Endpoint

```
PATCH /orders/:orderId/tracking
```

#### Request Body

```json
{
  "trackingNumber": "1Z999AA1234567890",
  "carrier": "DHL",
  "shippedAt": "2025-11-06T10:00:00.000Z"
}
```

#### Response (200)

```json
{
  "id": "2313cdd6-e689-45da-947c-18c414a44dcf",
  "orderNumber": "ORD-20251105-0001",
  "trackingNumber": "1Z999AA1234567890",
  "carrier": "DHL",
  "shippedAt": "2025-11-06T10:00:00.000Z",
  "status": "READY_TO_GO",
  "updatedAt": "2025-11-06T12:00:00.000Z"
}
```

---

### PATCH Update Internal Notes

#### Endpoint

```
PATCH /orders/:orderId/notes/internal
```

#### Request Body

```json
{
  "internalNotes": "Customer requested expedited shipping. Handle with care."
}
```

#### Response (200)

```json
{
  "id": "2313cdd6-e689-45da-947c-18c414a44dcf",
  "orderNumber": "ORD-20251105-0001",
  "internalNotes": "Customer requested expedited shipping. Handle with care.",
  "updatedAt": "2025-11-06T12:00:00.000Z"
}
```

---

### PATCH Mark as Paid

#### Endpoint

```
PATCH /orders/:orderId/payment
```

#### Request Body

```json
{
  "paidAmount": "249000.00",
  "paidCurrency": "USD",
  "paidAt": "2025-11-06T12:00:00.000Z"
}
```

#### Response (200)

```json
{
  "id": "2313cdd6-e689-45da-947c-18c414a44dcf",
  "orderNumber": "ORD-20251105-0001",
  "status": "PAID",
  "paidAmount": "249000.00",
  "paidCurrency": "USD",
  "paidAt": "2025-11-06T12:00:00.000Z",
  "updatedAt": "2025-11-06T12:00:00.000Z"
}
```

---

## Notes for Frontend Implementation

### Date Formatting

- Display dates in user's local timezone
- Format: `MMM DD, YYYY HH:mm` (e.g., "Nov 06, 2025 10:00")
- Use relative time for recent dates (e.g., "2 hours ago")

### Currency Formatting

- Format numbers with thousand separators
- Example: `249000.00` → `249,000.00 VND`
- Use currency symbol based on `currency` field

### Error Handling

- Handle 401 (Unauthorized) → Redirect to login
- Handle 404 (Not Found) → Show "Order not found" message
- Handle 500 (Server Error) → Show generic error message with retry button

### Loading States

- Show skeleton loader while fetching order data
- Disable action buttons during API calls
- Show success/error toast notifications

### Permissions

- Check user role before showing admin-only actions
- Hide "Internal Notes" section for non-admin users
- Disable "Mark as Paid" for non-admin users

---

## Example Frontend Code Snippets

### React/TypeScript Example

```typescript
interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  items: OrderItem[];
  summary: OrderSummary;
  user: User;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  // ... other fields
}

// Fetch order detail
const fetchOrderDetail = async (orderId: string) => {
  const response = await fetch(`/api/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  return response.json();
};

// Update order status
const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  return response.json();
};
```

---

## Changelog

- **2025-11-08**: Initial documentation created
- Includes full API specification, frontend requirements, and UI layout suggestions

---

## Support

For questions or issues, please contact the development team or refer to the main API documentation.

