Dưới đây là bản tóm tắt ngắn – rõ – đúng logic hệ thống, dành để bạn update status cho backend + frontend (đặt enum, mapping UI, logic xử lý).
Không lan man, chỉ lấy các status chính cần implement.

⸻

🔧 Order Status Summary (For Backend & Frontend Integration)

Danh sách status chuẩn
	1.	pending_payment
	•	Chờ khách hoàn tất thanh toán.
	2.	paid
	•	Đã nhận tiền thành công.
	3.	processing
	•	Lên đơn, tạo bill, kiểm tra tồn kho.
	4.	packed
	•	Đã đóng gói hoàn chỉnh, sẵn sàng xuất kho.
	5.	ready_to_go
	•	Đang ở kho nội bộ, chờ bàn giao đơn vị vận chuyển.
	6.	at_carrier_facility
	•	Đã vào kho của đơn vị vận chuyển (first carrier warehouse).
	7.	in_transit
	•	Đang vận chuyển giữa các kho / giữa quốc gia.
	8.	arrived_in_country
	•	Đã đến quốc gia nhận hàng.
	9.	at_local_facility
	•	Đang ở kho giao hàng cuối (gần địa chỉ khách).
	10.	out_for_delivery

	•	Shipper địa phương đang giao đến khách.

	11.	delivered

	•	Đã giao hàng thành công.

⸻

🧩 Mapping logic (flow)

pending_payment 
→ paid 
→ processing 
→ packed 
→ ready_to_go 
→ at_carrier_facility 
→ in_transit 
→ arrived_in_country 
→ at_local_facility 
→ out_for_delivery 
→ delivered


⸻

💡 Gợi ý implement cho BE/FE
	•	Backend (Enum)
Dùng lowercase snake_case:

PENDING_PAYMENT
PAID
PROCESSING
PACKED
READY_TO_GO
AT_CARRIER_FACILITY
IN_TRANSIT
ARRIVED_IN_COUNTRY
AT_LOCAL_FACILITY
OUT_FOR_DELIVERY
DELIVERED


	•	Frontend (UI)
Dùng text clear cho khách:

Pending payment
Paid
Processing
Packed
Ready to go
At carrier facility
In transit
Arrived in country
At local facility
Out for delivery
Delivered



⸻

Nếu bạn muốn mình tạo thêm:
	•	file .ts enum cho NestJS
	•	file constant cho frontend React
	•	bảng mapping status → màu sắc UI → icon
	•	API flow và webhook handling

Chỉ cần nói từ nào bạn đang dùng (NestJS, React, NextJS…).