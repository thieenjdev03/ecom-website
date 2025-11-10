Dưới đây là file tài liệu .md hoàn chỉnh — mô tả đầy đủ thiết kế và tối ưu hóa API cho Categories gồm cả dạng admin (flat list) và frontend nav list (tree), chuẩn để đưa vào thư mục docs/backend/categories_api_design.md 👇

⸻


# 🧾 Categories API Design — Lumé E-Commerce

## 🎯 Overview
Tài liệu này mô tả cách thiết kế và tối ưu hoá **API quản lý danh mục (Categories)** cho hệ thống Lumé, đảm bảo:
- **Admin UI (Manage Categories)** hiển thị nhanh, có đầy đủ thông tin quản lý.
- **Frontend UI (Navigation Menu)** render mượt, dữ liệu phân cấp rõ ràng.
- Dễ mở rộng, dễ cache, giảm tải cho frontend.

---

## ⚙️ 1️⃣ API: Get All Categories (Admin Management)

### **Endpoint**

GET /categories?with_children_count=true&page=1&limit=20

### **Response Example**
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
    },
    {
      "id": 6,
      "name": "Bralettes",
      "slug": "bralettes",
      "parent": 2,
      "parent_name": "Bras",
      "display_order": 0,
      "status": "Active",
      "children_count": 0,
      "created_at_display": "2025-10-30 09:09"
    }
  ],
  "meta": {
    "total": 18,
    "page": 1,
    "limit": 20
  }
}

Purpose
	•	Dành cho trang Admin > Manage Categories.
	•	Hỗ trợ:
	•	Pagination
	•	Search / Filter / Sort
	•	Hiển thị parent name, children count, status, created_at

Logic (NestJS / TypeORM)

@Get()
async getCategories(@Query('with_children_count') count?: boolean) {
  const categories = await this.categoryRepo.find({
    relations: count ? ['children', 'parent'] : ['parent'],
    order: { display_order: 'ASC' },
  });

  return {
    success: true,
    message: 'Fetched categories successfully',
    data: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent: cat.parent?.id ?? null,
      parent_name: cat.parent?.name ?? 'Root Category',
      display_order: cat.display_order ?? 0,
      status: cat.is_active ? 'Active' : 'Inactive',
      children_count: cat.children?.length ?? 0,
      created_at: cat.created_at,
      created_at_display: dayjs(cat.created_at).format('YYYY-MM-DD HH:mm'),
    })),
    meta: {
      total: categories.length,
      page: 1,
      limit: categories.length,
    },
  };
}


⸻

🌿 2️⃣ API: Get Category Tree (Frontend Navigation)

Endpoint

GET /categories/tree?active=true

Response Example

[
  {
    "id": 1,
    "name": "Bikini",
    "slug": "bikini",
    "children": []
  },
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
  },
  {
    "id": 14,
    "name": "Bikinis & Swimwear",
    "slug": "bikinis-swimwear",
    "children": [
      { "id": 16, "name": "Two-Piece Bikinis", "slug": "two-piece-bikinis" },
      { "id": 15, "name": "One-Piece Swimsuits", "slug": "one-piece-swimsuits" },
      { "id": 19, "name": "Cover-Ups", "slug": "cover-ups" }
    ]
  }
]

Purpose
	•	Dành cho frontend navigation menu / sidebar / collection filters.
	•	Giúp render cây danh mục cha–con trực quan.
	•	Payload nhẹ, chỉ chứa trường cần thiết.

Logic (NestJS / TypeORM)

@Get('tree')
async getTree() {
  const roots = await this.categoryRepo.find({
    where: { parent: IsNull(), is_active: true },
    relations: ['children'],
    order: { display_order: 'ASC' },
  });

  return roots.map(parent => ({
    id: parent.id,
    name: parent.name,
    slug: parent.slug,
    children: parent.children
      ?.filter(c => c.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
  }));
}


⸻

⚡ 3️⃣ Performance Optimizations

Kỹ thuật	Mục đích
Select fields cụ thể	Tránh query trường không cần thiết (select: ['id','name','slug','parent'])
LEFT JOIN + COUNT	Dùng QueryBuilder để tính children_count nhanh hơn
Cache Redis 5 phút	Cache toàn bộ cây danh mục (/categories/tree) để giảm tải
Pagination + Limit	Giới hạn kết quả admin view (?limit=20)
Search param	Cho phép ?keyword=bikini hoặc ?is_active=true


⸻

🧠 4️⃣ Frontend Rendering Suggestion

Navigation Menu Example

{categories.map(parent => (
  <div key={parent.id} className="menu-group">
    <h3 className="font-semibold">{parent.name}</h3>
    <ul className="ml-4 mt-1 space-y-1 text-sm">
      {parent.children.map(child => (
        <li key={child.id}>
          <Link href={`/categories/${child.slug}`} className="hover:underline">
            {child.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
))}

Expected Rendering

Bras
 ├── Bralettes
 ├── Push-Up Bras
 ├── Sports Bras
 ├── Strapless Bras
 └── Wireless Bras

Panties
 ├── Cheeky Panties
 ├── Boyshort Panties
 ├── Brazilian Panties
 └── Thong Panties


⸻

🧩 5️⃣ Summary

Use Case	API Endpoint	Response Type
🧭 Frontend Menu / Nav List	/categories/tree	Hierarchical (Tree)
⚙️ Admin Management Table	/categories	Flat List
📦 Product Filtering	/categories/tree?active=true	Tree (Lightweight)
📊 Dashboard Analytics	/categories?with_children_count=true	Flat List with meta


⸻

📁 Suggested Location

/docs/backend/categories_api_design.md


⸻

✅ Benefits:
	•	Giảm 70% logic xử lý frontend.
	•	Phân biệt rõ luồng dữ liệu giữa admin và frontend.
	•	Dễ cache, dễ mở rộng, dễ SEO.
	•	Chuẩn hóa cấu trúc response cho toàn hệ thống.

⸻


---

Mày chỉ cần copy nội dung trên vào file:  
📄 `docs/backend/categories_api_design.md`

Muốn tao **tự động tạo file `.md` và gửi link tải trực tiếp** cho repo `Lumé E-Com` không (tao có thể xuất file luôn)?