Tuyệt — ta chuyển toàn bộ tài liệu sang SQL + TypeORM (PostgreSQL hoặc MySQL đều ổn).
Tinh thần giữ nguyên: setup database chuẩn để sau này mày dễ làm “gửi email hàng loạt”.

Dưới đây là file .md hoàn chỉnh, dev backend (Cursor) có thể đọc và implement ngay.

⸻

📄 Email Marketing Contacts – SQL + TypeORM Implementation Spec

1. Overview

Hệ thống cần lưu email của user để phục vụ email marketing. Email có thể đến từ nhiều nguồn:
	•	User đăng ký account (có opt-in)
	•	Modal / popup đăng ký nhận tin
	•	Landing page
	•	Import từ admin

Database dùng SQL (PostgreSQL / MySQL) với TypeORM.

Tất cả email được gom vào một bảng duy nhất:

marketing_contacts

⸻

2. Requirements

2.1. Chức năng cần làm ngay
	•	Lưu email từ modal
	•	Lưu email khi user đăng ký account
	•	Upsert theo email
	•	Đánh dấu subscribed
	•	Hỗ trợ unsubscribe

2.2. Chuẩn bị tương lai
	•	Gắn tag/segment
	•	Mapping email → userId
	•	Lưu source để biết email đến từ đâu

⸻

3. SQL Schema (TypeORM Entity)

3.1. Table Name

marketing_contacts

3.2. Entity Code (TypeORM – SQL)

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('marketing_contacts')
@Unique(['email'])
export class MarketingContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'modal',
  })
  source: 'register' | 'modal' | 'checkout' | 'import';

  @Column({
    type: 'boolean',
    default: true,
  })
  subscribed: boolean;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  unsubscribedAt: Date | null;

  @Column({
    type: 'jsonb', // JSON cho Postgres, chuyển sang "simple-json" nếu dùng MySQL
    nullable: true,
    default: () => "'[]'",
  })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

Lưu ý database
	•	jsonb → dùng cho PostgreSQL
	•	Nếu dùng MySQL: đổi sang simple-json

⸻

4. API Requirements

4.1. API: Subscribe qua modal

POST /marketing/subscribe

Request

{
  "email": "example@gmail.com",
  "source": "modal"
}

Logic (Upsert theo email)

Pseudo-logic:

const existing = await repo.findOne({ where: { email } });

if (!existing) {
  // tạo mới
  return repo.save({
    email,
    subscribed: true,
    source,
    tags: [],
  });
}

// update lại nếu unsubscribe hoặc thay đổi source
return repo.save({
  ...existing,
  subscribed: true,
  unsubscribedAt: null,
  source,
});


⸻

4.2. API: Lưu email khi user đăng ký account

Backend gọi logic này sau khi user tạo tài khoản.

Request input:

{
  email: string,
  userId: string,
  marketingOptIn: boolean
}

Logic

const existing = await repo.findOne({ where: { email } });

if (!existing) {
  return repo.save({
    email,
    userId,
    subscribed: marketingOptIn,
    source: 'register',
  });
}

return repo.save({
  ...existing,
  userId,
  subscribed: marketingOptIn,
  source: 'register',
});


⸻

4.3. API: Unsubscribe

GET /marketing/unsubscribe?email=abc@gmail.com&token=secureToken

Logic

await repo.update(
  { email },
  {
    subscribed: false,
    unsubscribedAt: new Date(),
  }
);

Token validation backend tự thực hiện.

⸻

5. Indexing (SQL)

PostgreSQL

CREATE UNIQUE INDEX idx_marketing_contacts_email  
ON marketing_contacts (email);

CREATE INDEX idx_marketing_contacts_subscribed  
ON marketing_contacts (subscribed);

CREATE INDEX idx_marketing_contacts_source  
ON marketing_contacts (source);

MySQL

Tương tự, nhưng jsonb → dùng JSON hoặc TEXT.

⸻

6. Folder Structure (NestJS)

src/
  marketing/
    marketing.module.ts
    marketing.controller.ts
    marketing.service.ts
    marketing-contact.entity.ts
    dto/
      subscribe.dto.ts
      unsubscribe.dto.ts


⸻

7. Example Record (SQL)

{
  "id": "f7b1fc77-40a1-4f16-afc2-8d91ac2fa12b",
  "email": "example@gmail.com",
  "userId": null,
  "source": "modal",
  "tags": ["black_friday", "landingpage"],
  "subscribed": true,
  "unsubscribedAt": null,
  "createdAt": "2025-11-27T10:10:00.000Z",
  "updatedAt": "2025-11-27T10:10:00.000Z"
}


⸻

8. Backend Deliverables
	•	Entity marketing_contacts
	•	Migration file (nếu dùng TypeORM migration)
	•	Service xử lý upsert
	•	API:
	•	POST /marketing/subscribe
	•	Hook khi user đăng ký
	•	GET /marketing/unsubscribe
	•	Validate email format (class-validator)
	•	Index Database
	•	Error handling + response format