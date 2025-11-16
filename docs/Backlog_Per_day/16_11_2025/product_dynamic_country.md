Ok Master, mình viết cho bạn document chuẩn chỉnh để backend migrate từ single-language → multi-language dynamic cho sản phẩm.
Format theo kiểu bạn có thể quăng cho team BE FE đọc là hiểu liền — gọn, sạch, dễ implement, không vòng vo.

⸻

📘 PRODUCT MULTI-LANGUAGE MIGRATION DOCUMENT

(Chuyển schema sản phẩm hiện tại → hỗ trợ đa ngôn ngữ EN–VI–… dynamic)

⸻

1️⃣ MỤC TIÊU
	•	Cho phép lưu trữ nhiều ngôn ngữ cho product (EN/VI hoặc mở rộng bất kỳ).
	•	Backend trả về đúng ngôn ngữ FE yêu cầu qua ?locale=.
	•	Giữ nguyên các field không thuộc ngôn ngữ (price, images, variants…).
	•	Không duplicate record.
	•	Fallback nếu thiếu bản dịch.

⸻

2️⃣ HIỆN TRẠNG (❌ Single Language)

Hiện tại các field sau chỉ chứa 1 ngôn ngữ:

name
slug
description
short_description
meta_title
meta_description
category.name
category.slug
variant.name
color.name
size.name

Vì thế BE/FEs không thể phục vụ nhiều ngôn ngữ dynamic.

⸻

3️⃣ DỮ LIỆU MỚI (✔ Dynamic Multi-Language)

3.1. Các field text được chuyển thành object dạng:

{
  en: "...",
  vi: "..."
}

3.2. Schema mới cho product:

{
  "id": "uuid",
  "name": { "en": "", "vi": "" },
  "slug": { "en": "", "vi": "" },
  "description": { "en": "", "vi": "" },
  "short_description": { "en": "", "vi": "" },

  "meta_title": { "en": null, "vi": null },
  "meta_description": { "en": null, "vi": null },

  "price": "990.00",
  "sale_price": "500.00",
  "images": [...],
  "variants": [ ... ],

  "category": {
    "id": "",
    "name": { "en": "", "vi": "" },
    "slug": { "en": "", "vi": "" }
  }
}

3.3. Schema mới cho variants (nếu variant có tên):

{
  "sku": "Test_PL1",
  "name": { "en": "", "vi": "" },
  "color": {
    "id": "",
    "name": { "en": "", "vi": "" },
    "hexCode": ""
  },
  "size": {
    "id": "",
    "name": { "en": "", "vi": "" }
  }
}


⸻

4️⃣ API CONTRACT MỚI

4.1. Query product (FE sẽ gửi locale)

GET /products/:id?locale=vi

BE trả về:

→ Chỉ trả 1 ngôn ngữ duy nhất, không trả toàn bộ object đa ngôn ngữ.

Ví dụ:

{
  "id": "952edbfd-f1aa-4833-9703-48fbde8ac930",
  "name": "Unreachable for Kit Testing (VI)",
  "slug": "khong-the-test-kit",
  "description": "<p>Nội dung tiếng Việt...</p>",
  "short_description": "Mô tả ngắn tiếng Việt",
  "price": "990.00",
  "sale_price": "500.00",
  "images": [...],
  "variants": [...],
  "category": {
    "id": "...",
    "name": "Strapless Bras (VI)",
    "slug": "ao-lot-khong-day"
  }
}


⸻

5️⃣ FALLBACK LOGIC (QUAN TRỌNG)

Nếu FE yêu cầu locale=vi, nhưng product không có bản dịch tiếng Việt:

→ fallback về tiếng Anh.

Pseudo-code:

function getLocalizedValue(field, locale) {
  return field?.[locale] ?? field?.["en"] ?? "";
}


⸻

6️⃣ API CREATE / UPDATE PRODUCT (DỮ LIỆU GỬI LÊN)

FE gửi lên đa ngôn ngữ đầy đủ:

{
  "name": {
    "en": "Unreachable for Kit Testing",
    "vi": "Không thể test Kit"
  },
  "slug": {
    "en": "unreachable-for-kit-testing",
    "vi": "khong-the-test-kit"
  },
  "description": {
    "en": "<p>Unreachable for Kit Testing</p>",
    "vi": "<p>Không thể test bộ Kit</p>"
  },
  "short_description": {
    "en": "Unreachable for Kit Testing",
    "vi": "Không thể test Kit"
  },

  "price": "990.00",
  "sale_price": "500.00",

  "variants": [
    {
      "sku": "Test_PL1",
      "name": { "en": "Test #PL1", "vi": "Mẫu #PL1" },
      "color": {
        "name": { "en": "Orange", "vi": "Cam" },
        "hexCode": "#FFD6A7"
      },
      "size": {
        "name": { "en": "Medium", "vi": "M" }
      }
    }
  ]
}


⸻

7️⃣ MIGRATION PLAN

7.1. Tạo migration script:

Rule: lấy giá trị cũ → map vào English.

name = { en: nameOld, vi: "" }

Áp dụng cho các field:
	•	name
	•	slug
	•	description
	•	short_description
	•	meta_title
	•	meta_description
	•	category.name
	•	category.slug
	•	variant.name
	•	color.name
	•	size.name

7.2. Khi seller update lại → BE cho phép override tất cả các lang.

⸻

8️⃣ RESPONSE FORMAT GIỮ NGUYÊN (KHÔNG PHÁ API CŨ)

Nếu FE không truyền locale
→ trả mặc định tiếng Anh:

GET /products/123
→ locale = "en"


⸻

9️⃣ TẶNG BONUS – TYPE SCRIPT INTERFACE CHUẨN

type LangObject = Record<string, string | null>;

interface Product {
  id: string;
  name: LangObject;
  slug: LangObject;
  description: LangObject;
  short_description: LangObject;

  meta_title: LangObject | null;
  meta_description: LangObject | null;

  price: number;
  sale_price: number;

  images: string[];
  variants: Variant[];
  category: Category;
}


⸻

🏁 KẾT LUẬN

Backend sẽ migrate từ:

name: "Unreachable..."

→ thành

name: { en: "Unreachable...", vi: "" }

API đọc:
→ chỉ trả text theo ?locale=.

UI admin:
→ upload song ngữ.