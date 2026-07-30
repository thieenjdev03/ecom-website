# PROMPT — Implement Brands CRUD (admin) + gán Brand vào Product

> Repo: **`ecom-client`** (admin, Next.js 14 App Router + Minimals/MUI, SWR + axios).
> Tài liệu API: `ecom-website/docs/brands_api_docs.md` (đọc trước khi làm).
> Nguyên tắc: **sao chép nguyên mẫu module `distributor`** đã có sẵn, đổi tên sang `brand`.
> Giữ field **snake_case** đúng như API. Không tự đổi tên field ở FE.

---

## Mục tiêu

1. Trang admin CRUD Thương hiệu (Brands): danh sách + tạo + sửa + xoá.
2. Trong form tạo/sửa **Product**, thêm ô chọn Brand (bind `brand_id`, cho phép “Không có”).
3. (Tuỳ chọn) Bộ lọc Product theo brand ở trang danh sách sản phẩm.

---

## Bối cảnh API (tóm tắt — chi tiết xem brands_api_docs.md)

- Base path **`/brands`** (KHÁC distributor/policy dùng `/admin/...`).
- Envelope toàn cục `{ data, message, success }` → unwrap 1 lớp: `data?.data ?? data`.
- `GET /brands` trả **mảng thuần** `BrandDto[]` (KHÔNG phân trang), sort sẵn theo `display_order`.
- `POST /brands`, `PATCH /brands/:id`, `DELETE /brands/:id` cần Bearer admin. DELETE trả 204.
- `GET /brands/:id` để lấy chi tiết cho trang edit.
- `BrandDto`: `id, name, slug, logo_url|null, description|null, display_order, is_active, created_at, updated_at`.
- Product: `CreateProductDto`/`UpdateProductDto` nhận `brand_id?: string | null`; response product có `brand: { id, name, slug, logo_url } | null`; list filter `?brand_id=`.

---

## BƯỚC 1 — Endpoints

`src/utils/axios.ts` → thêm vào object `endpoints` (lưu ý trỏ `/brands`, không phải `/admin/brands`):

```ts
brand: {
  list: `${apiUrl}/brands`,
  details: (id: string) => `${apiUrl}/brands/${id}`,
  create: `${apiUrl}/brands`,
  update: (id: string) => `${apiUrl}/brands/${id}`,
  delete: (id: string) => `${apiUrl}/brands/${id}`,
},
```

## BƯỚC 2 — Types

Tạo `src/types/brand.ts`:

```ts
export type IBrandRef = { id: string; name: string; slug: string; logo_url: string | null };

export type IBrandItem = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Body cho POST/PATCH — khớp CreateBrandDto/UpdateBrandDto
export type BrandPayload = {
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
};

export type IBrandTableFilters = {
  q: string;
  status: "all" | "active" | "inactive";
};
```

## BƯỚC 3 — API hooks

Tạo `src/api/brand.ts` (mẫu theo `src/api/distributor.ts`, nhưng **list là mảng thuần**):

```ts
import useSWR from "swr";
import { useMemo } from "react";
import axios, { fetcher, endpoints } from "src/utils/axios";
import { IBrandItem, BrandPayload } from "src/types/brand";

// GET /brands → envelope bọc mảng: res.data.data = IBrandItem[]
function unwrapArray(data: any): IBrandItem[] {
  const payload = data?.data ?? data;
  return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
}
function unwrapItem(data: any): IBrandItem | undefined {
  return data?.data ?? data;
}

export function useGetBrands(params?: { active?: boolean }) {
  const query = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== ""),
  );
  const URL = [endpoints.brand.list, { params: query }];
  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  return useMemo(() => {
    const brands = unwrapArray(data);
    return {
      brands,
      brandsLoading: isLoading,
      brandsError: error,
      brandsValidating: isValidating,
      brandsEmpty: !isLoading && brands.length === 0,
      mutateBrands: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);
}

export function useGetBrand(id?: string) {
  const URL = id ? endpoints.brand.details(id) : "";
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);
  return useMemo(
    () => ({
      brand: unwrapItem(data),
      brandLoading: isLoading,
      brandError: error,
      brandValidating: isValidating,
    }),
    [data, error, isLoading, isValidating],
  );
}

export const brandsApi = {
  create: async (payload: BrandPayload) => (await axios.post(endpoints.brand.create, payload)).data,
  update: async (id: string, payload: Partial<BrandPayload>) =>
    (await axios.patch(endpoints.brand.update(id), payload)).data,
  remove: async (id: string) => (await axios.delete(endpoints.brand.delete(id))).data,
};
```

## BƯỚC 4 — Sections (UI)

Tạo `src/sections/brand/` sao theo `src/sections/distributor/`:

- `brand-new-edit-form.tsx` — RHF + zod (`@hookform/resolvers`), field:
  - `name` (TextField, required)
  - `slug` (TextField, required) — auto-slug từ `name` (dùng `paramCase`/`kebabCase` như các form khác); vẫn cho sửa tay.
  - `logo_url` (RHFUpload / Upload ảnh) — dùng `POST /files/upload` field `file`.
    **KHÔNG tự set `Content-Type` khi post FormData** (tránh lỗi `Multipart: Boundary not found`); để axios tự set kèm boundary. Lấy `res.data.data.url` gán vào `logo_url`.
  - `description` (RHFTextField multiline, optional)
  - `display_order` (RHFTextField type number, default 0)
  - `is_active` (RHFSwitch, default true)
  - Submit: `brandsApi.create` / `brandsApi.update`. Bắt lỗi **409** (slug trùng) → hiện message vào field `slug`. Sau khi xong: `enqueueSnackbar`, `router.push(paths.dashboard.brand.list)`, `mutateBrands()`.
- `brand-table-row.tsx` — cột: logo (Avatar `logo_url`), name, slug, display_order, is_active (Label), created_at, menu (Edit/Delete).
- `brand-table-toolbar.tsx` — ô search `q` + select status (all/active/inactive). **Lọc client-side** trên mảng trả về (vì `GET /brands` không nhận `q`; chỉ nhận `active`).
- `view/brand-list-view.tsx` — bảng dùng `useTable`, `useGetBrands`, `TableHeadCustom`. Lọc `q`/`status` bằng `applyFilter` client-side. Nút “New brand” → `paths.dashboard.brand.new`. Confirm dialog gọi `brandsApi.remove` rồi `mutateBrands`.
- `view/brand-create-view.tsx`, `view/brand-edit-view.tsx` (edit dùng `useGetBrand(id)`), `view/index.ts`.

## BƯỚC 5 — Pages (App Router)

Tạo, mirror `src/app/dashboard/distributor/*`:

- `src/app/dashboard/brand/list/page.tsx` → `<BrandListView />`
- `src/app/dashboard/brand/new/page.tsx` → `<BrandCreateView />`
- `src/app/dashboard/brand/[id]/edit/page.tsx` → `<BrandEditView id={params.id} />`

## BƯỚC 6 — Routes & Nav

`src/routes/paths.ts` → thêm trong `paths.dashboard`:

```ts
brand: {
  root: `${ROOTS.DASHBOARD}/brand/list`,
  list: `${ROOTS.DASHBOARD}/brand/list`,
  new: `${ROOTS.DASHBOARD}/brand/new`,
  edit: (id: string) => `${ROOTS.DASHBOARD}/brand/${id}/edit`,
},
```

`src/layouts/dashboard/config-navigation.tsx` → thêm 1 nav item “Brands / Thương hiệu” (đặt cạnh Products), `path: paths.dashboard.brand.list`, chọn icon phù hợp (vd `ic_label` / `ic_tag`).

---

## BƯỚC 7 — Gán Brand vào Product form

File: `src/sections/product/product-new-edit-form.tsx`.

1. Import `useGetBrands` từ `src/api/brand`.
2. Thêm `brand_id` vào default values + zod schema:
   ```ts
   brand_id: currentProduct?.brand?.id ?? null,   // defaultValues
   // schema:
   brand_id: zod.string().uuid().nullable().optional(),
   ```
   > Product response trả `brand` là object tóm tắt → lấy `currentProduct.brand?.id` để prefill.
3. Trong phần chọn “Category” (đã có sẵn `RHFAutocomplete`/`RHFSelect` category), thêm ô Brand tương tự:
   ```tsx
   const { brands } = useGetBrands({ active: true });
   // ...
   <RHFAutocomplete
     name="brand_id"
     label="Thương hiệu"
     options={brands.map((b) => b.id)}
     getOptionLabel={(id) => brands.find((b) => b.id === id)?.name ?? ""}
     isOptionEqualToValue={(o, v) => o === v}
     // cho phép để trống = null (không brand)
   />
   ```
   (Hoặc dùng `RHFSelect` với 1 option “— Không có —” value `""` rồi map `"" → null` khi submit.)
4. Khi submit:
   - Tạo: đưa `brand_id` vào payload nếu có (bỏ nếu null cũng được).
   - Sửa: gửi `brand_id: <id|null>`. Gửi `null` để gỡ brand; **không** gửi key nếu không muốn đổi.

> Backend đã validate: `brand_id` không tồn tại → 400 `Brand with ID "..." not found`. Bắt lỗi và hiện snackbar.

---

## BƯỚC 8 (tuỳ chọn) — Lọc Product theo brand

Trong `src/sections/product/product-table-toolbar.tsx` + list view: thêm select Brand (từ `useGetBrands`), truyền `brand_id` vào params của hook lấy product (`GET /products?brand_id=`). Backend đã hỗ trợ filter này.

---

## Acceptance checklist

- [ ] `/dashboard/brand/list` hiển thị danh sách brand (logo, tên, slug, order, trạng thái).
- [ ] Tạo brand mới → xuất hiện trong list; slug trùng báo lỗi rõ (409).
- [ ] Sửa brand (kể cả bật/tắt `is_active`) hoạt động; upload logo OK (không lỗi boundary).
- [ ] Xoá brand (soft-delete) → biến mất khỏi list.
- [ ] Product form: chọn được Brand, lưu xong reload thấy brand đã gán; chọn “Không có” gỡ được brand.
- [ ] (Nếu làm bước 8) Lọc product theo brand trả đúng kết quả.
- [ ] Không có chỗ nào tự set `Content-Type: multipart/form-data` thủ công.
```
