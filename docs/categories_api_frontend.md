## Categories API for Frontend Rendering

This document describes the exact API contract the frontend should use to render the navigation menu, collections, and filters for categories. The focus is on stable response shapes, minimal payloads, and predictable ordering.

---

### 1) Endpoint: Category Tree (navigation)

- Method: GET
- Path: `/categories/tree`
- Query params:
  - `active` (optional): `true` | `false` — when `true`, only active categories are returned. Default is all.

Example request
```
GET /categories/tree?active=true
```

Response shape
```json
[
  {
    "id": 2,
    "name": "Bras",
    "slug": "bras",
    "children": [
      { "id": 6, "name": "Bralettes", "slug": "bralettes" },
      { "id": 3, "name": "Push-Up Bras", "slug": "push-up-bras" },
      { "id": 7, "name": "Sports Bras", "slug": "sports-bras" },
      { "id": 5, "name": "Strapless Bras", "slug": "strapless-bras" },
      { "id": 4, "name": "Wireless Bras", "slug": "wireless-bras" }
    ]
  },
  {
    "id": 8,
    "name": "Panties",
    "slug": "panties",
    "children": [
      { "id": 10, "name": "Cheeky Panties", "slug": "cheeky-panties" },
      { "id": 11, "name": "Boyshort Panties", "slug": "boyshort-panties" },
      { "id": 12, "name": "Brazilian Panties", "slug": "brazilian-panties" },
      { "id": 9, "name": "Thong Panties", "slug": "thong-panties" }
    ]
  }
]
```

Notes
- Root categories are items with no parent.
- Children are already filtered by `active` (if `active=true`) and sorted by `display_order` ascending.
- Only necessary fields are returned for rendering: `id`, `name`, `slug`, and `children`.

TypeScript types (frontend)
```ts
export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  children: Array<{ id: number; name: string; slug: string }>;
};
```

Minimal React rendering example
```tsx
function CategoryNav({ nodes }: { nodes: CategoryNode[] }) {
  return (
    <nav>
      {nodes.map((parent) => (
        <div key={parent.id} className="menu-group">
          <h3 className="font-semibold">{parent.name}</h3>
          <ul className="ml-4 mt-1 space-y-1 text-sm">
            {parent.children.map((child) => (
              <li key={child.id}>
                <Link href={`/categories/${child.slug}`} className="hover:underline">
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

---

### 2) Endpoint: Flat List (admin-friendly, can be used for client filters)

- Method: GET
- Path: `/categories`
- Query params:
  - `with_children_count` (optional): `true` | `false` — include `children_count` in each item.
  - `page`, `limit` (optional): basic pagination hints.

Example request
```
GET /categories?with_children_count=true
```

Response shape
```json
{
  "success": true,
  "message": "Fetched categories successfully",
  "data": [
    {
      "id": 2,
      "name": "Bras",
      "slug": "bras",
      "parent": null,
      "parent_name": "Root Category",
      "display_order": 1,
      "status": "Active",
      "children_count": 5,
      "created_at": "2025-10-29T11:42:37.211Z",
      "created_at_display": "2025-10-29 18:42"
    }
  ],
  "meta": { "total": 18, "page": 1, "limit": 20 }
}
```

TypeScript types (frontend)
```ts
export type CategoryAdminItem = {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  parent_name: string;
  display_order: number;
  status: 'Active' | 'Inactive';
  children_count?: number;
  created_at?: string;
  created_at_display?: string;
};

export type CategoryListResponse = {
  success: boolean;
  message: string;
  data: CategoryAdminItem[];
  meta: { total: number; page: number; limit: number };
};
```

---

### 3) Caching and UX recommendations

- Cache `/categories/tree` for ~5 minutes on the client (SWR/React Query) or via edge cache.
- Use `display_order` for deterministic sorting on both levels.
- Slugs are unique; prefer routing by `slug` instead of `id`.
- For collection pages, hydrate filters from `/categories/tree` to avoid extra requests.

---

### 4) Error handling

- Tree endpoint returns an array; empty array means no categories or all filtered out.
- Flat list endpoint returns `{ success, message, data, meta }`; check `success` before using `data`.

---

### 5) Quick integration checklist

- [ ] Call `/categories/tree?active=true` on app load to build the nav.
- [ ] Persist the result in a client cache for faster navigation.
- [ ] Use `slug` in links: `/categories/{slug}`.
- [ ] Respect `display_order` when rendering.



Dưới đây là requirement chi tiết (chuẩn format cho dev team) để cập nhật chức năng upload sản phẩm và danh mục (categories) nhằm chuyển sang sử dụng UUID thay cho ID tự tăng.

⸻

🧩 Requirement: Update Product & Category Module to Use UUID

🎯 Mục tiêu
	•	Đồng bộ hoá hệ thống định danh giữa frontend, backend, và database bằng UUID thay cho ID số tự tăng (auto-increment).
	•	Đảm bảo việc tạo, cập nhật, và liên kết (product.category_id) hoạt động chính xác khi chuyển sang UUID.

⸻

⚙️ Phạm vi (Scope)

Áp dụng cho các module:
	•	Products
	•	Categories
	•	Các bảng quan hệ liên quan (e.g. ProductVariant, ProductImage, ProductTag…)

⸻

🧱 1️⃣ Database Layer Update

A. Products Table

Trường	Kiểu cũ	Kiểu mới	Ghi chú
id	INT (auto increment)	UUID (Primary key)	Sinh tự động tại DB hoặc từ BE
category_id	INT (FK)	UUID (FK)	Tham chiếu categories.id

Migration example (PostgreSQL):

ALTER TABLE products
  ALTER COLUMN id TYPE uuid USING (uuid_generate_v4()),
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN category_id TYPE uuid USING category_id::uuid;

ALTER TABLE products
  DROP CONSTRAINT products_pkey,
  ADD PRIMARY KEY (id);


⸻

B. Categories Table

Trường	Kiểu cũ	Kiểu mới	Ghi chú
id	INT	UUID	Primary key
parent_id	INT (nullable)	UUID (nullable)	Giữ cấu trúc phân cấp

Migration example:

ALTER TABLE categories
  ALTER COLUMN id TYPE uuid USING (uuid_generate_v4()),
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN parent_id TYPE uuid USING parent_id::uuid;

ALTER TABLE categories
  DROP CONSTRAINT categories_pkey,
  ADD PRIMARY KEY (id);

🔹 Cần cài extension UUID nếu chưa có:

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


⸻

🧩 2️⃣ Backend Layer Update (NestJS)

A. Entity Updates

// src/modules/products/entities/product.entity.ts
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'uuid', nullable: true })
  category_id: string;
}

// src/modules/categories/entities/category.entity.ts
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id?: string;
}


⸻

B. DTO Update (Validation)
	•	Các field id, category_id, parent_id → chuyển sang kiểu string
	•	Thêm validation UUID:

import { IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  category_id: string;
}


⸻

🧩 3️⃣ Frontend Update (React / Next.js)

A. Payload Changes

FE khi upload sản phẩm mới:
	•	Gửi category_id dạng UUID string (không phải số).
	•	Các API GET/POST/PATCH/DELETE phải xử lý ID là chuỗi UUID.

Ví dụ cũ (int):

{
  "name": "T-shirt",
  "category_id": 5
}

Mới (uuid):

{
  "name": "T-shirt",
  "category_id": "b4b2b07f-6825-402b-bd2c-f9aef8cfbba5"
}

B. Dropdown Categories
	•	Khi load list từ /categories, backend trả về:

[
  {
    "id": "b4b2b07f-6825-402b-bd2c-f9aef8cfbba5",
    "name": "Sports Bras"
  }
]

→ FE phải map value bằng id (string UUID).

<Select
  value={categoryId}
  onChange={(v) => setCategoryId(v)}
  options={categories.map(c => ({ label: c.name, value: c.id }))}
/>


⸻

🧩 4️⃣ API Spec Updates

Hành động	Endpoint	Loại ID
Tạo sản phẩm	POST /products	UUID tự sinh (BE generate)
Cập nhật sản phẩm	PATCH /products/:id	UUID trong path
Xoá sản phẩm	DELETE /products/:id	UUID
Tạo category	POST /categories	UUID tự sinh
Lấy category	GET /categories/:id	UUID
Lấy list	GET /categories	UUID list


⸻

🔐 5️⃣ Validation & Compatibility Notes

Hạng mục	Trước	Sau
Kiểu dữ liệu id	number	string
Kiểu dữ liệu trong payload FE	int	UUID string
Foreign key (category_id, parent_id)	int	uuid
Hiển thị trong UI	không đổi	không đổi
Auto-increment logic	yes	no (uuid_generate_v4)
Sort / pagination	vẫn hoạt động bình thường	giữ nguyên

⸻

🚀 7️⃣ Migration Strategy (Deployment Order)
	1.	DB migration – chuyển schema ID sang UUID.
	2.	Backend update – update entity, DTO, và service.
	3.	FE update – refactor API payload + dropdown value.
	4.	Data migration – convert ID hiện tại sang UUID (nếu cần giữ data cũ).
	5.	Testing + deploy staging → production.

⸻

Author: ChatGPT – System Migration Draft
Date: 2025-10-31
Version: v1.0
Module: Products / Categories – UUID Migration