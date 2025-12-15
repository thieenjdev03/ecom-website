OK, dưới đây là PLAN + DOC hoàn chỉnh để mày đưa thẳng vào project / ticket / notion / confluence và AI hoặc dev khác đọc là implement được ngay, không cần hỏi lại.

Tao viết theo style thực thi – production – không lý thuyết.

⸻

📄 Order Status Tracking History – Implementation Plan

1. Mục tiêu (Goal)

Xây dựng chức năng tracking lịch sử thay đổi trạng thái của Order, nhằm:
	•	Ghi nhận mọi lần thay đổi status
	•	Lưu thời điểm, người/thực thể thay đổi
	•	Hiển thị timeline lịch sử cho từng đơn hàng
	•	Đảm bảo audit-safe, không mất dữ liệu
	•	Không ảnh hưởng performance khi list orders

⸻

2. Phạm vi (Scope)

Bao gồm
	•	Tracking status history theo append-only
	•	Validate luồng chuyển trạng thái
	•	API đổi status & API lấy history
	•	UI hiển thị timeline (ở mức data-ready)

Không bao gồm (out of scope)
	•	Analytics / SLA reporting
	•	Notification / webhook
	•	Event-driven architecture (để mở rộng sau)

⸻

3. Quyết định kiến trúc (Architecture Decision)

✅ Chọn Option A – Array trong Order
	•	Không tạo bảng / collection mới
	•	Lưu tracking_history trực tiếp trong order
	•	Phù hợp lifecycle e-commerce hiện tại
	•	Dễ migrate sang bảng riêng nếu cần

👉 Lý do:
	•	Status change count thấp
	•	Query history theo từng order
	•	Không cần query cross-order

⸻

4. Data Model

4.1 Order Status Enum

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  PACKED = 'PACKED',
  READY_TO_GO = 'READY_TO_GO',
  AT_CARRIER_FACILITY = 'AT_CARRIER_FACILITY',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_IN_COUNTRY = 'ARRIVED_IN_COUNTRY',
  AT_LOCAL_FACILITY = 'AT_LOCAL_FACILITY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}


⸻

4.2 Order Schema (relevant fields)

{
  "id": "order_123",
  "status": "PROCESSING",
  "tracking_history": [
    {
      "from_status": "PAID",
      "to_status": "PROCESSING",
      "changed_at": "2025-01-01T01:00:00.000Z",
      "changed_by": "ADMIN",
      "note": null
    }
  ]
}

Tracking History Item

Field	Type	Note
from_status	OrderStatus	status trước
to_status	OrderStatus	status mới
changed_at	ISO Date	thời điểm đổi
changed_by	string	userId / SYSTEM / CRON
note	string	optional


⸻

5. Status Transition Rules

5.1 Transition Map

const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'REFUNDED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_TO_GO'],
  READY_TO_GO: ['AT_CARRIER_FACILITY'],
  AT_CARRIER_FACILITY: ['IN_TRANSIT'],
  IN_TRANSIT: ['ARRIVED_IN_COUNTRY'],
  ARRIVED_IN_COUNTRY: ['AT_LOCAL_FACILITY'],
  AT_LOCAL_FACILITY: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['PROCESSING', 'REFUNDED'],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
}

5.2 Validation Rules
	•	Không cho from_status === to_status
	•	Không cho skip flow
	•	Status cuối (DELIVERED, REFUNDED) không được đổi tiếp

⸻

6. Business Flow – Change Order Status

6.1 Flow tổng quát

1. Load order
2. Validate transition
3. Append tracking_history record
4. Update order.status
5. Save order (atomic)


⸻

6.2 Pseudocode Implementation

function changeOrderStatus(order, toStatus, actor, note?) {
  const fromStatus = order.status

  assertValidTransition(fromStatus, toStatus)

  order.tracking_history.push({
    from_status: fromStatus,
    to_status: toStatus,
    changed_at: new Date(),
    changed_by: actor,
    note: note ?? null,
  })

  order.status = toStatus
}

Quy tắc bắt buộc
	•	Không update / delete history
	•	Chỉ append
	•	order.status là source of truth cho trạng thái hiện tại

⸻

7. API Design

7.1 Change Order Status

POST /orders/:id/status

{
  "toStatus": "PACKED",
  "note": "Order packed at warehouse"
}


⸻

7.2 Get Status History

GET /orders/:id/status-history

[
  {
    "from_status": "PAID",
    "to_status": "PROCESSING",
    "changed_at": "2025-01-01T01:00:00Z",
    "changed_by": "ADMIN",
    "duration_seconds": 3600
  }
]


⸻

8. Duration Tracking

Strategy
	•	Không lưu duration trong DB
	•	Tính khi query để giảm write complexity

Logic

duration_seconds =
  next.changed_at - current.changed_at

	•	Last status → null

⸻

9. UI Timeline Requirement (Data-ready)

UI chỉ cần consume data theo thứ tự changed_at:

PAID              09:00
PROCESSING        10:00  (+1h)
PACKED            12:30  (+2h30m)
OUT_FOR_DELIVERY  18:00  (+5h30m)
DELIVERED         20:15  (+2h15m)


⸻

10. Security & Audit
	•	changed_by luôn required
	•	Actor có thể là:
	•	User ID
	•	SYSTEM
	•	CRON
	•	Không cho chỉnh sửa history qua API
	•	Role-based permission cho đổi status

⸻

11. Performance Considerations

Concern	Decision
List orders	dùng orders.status
Load history	chỉ khi view detail
JSON size	< 10KB / order
Index	index orders.status


⸻

12. Migration Strategy (Future-proof)

Nếu sau này cần tách bảng:
	1.	Iterate tracking_history
	2.	Insert từng record vào order_status_history
	3.	Giữ backward compatibility

⸻

13. Checklist hoàn thành (Definition of Done)
	•	tracking_history append đúng
	•	validate transition hoạt động
	•	API change status OK
	•	API get history OK
	•	Không overwrite history
	•	Unit test status flow
	•	UI render timeline đúng thứ tự