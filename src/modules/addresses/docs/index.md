OK 👍. Để rõ ràng cho dev backend/frontend cùng làm, em viết requirement cho API cập nhật địa chỉ của User (update Address) dưới dạng chuẩn e-commerce, để sau này cursor (automation hoặc dev junior) có thể implement dễ dàng.

⸻

📋 Requirement: Update Address for User

🎯 Mục tiêu
	•	Cho phép user cập nhật thông tin địa chỉ của mình (địa chỉ giao hàng hoặc thanh toán).
	•	Đảm bảo chỉ user sở hữu địa chỉ đó mới có quyền sửa.
	•	Cho phép cập nhật flag isDefault và handle logic “chỉ có 1 default address mỗi user”.

⸻

1. Endpoint
	•	Method: PATCH
	•	URL: /users/:userId/addresses/:addressId

⸻

2. Request

Headers
	•	Authorization: Bearer <JWT> (yêu cầu đăng nhập)

Params
	•	userId (số nguyên, id của user)
	•	addressId (số nguyên, id của address thuộc user đó)

Body (JSON, optional fields – chỉ field nào gửi thì update)

{
  "recipientName": "Nguyen Van A",
  "recipientPhone": "0912345678",
  "label": "Work",
  "countryCode": "VN",
  "province": "Hà Nội",
  "district": "Hoàn Kiếm",
  "ward": "Tràng Tiền",
  "streetLine1": "123 Phố Huế",
  "streetLine2": "Tầng 5, Tòa nhà ABC",
  "postalCode": "100000",
  "latitude": 21.028511,
  "longitude": 105.804817,
  "isShipping": true,
  "isBilling": false,
  "isDefault": true,
  "note": "Giao giờ hành chính"
}


⸻

3. Response

✅ Success (200)

{
  "id": 12,
  "userId": 5,
  "recipientName": "Nguyen Van A",
  "recipientPhone": "0912345678",
  "label": "Work",
  "countryCode": "VN",
  "province": "Hà Nội",
  "district": "Hoàn Kiếm",
  "ward": "Tràng Tiền",
  "streetLine1": "123 Phố Huế",
  "streetLine2": "Tầng 5, Tòa nhà ABC",
  "postalCode": "100000",
  "latitude": 21.028511,
  "longitude": 105.804817,
  "isShipping": true,
  "isBilling": false,
  "isDefault": true,
  "note": "Giao giờ hành chính",
  "updatedAt": "2025-09-30T08:22:11.123Z"
}

❌ Error
	•	400 Bad Request: Body không hợp lệ (VD: thiếu countryCode).
	•	401 Unauthorized: Không có JWT / JWT sai.
	•	403 Forbidden: User không sở hữu address này.
	•	404 Not Found: Không tìm thấy address.

⸻

4. Business Rules
	1.	isDefault = true:
	•	Khi update 1 address thành default, tự động unset (isDefault=false) cho các address khác của user.
	2.	Không cho phép sửa userId và addressId (chỉ update thông tin địa chỉ).
	3.	recipientPhone cần validate theo chuẩn số điện thoại VN/Quốc tế.
	4.	Tất cả field string trim() trước khi lưu.

⸻

5. Cursor Implementation Tasks
	•	Tạo DTO UpdateAddressDto (optional fields, class-validator).
	•	Viết PATCH /users/:userId/addresses/:addressId trong AddressesController.
	•	Guard: chỉ userId === req.user.id OR role === ADMIN mới được update.
	•	Service:
	•	Check address.userId === userId.
	•	Nếu isDefault = true → unset default cho các address khác.
	•	Update record với partial update (save() hoặc update()).
	•	Viết test case:
	•	Update 1 field (ex: chỉ đổi streetLine1).
	•	Update isDefault → các address khác mất default.
	•	User khác cố update → 403.

⸻

Anh có muốn em viết luôn mẫu UpdateAddressDto + Controller method + Service logic TypeORM để copy-paste vào project không?

⸻

📦 Requirement: Đồng bộ địa chỉ shipping từ frontend (Checkout flow)

🎯 Mục tiêu
	•	Frontend chỉ cần gửi payload shipping chuẩn, backend tự lưu/override default shipping address cho user và lấy id để tạo Order.
	•	Bảo đảm mỗi user luôn có tối đa 1 địa chỉ shipping default được dùng cho đơn hàng tiếp theo.
	•	Cung cấp endpoint riêng để frontend có thể sync địa chỉ trước khi gọi API tạo Order.

⸻

1. Endpoint
	•	Method: PUT
	•	URL: /users/:userId/addresses/shipping
	•	Guard: JWT + (req.user.sub === userId || role === ADMIN)

⸻

2. Request

Headers
	•	Authorization: Bearer <JWT>

Params
	•	userId (UUID v4)

Body (JSON – required fields giống lúc checkout gửi shipping_address)

{
  "full_name": "Nguyen Van A",
  "phone": "+84 912345678",
  "countryCode": "VN",
  "province": "Ho Chi Minh",
  "district": "Quan 1",
  "ward": "Ben Nghe",
  "address_line": "123 Nguyen Hue",
  "address_line2": "Apt 09",
  "city": "Ho Chi Minh City",
  "postalCode": "700000",
  "label": "Checkout - July",
  "note": "Call before arrival",
  "isBilling": false,
  "isDefault": true
}

Giải thích nhanh:
	•	countryCode: chuẩn ISO alpha-2 (VD: VN, US).
	•	province/district/ward: bắt buộc để backend map phí ship.
	•	address_line: streetLine1 trong DB, address_line2 → streetLine2.
	•	isDefault bỏ trống sẽ auto true, backend sẽ unset các default cũ.

⸻

3. Response

✅ 200 OK

{
  "id": "3a1c4cda-3ab8-4a3f-8d43-9ddbd7a3f6c5",
  "userId": "68b7ec4d-1d02-df24-e5d3-3793abcd1234",
  "recipientName": "Nguyen Van A",
  "recipientPhone": "+84 912345678",
  "countryCode": "VN",
  "province": "Ho Chi Minh",
  "district": "Quan 1",
  "ward": "Ben Nghe",
  "streetLine1": "123 Nguyen Hue",
  "streetLine2": "Apt 09",
  "postalCode": "700000",
  "label": "Checkout - July",
  "isShipping": true,
  "isBilling": false,
  "isDefault": true,
  "note": "Call before arrival",
  "updatedAt": "2025-11-28T10:12:33.456Z"
}

❌ Errors
	•	400: Thiếu các field bắt buộc (full_name, countryCode, province, district, address_line).
	•	403: userId không khớp và không phải ADMIN.

⸻

🚚 Tích hợp với Order API

Trong DTO tạo Order (POST /orders):
	•	Frontend có 2 lựa chọn:
		1.	Gửi shippingAddressId nếu đã có address trong hệ thống.
		2.	Gửi shipping_address object (đúng schema bên trên). Backend sẽ:
			•	Validate payload.
			•	Gọi AddressesService.upsertByUser() để lưu thành default shipping address.
			•	Lấy id của address vừa sync và gán vào shippingAddressId trước khi tạo Order.
	•	Không được gửi đồng thời shippingAddressId và shipping_address (backend sẽ trả 400).
	•	shipping_address thiếu countryCode/province/district sẽ bị reject.

Payload mẫu khi tạo Order bằng shipping_address:

{
  "userId": "68b7ec4d-1d02-df24-e5d3-3793abcd1234",
  "items": [...],
  "summary": {...},
  "paymentMethod": "PAYPAL",
  "shipping_address": {
    "full_name": "Nguyen Van A",
    "phone": "+84 912345678",
    "countryCode": "VN",
    "province": "Ho Chi Minh",
    "district": "Quan 1",
    "ward": "Ben Nghe",
    "address_line": "123 Nguyen Hue",
    "address_line2": "Apt 09",
    "postalCode": "700000",
    "label": "Checkout - July",
    "note": "Call before arrival",
    "isBilling": false,
    "isDefault": true
  }
}

📌 Lưu ý:
	•	Notes trong Order sẽ auto append `Shipping Address: <formatted string>` nếu dùng shipping_address raw để dễ đọc trên dashboard.
	•	Frontend không cần gọi PUT shipping trước nếu đã định gửi shipping_address chung request tạo Order, backend đã handle.
	•	Nếu frontend muốn cho user preview phí ship trước khi tạo Order, có thể gọi PUT shipping để sync và lấy id rồi dùng shippingAddressId trong order request.