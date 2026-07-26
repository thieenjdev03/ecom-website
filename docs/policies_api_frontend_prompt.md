# PROMPT — "Chính sách và hỗ trợ" (Policies) CRUD

**Project:** Mingo Ice Cream
**Backend:** đã implement xong ở `ecom-website` (NestJS + PostgreSQL). File này là prompt hoàn chỉnh để implement **Admin CRUD** (`ecom-client`, Next.js 14 + Minimals/MUI) và **Storefront** (`mingo-store`, Next.js 15 + Tailwind).
**Do NOT change the backend contract** — nếu cần đổi shape, sửa Swagger decorator ở backend rồi chạy lại `npm run openapi:export` + `npm run api:gen`.

---

## 0. Bối cảnh & mục tiêu

Trang public `Chính sách và hỗ trợ` (xem screenshot):
- **Cột trái**: danh sách các "mục chính" (title). Mục đang chọn tô cam.
- **Cột phải**: tiêu đề + **nội dung HTML** của mục đang chọn.

Admin cần 1 page để **CRUD** các mục này. Mỗi mục gồm: `id`, **tên mục chính** (`title`), **nội dung HTML** (`content`), cộng metadata sắp xếp/ẩn hiện.

---

## 1. Backend contract (đã có — chỉ tiêu thụ, KHÔNG sửa)

### Data model — bảng `policies`
| Field | Type | Note |
|---|---|---|
| `id` | uuid | PK |
| `title` | string(255) | **Tên mục chính** — required |
| `slug` | string(280) | unique, tự sinh từ `title` nếu bỏ trống |
| `content` | text | **HTML** — sanitized server-side |
| `display_order` | int | sắp xếp sidebar, mặc định 0 |
| `is_active` | boolean | ẩn/hiện ngoài storefront, mặc định true |
| `created_at` / `updated_at` | date-time | |
| `deleted_at` | date-time \| null | soft delete |

### Endpoints

**Admin (yêu cầu Bearer JWT + role `admin`):**
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/admin/policies` | `CreatePolicyDto` | `PolicyDto` (201) |
| GET | `/admin/policies?search=&is_active=` | — | `PolicyDto[]` (ordered by `display_order` ASC) |
| GET | `/admin/policies/:id` | — | `PolicyDto` |
| PATCH | `/admin/policies/:id` | `UpdatePolicyDto` (partial) | `PolicyDto` |
| DELETE | `/admin/policies/:id` | — | 204 No Content (soft delete) |

**Public (không auth):**
| Method | Path | Response |
|---|---|---|
| GET | `/policies` | `PolicyListItemDto[]` — **active only**, lightweight (`id,title,slug,display_order,is_active`), ordered |
| GET | `/policies/:slug` | `PolicyDto` (full, kể cả `content` HTML) |

### DTOs

```ts
// CreatePolicyDto
{
  title: string;          // required, max 255
  slug?: string;          // optional — auto from title
  content: string;        // required, HTML (sanitized backend)
  display_order?: number; // default 0
  is_active?: boolean;    // default true
}

// UpdatePolicyDto = Partial<CreatePolicyDto>

// PolicyDto (response)
{
  id: string; title: string; slug: string; content: string;
  display_order: number; is_active: boolean;
  created_at: string; updated_at: string;
}

// PolicyListItemDto (public list — no content)
{ id: string; title: string; slug: string; display_order: number; is_active: boolean; }
```

### Response envelope
Global `TransformInterceptor` bọc mọi response: `{ data, message, success }`.
- Admin repo (`ecom-client`): axios trả `res.data`; unwrap **1 cấp** — `payload = res.data.data ?? res.data` (xem `src/api/distributor.ts` làm mẫu chuẩn).
- Storefront (`mingo-store`): `customFetch` trong `src/lib/api/fetcher.ts` đã unwrap sẵn — dùng orval hook trực tiếp.

### Sanitize HTML (backend cho phép các tag sau — dùng khi cấu hình editor)
`h1 h2 h3 h4 p ul ol li strong em u s a br hr blockquote table thead tbody tr th td img span div` + attr `a[href,target,rel]`, `img[src,alt,width,height]`, `*[style]`. Schemes: `http https mailto tel` (img thêm `data`).

---

## PART A — ADMIN CRUD (`ecom-client`, Minimals/MUI)

> Theo đúng convention module **career** (`src/sections/career/**`, `src/api/career.ts`, `src/types/career.ts`) và **distributor** — copy pattern, đổi tên.

### A1. Endpoints — `src/utils/axios.ts`
Thêm vào object `endpoints`:
```ts
policy: {
  list: `${apiUrl}/admin/policies`,
  details: (id: string) => `${apiUrl}/admin/policies/${id}`,
  create: `${apiUrl}/admin/policies`,
  update: (id: string) => `${apiUrl}/admin/policies/${id}`,
  delete: (id: string) => `${apiUrl}/admin/policies/${id}`,
},
```

### A2. Types — `src/types/policy.ts`
```ts
export type IPolicyItem = {
  id: string; title: string; slug: string; content: string;
  display_order: number; is_active: boolean;
  created_at: string; updated_at: string;
};
export type IPolicyTableFilters = { search: string; status: 'all' | 'active' | 'inactive' };
```

### A3. API layer — `src/api/policy.ts` (SWR + axios, mẫu = `career.ts`)
- `useGetPolicies(params?: { search?; is_active? })` → `{ policies, policiesLoading, policiesError, mutatePolicies }`.
  - **Unwrap:** `const list = res?.data?.data ?? res?.data; return Array.isArray(list) ? list : []`.
- `useGetPolicy(id?)` → `{ policy, policyLoading }` (unwrap 1 cấp).
- `policiesApi.create(payload)`, `.update(id, payload)`, `.remove(id)` — `PolicyPayload = { title; slug?; content; display_order?; is_active? }`.

### A4. Routes (App Router)
- `src/app/dashboard/policy/page.tsx` → `<PolicyListView />`
- `src/app/dashboard/policy/new/page.tsx` → `<PolicyCreateView />`
- `src/app/dashboard/policy/[id]/edit/page.tsx` → `<PolicyEditView id={params.id} />`

`src/routes/paths.ts` → thêm:
```ts
policy: {
  root: `${ROOTS.DASHBOARD}/policy`,
  new: `${ROOTS.DASHBOARD}/policy/new`,
  edit: (id: string) => `${ROOTS.DASHBOARD}/policy/${id}/edit`,
},
```
Nav: thêm mục vào `src/layouts/dashboard/config-navigation.tsx` (icon `ic_blog` hoặc tương tự) + key i18n `policy` trong `src/locales/langs/*.json` (en/vi/ar/cn/fr).

### A5. List view — `src/sections/policy/view/policy-list-view.tsx`
- MUI `Table*` + `TableHeadCustom` + `TablePaginationCustom` (mẫu = career-list-view).
- Cột: **Tên mục chính** (`title`), **Thứ tự** (`display_order`), **Trạng thái** (`is_active` → Label success/default), **Ngày tạo**, **Actions** (Sửa / Xoá có ConfirmDialog).
- Toolbar: ô search theo `title` + tabs trạng thái (`all` / `active` / `inactive`).
- Vì số lượng policy ít → có thể fetch full rồi phân trang client-side (như career). Server-side filter qua `search` + `is_active` optional.
- Nút "Thêm chính sách" → `paths.dashboard.policy.new`.

### A6. Create/Edit form — `src/sections/policy/policy-new-edit-form.tsx`
`react-hook-form` + `yup` (mẫu = career-new-edit-form). Fields:

| Field | Component | Rule |
|---|---|---|
| Tên mục chính | `RHFTextField name="title"` | required |
| Nội dung | `RHFEditor name="content"` | required (rich text HTML) |
| Thứ tự hiển thị | `RHFTextField name="display_order" type="number"` | optional, default 0 |
| Trạng thái | `RHFSwitch name="is_active"` | default true |
| (tuỳ chọn) Slug | `RHFTextField name="slug"` | optional — để trống backend tự sinh |

- `RHFEditor` toolbar whitelist phải khớp danh sách sanitize tag ở §1 (nếu editor xuất tag ngoài whitelist, backend sẽ strip).
- Submit → map payload snake_case:
```ts
{ title, content, display_order: Number(display_order) || 0, is_active, slug: slug || undefined }
```
- Create: `policiesApi.create(payload)`. Edit: `policiesApi.update(id, payload)`. Xong → `enqueueSnackbar` + `router.push(paths.dashboard.policy.root)`.
- Edit mode: hydrate form từ `useGetPolicy(id)`.

### A7. Views wiring
- `policy-create-view.tsx`, `policy-edit-view.tsx`, `view/index.ts` — mẫu = career.

**Acceptance (admin):** tạo/sửa/xoá round-trip; editor lưu & render HTML đúng; list filter + trạng thái hoạt động; xoá có confirm.

---

## PART B — STOREFRONT (`mingo-store`, khớp screenshot)

### B0. Regenerate client
Backend đã export spec → chạy `npm run api:gen`. Hooks sinh ra:
- `usePoliciesPublicControllerFindAll()` → `PolicyListItemDto[]` (sidebar).
- `policiesPublicControllerFindBySlug(slug)` / hook tương ứng → `PolicyDto` (content).

### B1. Trang `Chính sách và hỗ trợ`
Route gợi ý: `src/app/[locale]/policies/page.tsx` (+ `policies/[slug]/page.tsx` nếu muốn deep-link). Footer link "CHÍNH SÁCH" trỏ vào đây.

Layout 2 cột (theo screenshot):
- **Trái**: tiêu đề khối "Chính sách và hỗ trợ" (cam) + danh sách `title` từ `GET /policies`. Item active tô `text-primary`. Click → đổi mục đang chọn (client state) hoặc điều hướng `/policies/[slug]`.
- **Phải**: tiêu đề mục (cam, in đậm) + `content` render bằng `dangerouslySetInnerHTML`.

### B2. An toàn HTML
`content` đã sanitize ở backend, nhưng vẫn nên render qua 1 helper thống nhất. Nếu muốn lớp phòng thủ thứ 2, sanitize lại client (ví dụ `isomorphic-dompurify`) trước khi `dangerouslySetInnerHTML`.

### B3. i18n
Bổ sung namespace `policies` trong `messages/en.json` + `messages/vi.json` (tiêu đề khối, empty state...). Dữ liệu policy do backend cung cấp (không dịch qua i18n).

**Acceptance (storefront):** sidebar list đúng thứ tự `display_order`, chỉ hiện `is_active=true`; chọn mục → hiển thị đúng HTML; SSR/hydration không lệch.

---

## Global checklist
- [ ] Admin CRUD hoạt động qua `/admin/policies` (guarded).
- [ ] `content` là HTML, lưu qua editor, render đúng ở cả admin preview và storefront.
- [ ] Slug tự sinh khi bỏ trống; unique.
- [ ] `display_order` điều khiển thứ tự sidebar; `is_active` ẩn/hiện ngoài storefront.
- [ ] Storefront tiêu thụ orval hook đã gen, không hardcode fetch.
- [ ] Không sửa tay file trong `src/lib/api/generated`.
