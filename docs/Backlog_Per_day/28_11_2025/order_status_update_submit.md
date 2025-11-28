## Order Admin – Edit & Status Update Guide

### 1. Scope
- Applies to the internal admin UI + NestJS `/orders/:id` PATCH endpoint.
- Covers two operations: editing order metadata (notes, tracking info, addresses, payment fields) and progressing order status through the new fulfillment steps.

### 2. Endpoint Recap
- `PATCH /orders/:id`
  - Auth: JWT + `ADMIN` role.
  - Body supports any subset of editable fields.
  - Validation errors return `400` with message.
- For status-only UX, reuse same endpoint but post `{ "status": "<NEXT_STATUS>" }`.

### 3. Allowed Status Flow
```
pending_payment → paid → processing → packed → ready_to_go
→ at_carrier_facility → in_transit → arrived_in_country
→ at_local_facility → out_for_delivery → delivered
```
Exceptional overrides:
- `pending_payment` → `cancelled`
- `paid` → `cancelled | refunded`
- `processing` → `cancelled`
- `failed` → `pending_payment`
- `delivered` → `refunded`

### 4. Request Payload Cheat Sheet
| Field | Type | Notes |
| --- | --- | --- |
| `status` | enum `OrderStatus` | Must be the next sequential status or one of the override statuses above. |
| `trackingNumber` | string | Optional; recommend to require once order hits `READY_TO_GO`. |
| `carrier` | string | Optional; pair with tracking. |
| `internalNotes` | string | Free text for backoffice. |
| `paypalTransactionId` / `paidAmount` / `paidCurrency` / `paidAt` | strings | Usually set automatically, but PATCH accepts overrides for manual reconciliations. |
| `shippingAddressId`, `billingAddressId` | UUID | Only switch to addresses that belong to the same user. |
| `paypalOrderId` | string | Needed if re-linking PayPal records. |

### 5. FE Form Behavior
1. **Edit Drawer**
   - Display editable inputs grouped: `Status`, `Shipping`, `Billing`, `Tracking`, `Payment`, `Notes`.
   - Disable save button until at least one field changes.
2. **Status Selector**
   - Source options from API `GET /orders/:id` response -> compute allowed transitions client-side with order status map above, or call helper endpoint (future).
   - Show tooltip describing next step meaning (copy from `order_api.md`).
3. **Submit Handling**
   - Send `PATCH /orders/:id` with changed fields only.
   - After success, refetch order detail to refresh timeline.
4. **Error Surfacing**
   - `400` message contains friendly text such as `Invalid status transition from "PAID" to "IN_TRANSIT"`. Display inline toast.

### 6. Sample Requests
```http
PATCH /orders/d8d3f9b2-0c7e-4d52-9af9-16660d32a922
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "READY_TO_GO",
  "trackingNumber": "1Z999AA1234567890",
  "carrier": "UPS",
  "internalNotes": "Packed at HCM warehouse – awaiting pickup"
}
```

```http
PATCH /orders/d8d3f9b2-0c7e-4d52-9af9-16660d32a922
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "CANCELLED",
  "internalNotes": "Customer requested cancellation before fulfillment"
}
```

### 7. Response Snippet
```json
{
  "id": "d8d3f9b2-0c7e-4d52-9af9-16660d32a922",
  "orderNumber": "ORD-20251127-0042",
  "status": "READY_TO_GO",
  "trackingNumber": "1Z999AA1234567890",
  "carrier": "UPS",
  "updatedAt": "2025-11-28T09:45:10.312Z"
}
```

### 8. Admin Checklist Before Advancing Status
1. Confirm payment state (PayPal capture logged, refund processed, etc.).
2. Verify inventory + packaging done (for move to `PACKED`).
3. Ensure tracking data is recorded when leaving internal warehouse.
4. For override transitions (cancel/refund), log reason in `internalNotes`.

### 9. QA Steps
- Attempt invalid jump (e.g., `PAID` → `AT_CARRIER_FACILITY`): expect 400.
- Try sequential progression end-to-end to confirm statuses appear in chronological order.
- Ensure webhook-driven updates (PayPal) can still move `PENDING_PAYMENT` → `PAID` without admin UI.

### 10. Deliverables for Submission
- Screenshots or Loom showing:
  - Editing modal with status dropdown.
  - Successful PATCH request in devtools/network panel.
  - Order timeline reflecting new status.
- Brief text summary referencing this doc + list of tested transitions.


