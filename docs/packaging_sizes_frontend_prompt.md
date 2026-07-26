# PROMPT — Quy cách đóng gói (Packaging) qua API `sizes`

**Project:** Mingo Ice Cream
**Backend:** đã implement xong ở `ecom-website`. Tận dụng **API `sizes` có sẵn** làm "quy cách / kích cỡ đóng gói" cho kem (ví dụ: `24 cây / thùng`, `12 hộp / thùng`, `Hộp 250ml`, `Hộp 500ml`).
**Do NOT sửa backend contract** — nếu cần đổi shape, sửa Swagger decorator backend rồi chạy `npm run openapi:export` + `npm run api:gen`.

---

## 0. Ý tưởng

Không tạo bảng mới. `sizes` vốn là "kích cỡ" (S/M/L cho quần áo), nay được mở rộng để **cũng** biểu diễn quy cách đóng gói kem. Các field mới **đều nullable** nên tương thích ngược.

Mỗi `size` = 1 nhãn quy cách. Sản phẩm tham chiếu qua **product variant** (`variants[].size_id`) — mỗi variant là 1 quy cách + giá + tồn kho riêng.

---

## 1. Backend contract (đã có)

### Bảng `sizes` — field
| Field (API) | Cột DB | Kiểu | Ý nghĩa |
|---|---|---|---|
| `id` | id | uuid | |
| `name` | name | string(100) | **Nhãn hiển thị** — "24 cây / thùng", "Hộp 250ml", "M" |
| `unit` | unit | string(20) \| null | Đơn vị lẻ: `cây`, `hộp`, `lít`... |
| `packQty` | pack_qty | int \| null | Số lượng / thùng: 24, 12 |
| `volumeMl` | volume_ml | int \| null | Dung tích (ml): 250, 500 |
| `sortOrder` | sort_order | int | Thứ tự |
| `category` | categoryId | uuid \| null | Phạm vi category (tuỳ chọn) |
| `createdAt`/`updatedAt` | | date-time | |

> **Nguyên tắc hiển thị:** luôn ưu tiên `name` để render. `unit`/`packQty`/`volumeMl` là metadata có cấu trúc để (tuỳ chọn) render badge đẹp hơn, sort theo dung tích, hoặc lọc — KHÔNG bắt buộc dùng.

### Endpoints (`sizes`)
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/sizes?categoryId=` | public | — | `SizeDto[]` (order by `sortOrder`) |
| GET | `/sizes/:id` | public | — | `SizeDto` |
| POST | `/sizes` | admin | `CreateSizeDto` | `SizeDto` (201) |
| PATCH | `/sizes/:id` | admin | `UpdateSizeDto` (partial) | `SizeDto` |
| DELETE | `/sizes/:id` | admin | — | 204 |

```ts
// CreateSizeDto
{
  name: string;        // required, max 100 — nhãn hiển thị
  categoryId?: string; // optional scope
  unit?: string;       // 'cây' | 'hộp' | 'lít' ...
  packQty?: number;    // 24, 12
  volumeMl?: number;   // 250, 500
  sortOrder?: number;
}
// UpdateSizeDto = Partial<CreateSizeDto>

// SizeDto (response)
{
  id: string; name: string;
  unit: string | null; packQty: number | null; volumeMl: number | null;
  sortOrder: number;
  category?: { id: string; name: string } | null;
  createdAt: string; updatedAt: string;
}
```

### Dữ liệu mẫu đã seed
| name | unit | packQty | volumeMl | category |
|---|---|---|---|---|
| Hộp 250ml | hộp | — | 250 | Kem hộp |
| Hộp 500ml | hộp | — | 500 | Kem hộp |
| 12 hộp / thùng | hộp | 12 | — | Kem hộp |
| 24 cây / thùng | cây | 24 | — | (global) |

### Liên kết với sản phẩm
Product **variant** đã có `size_id` (và `color_id` giờ optional). Trong response sản phẩm, mỗi variant được enrich `size` = full object gồm cả `unit/packQty/volumeMl`:
```ts
// ProductVariantResponseDto.size (ProductVariantSizeDto)
{ id: string; name: string; unit?: string|null; packQty?: number|null; volumeMl?: number|null }
```

### Response envelope
Global `TransformInterceptor` bọc `{ data, message, success }`.
- Admin (`ecom-client`): unwrap 1 cấp — `res.data.data ?? res.data`.
- Storefront (`mingo-store`): `customFetch` unwrap sẵn → dùng orval hook trực tiếp.

---

## PART A — ADMIN (`ecom-client`, Minimals/MUI)

Đã có sẵn hook `useGetSizes(categoryId?)` + `createSize/updateSize/deleteSize` trong `src/api/reference.ts`. **Cập nhật** để hỗ trợ field mới.

### A1. `src/api/reference.ts`
- `createSize` / `updateSize` payload thêm optional: `unit?`, `packQty?`, `volumeMl?`, `sortOrder?`.
```ts
export async function createSize(payload: {
  name: string; categoryId?: string;
  unit?: string; packQty?: number; volumeMl?: number; sortOrder?: number;
}) { /* POST endpoints.refs.sizes */ }
```
- `useGetSizes` giữ nguyên (đã trả `data.data`), nhưng type item thành `ISize` (bên dưới).

### A2. Type — `src/types/size.ts`
```ts
export type ISize = {
  id: string; name: string;
  unit: string | null; packQty: number | null; volumeMl: number | null;
  sortOrder: number;
  category?: { id: string; name: string } | null;
};
```

### A3. Trang quản lý Sizes/Quy cách
Nếu đã có page quản lý sizes (dashboard) → thêm cột **Đơn vị** (`unit`), **SL/thùng** (`packQty`), **Dung tích (ml)** (`volumeMl`) vào bảng, và các input tương ứng trong form create/edit:
- `RHFTextField name="name"` (required) — nhãn hiển thị.
- `RHFAutocomplete/RHFSelect name="unit"` gợi ý `['cây','hộp','lít','ổ quế']`.
- `RHFTextField name="packQty" type="number"` — SL/thùng.
- `RHFTextField name="volumeMl" type="number"` — dung tích ml.
- `RHFTextField name="sortOrder" type="number"`.
- (tuỳ chọn) chọn `categoryId` để scope theo dòng SP.

Gợi ý UX: nếu admin nhập `packQty`+`unit` mà bỏ trống `name` → auto build `name = "${packQty} ${unit} / thùng"`; nếu nhập `volumeMl`+`unit` → `name = "${unit} ${volumeMl}ml"` (viết hoa chữ đầu). Vẫn cho sửa tay.

### A4. Trong form sản phẩm (product variants)
Variant picker chọn quy cách qua `size_id`:
- Load options: `useGetSizes(product.category_id)` (kèm cả global nếu backend trả — hiện `/sizes` không filter sẽ trả tất cả; có filter thì trả theo category).
- Hiển thị option label = `size.name`.
- Mỗi variant = { size_id, price, stock, (color_id optional) }.

**Acceptance (admin):** tạo/sửa size với `unit/packQty/volumeMl`; bảng hiển thị đủ cột; product variant chọn được quy cách.

---

## PART B — STOREFRONT (`mingo-store`)

### B0. Regenerate client
`npm run api:gen` → có `useSizesControllerFindAll`, `sizesControllerFindAll`, type `SizeDto`. Product detail đã có `variant.size` kèm packaging fields.

### B1. Hiển thị quy cách trên trang sản phẩm
Trên product detail / card, render nhãn quy cách của từng variant:
- **Ưu tiên `size.name`** (đã đúng định dạng: "24 cây / thùng", "Hộp 250ml").
- Nếu cần badge có cấu trúc, build từ field:
```ts
function packagingLabel(s: { name: string; unit?: string|null; packQty?: number|null; volumeMl?: number|null }) {
  if (s.volumeMl) return `${s.unit ?? 'Hộp'} ${s.volumeMl}ml`;
  if (s.packQty) return `${s.packQty} ${s.unit ?? ''}/thùng`.trim();
  return s.name;
}
```
- Chọn variant → cập nhật giá/tồn tương ứng (variant.price/stock).

### B2. (Tuỳ chọn) Lọc theo quy cách
Nếu muốn filter danh sách theo dung tích, dùng `GET /sizes?categoryId=` để build dropdown, rồi lọc sản phẩm theo variant có `size_id` tương ứng (client-side hoặc mở rộng API sau).

### B3. Ô "Chọn sản phẩm" ở store-locator
Dropdown "Chọn sản phẩm" (hiện đang disabled/cosmetic) có thể tái sử dụng `/sizes` làm nguồn quy cách nếu cần — nhưng theo spec distributor thì ô này để dành product-level, không bắt buộc.

**Acceptance (storefront):** product detail hiển thị đúng nhãn quy cách theo từng variant (24 cây/thùng, Hộp 250ml, 500ml...); đổi variant đổi giá.

---

## Global checklist
- [ ] Không tạo bảng mới — dùng `sizes` mở rộng.
- [ ] Admin CRUD size kèm `unit/packQty/volumeMl`; `name` là nhãn hiển thị chính.
- [ ] Product variant tham chiếu size_id; response enrich packaging fields.
- [ ] Storefront hiển thị nhãn quy cách theo variant.
- [ ] Không sửa tay `src/lib/api/generated`; chạy lại `api:gen` sau khi backend đổi.
```
