Dưới đây là tài liệu mô tả lỗi + yêu cầu fix cho backend — viết theo chuẩn mô tả issue trong Jira/GitLab/Notion task cho team backend (dễ hiểu, dễ implement, rõ nguyên nhân & cách xác minh sau khi fix).
Tao viết gọn gàng đúng style task Dev.

⸻


# 🐛 Bug Report — API `/categories/tree` trả sai cấu trúc danh mục (duplicated roots)

## 🧩 Mô tả lỗi
Endpoint `/categories/tree` hiện tại **trả dư và sai cấu trúc phân cấp**.  
Cụ thể, các **category con (child)** đang bị đẩy lên **root level** cùng với các category cha.

### 🔍 Ví dụ response lỗi:
```json
[
  {
    "id": 7,
    "name": "Sports Bras",
    "slug": "sports-bras",
    "children": []
  },
  {
    "id": 2,
    "name": "Bras",
    "slug": "bras",
    "children": [
      { "id": 7, "name": "Sports Bras", "slug": "sports-bras" }
    ]
  }
]

➡️ Sports Bras xuất hiện 2 lần:
	•	Một lần ở root (sai)
	•	Một lần trong children của Bras (đúng)

❗Ảnh hưởng
	•	Frontend menu hiển thị sai cấu trúc (category con nằm lẫn với cha).
	•	UI render thừa dữ liệu → gây lỗi hiển thị danh mục lặp lại, đặc biệt trong nav list hoặc filter tree.
	•	SEO & sitemap có thể bị ảnh hưởng (URL bị lặp).

⸻

🧠 Nguyên nhân khả dĩ

Trong backend, API hiện tại đang:

const categories = await categoryRepo.find({ relations: ['children'] });
return categories.map(cat => ({ ...cat }));

→ Đang map toàn bộ bảng categories, không giới hạn chỉ lấy các danh mục cha (parent_id IS NULL).
Vì vậy mọi danh mục đều được trả về ở root level, dù chúng có parent_id.

⸻

✅ Yêu cầu fix

🎯 Mục tiêu

Chỉnh sửa logic ở API /categories/tree để:
	•	Chỉ trả về các danh mục cha (root categories) ở cấp 1.
	•	Danh mục con phải nằm trong trường children[] của cha tương ứng.
	•	Không lặp category con ở root level.
	•	Dữ liệu trả về chỉ gồm các field cần thiết: id, name, slug, children.

⸻

⚙️ Đề xuất hướng xử lý

Option 1 — Sửa truy vấn TypeORM (2 cấp)

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

Option 2 — Recursive tree builder (đa tầng)

Nếu hệ thống có thể có 3–4 tầng danh mục, nên dùng hàm đệ quy:

async buildTree(parentId: number | null = null) {
  const nodes = await this.categoryRepo.find({
    where: { parent: parentId, is_active: true },
    order: { display_order: 'ASC' },
  });

  return Promise.all(nodes.map(async (node) => ({
    id: node.id,
    name: node.name,
    slug: node.slug,
    children: await this.buildTree(node.id),
  })));
}

@Get('tree')
async getTree() {
  return this.buildTree(null);
}


⸻

🧪 Cách kiểm tra sau khi fix

✅ Expected response:

[
  {
    "id": 2,
    "name": "Bras",
    "slug": "bras",
    "children": [
      { "id": 3, "name": "Push-Up Bras", "slug": "push-up-bras" },
      { "id": 4, "name": "Wireless Bras", "slug": "wireless-bras" },
      { "id": 5, "name": "Strapless Bras", "slug": "strapless-bras" },
      { "id": 6, "name": "Bralettes", "slug": "bralettes" },
      { "id": 7, "name": "Sports Bras", "slug": "sports-bras" }
    ]
  },
  {
    "id": 8,
    "name": "Panties",
    "slug": "panties",
    "children": [
      { "id": 9, "name": "Thong Panties", "slug": "thong-panties" },
      { "id": 10, "name": "Cheeky Panties", "slug": "cheeky-panties" },
      { "id": 11, "name": "Boyshort Panties", "slug": "boyshort-panties" },
      { "id": 12, "name": "Brazilian Panties", "slug": "brazilian-panties" },
      { "id": 13, "name": "Bikini Panties", "slug": "bikini-panties" }
    ]
  },
  {
    "id": 14,
    "name": "Bikinis & Swimwear",
    "slug": "bikinis-swimwear",
    "children": [
      { "id": 15, "name": "One-Piece Swimsuits", "slug": "one-piece-swimsuits" },
      { "id": 16, "name": "Two-Piece Bikinis", "slug": "two-piece-bikinis" },
      { "id": 17, "name": "Bikini Tops", "slug": "bikini-tops" },
      { "id": 18, "name": "Bikini Bottoms", "slug": "bikini-bottoms" },
      { "id": 19, "name": "Cover-Ups", "slug": "cover-ups" }
    ]
  }
]

✅ Không còn các child ở root
✅ Cấu trúc phân cấp đúng
✅ Không lặp danh mục
✅ Hiển thị chính xác cho menu Categories ở frontend

⸻

📌 Acceptance Criteria
	•	API /categories/tree chỉ trả root categories (parent_id = null)
	•	Các danh mục con nằm trong children[] đúng với parent_id
	•	Không xuất hiện trùng danh mục giữa root và child
	•	Payload chỉ gồm các field: id, name, slug, children
	•	Đã được test thực tế ở frontend nav list (render đúng cấu trúc)

