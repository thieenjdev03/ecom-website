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