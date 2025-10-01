OK, dưới đây là requirement chuẩn để dùng UUID (định danh duy nhất toàn cục – không lộ số lượng bản ghi) cho users và toàn bộ bảng khác trong hệ thống e-commerce (NestJS + TypeORM + PostgreSQL).

Requirement: Chuẩn hoá ID = UUID cho toàn hệ thống

🎯 Mục tiêu
	•	Tất cả khóa chính (PK – primary key) dùng UUID v4.
	•	Tất cả khóa ngoại (FK – foreign key) tham chiếu tới PK UUID.
	•	Không dùng auto-increment (serial/bigint) cho các bảng nghiệp vụ.

⸻

1) Chuẩn DB (PostgreSQL)

1.1 Bật hàm sinh UUID
	•	Ưu tiên: pgcrypto.gen_random_uuid() (builtin từ PG13) – nhanh, không cần cài thêm.
	•	Fallback: uuid-ossp.uuid_generate_v4() nếu dự án đã dùng.

Migration (khuyến nghị dùng pgcrypto):

-- 001_enable_uuid.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Nếu dự án cũ đang dùng uuid-ossp:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


⸻

2) Chuẩn TypeORM (Entity + Migration)

2.1 Khai báo cột PK = UUID

@PrimaryGeneratedColumn('uuid')
id: string;

2.2 FK trỏ tới UUID

@Column('uuid')
userId: string;

@ManyToOne(() => User)
@JoinColumn({ name: 'userId' })
user: User;

2.3 Default server-side (an toàn, không phụ thuộc app)

Nếu tạo ID ở DB thay vì app:

@Column({
  type: 'uuid',
  primary: true,
  default: () => 'gen_random_uuid()' // nếu dùng pgcrypto
  // default: () => 'uuid_generate_v4()' // nếu dùng uuid-ossp
})
id: string;

Chọn một cách nhất quán: sinh ở DB (default) hoặc sinh ở app (service). Không trộn lẫn.

⸻

3) Danh mục bảng áp dụng (ví dụ e-commerce)
	•	users, addresses
	•	products, product_options, product_option_values
	•	product_variants, product_variant_option_values
	•	product_media, product_attributes
	•	carts, cart_items
	•	orders, order_items, payments, shipments
	•	categories, brands, price_rules, coupons, v.v.

Quy ước: mọi PK là uuid, mọi FK là uuid.

⸻

4) Chuẩn thực thi (App Layer – NestJS)

4.1 Generate ID ở Service (nếu không dùng default DB)
	•	Dùng ulid/uuid lib; với yêu cầu UUID v4:

import { v4 as uuidv4 } from 'uuid';

const user = this.userRepo.create({ id: uuidv4(), email, ... });
await this.userRepo.save(user);

4.2 Validate đầu vào (DTO)
	•	Dùng @IsUUID('4') để đảm bảo đúng định dạng.

@IsUUID('4') userId: string;


⸻

5) Index & Constraint (tối ưu hiệu năng)
	•	PK mặc định đã có index.
	•	Thêm index cho FK và cột tra cứu:

@Index('idx_addresses_userId', ['userId'])
@Index('idx_products_slug', ['slug'], { unique: true })

	•	Với bảng khổng lồ: cân nhắc UUID v7 (sortable theo thời gian – sắp xếp tăng dần) nếu cần tối ưu I/O index insert (thứ tự thời gian – “append-friendly”).

⸻

6) Ảnh hưởng đến API/FE (contract)
	•	Mọi id trong path/query/body là string UUID, không phải number.
Ví dụ: GET /products/68b7ec4d-1d02-df24-e5d3-3793abcd1234
	•	FE cần validate client-side (regex UUID) để UX tốt.

⸻

7) Migration kế thừa (nếu hệ thống cũ dùng bigint)
	1.	Tạo cột mới id_uuid uuid DEFAULT gen_random_uuid().
	2.	Fill dữ liệu (UPDATE tất cả hàng).
	3.	Thêm cột FK uuid cho các bảng con, map theo khóa cũ.
	4.	Đổi FK của bảng con sang *_uuid.
	5.	Promote id_uuid thành PK, drop id cũ (hoặc giữ làm shadow).
	6.	Đổi code sang dùng UUID, triển khai theo bước (canary).

Lưu ý khóa tham chiếu, trigger, view, materialized view, job nền.

⸻

8) Bảo mật & Logging
	•	UUID không bảo mật nội dung, chỉ tránh lộ đếm record. Đừng dựa vào UUID để che dữ liệu.
	•	Log hoạt động theo entityId (uuid) + actorId (uuid) + ip/userAgent.
	•	Tuyệt đối không log JWT/secret, chỉ log ID tham chiếu.

⸻

9) Tiêu chuẩn đặt tên & kiểu cột
	•	Tên cột PK thống nhất: id (uuid).
	•	Tên FK theo {ref}Id dạng uuid: userId, productId, orderId…
	•	Kiểu cột: uuid (PostgreSQL), không dùng varchar(36).

⸻

10) Checklists cho “Cursor”/Dev Junior

DB
	•	Tạo migration bật pgcrypto.
	•	Chuẩn hoá mọi entity: @PrimaryGeneratedColumn('uuid').
	•	Tất cả FK: @Column('uuid') + @ManyToOne.
	•	Bổ sung index cho FK và cột tra cứu.
	•	Viết seed dữ liệu kiểm thử (UUID).

Code
	•	DTO: @IsUUID('4') cho tất cả ID nhận từ client.
	•	Guard/Param: ParseUUIDPipe của Nest cho route params.
	•	Service: không tự sinh ID nếu DB đã có default.
	•	Test E2E: tạo/sửa/xoá theo UUID, kiểm tra 404 khi UUID sai.

API/FE
	•	Cập nhật OpenAPI/Swagger: field id là string (uuid).
	•	FE: validate UUID; không parse sang number.

⸻

11) Mẫu Entity rút gọn (chuẩn UUID)

// users
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column() passwordHash: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

// addresses
@Entity('addresses')
@Index(['userId'])
export class Address {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column('uuid') userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column() recipientName: string;
  @Column() countryCode: string;
  @Column() province: string;
  @Column() district: string;
  @Column() streetLine1: string;
  @Column({ default: false }) isDefault: boolean;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}


⸻

12) Quy tắc mở rộng
	•	Nếu cần ID có tính sắp xếp theo thời gian: chuẩn hoá chung sang UUID v7 (thay vì v4) để tối ưu index insert và sort theo “mới → cũ”; với PG15+ có extension cộng đồng hoặc generate ở app bằng lib uuidv7.
	•	Nếu cần ID ngắn cho public URL: thêm publicId (nanoid) riêng, không thay thế PK.

⸻

Nếu bạn muốn, mình có thể tạo luôn cặp migration TypeORM mẫu:
	1.	enable_pgcrypto
	2.	create_users_addresses_uuid
và file OpenAPI schema cập nhật kiểu uuid cho toàn bộ endpoints.