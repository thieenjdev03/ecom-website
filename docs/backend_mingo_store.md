# Prompt — Backend cần làm để admin + mingo-store chạy đủ

> Paste nguyên phần dưới cho agent làm việc trong `ecom-website`.

---

Bạn làm việc trong repo `ecom-website` (NestJS 11 + TypeORM + Postgres). Đọc `../CLAUDE.md` trước.

**Ràng buộc chung (bắt buộc, áp cho mọi task):**
- Mọi response DTO phải có `@ApiProperty` đầy đủ — đây là nguồn duy nhất sinh type cho FE.
- Endpoint ghi (POST/PATCH/DELETE) luôn `@UseGuards(JwtGuard, RolesGuard)` + `@Roles(Role.ADMIN)` + `@ApiBearerAuth()`. Endpoint đọc (GET) để public.
- Mỗi thay đổi schema → 1 migration trong `src/migrations` (`npm run m:gen -- src/migrations/Tên`), không dùng `synchronize`.
- Xong mỗi task chạy: `npm run lint && npm test && npm run openapi:export`, rồi báo để FE chạy `npm run api:gen` trong `mingo-store`.
- Copy pattern có sẵn từ `src/modules/careers` (module/controller/service/dto/entities + `.service.spec.ts`). Đừng tạo abstraction mới.

---

## P0 — Careers: vá lệch contract + endpoint apply

Admin UI (`ecom-client/src/sections/career`) đã build xong nhưng gọi sai/thiếu 3 chỗ:

1. **`is_primary` vs `isPrimary`** — `CreateCareerDto`/`UpdateCareerDto` nhận `is_primary` (snake), FE gửi `isPrimary` (camel). Hiện field bị `whitelist` nuốt im lặng → không bao giờ set được primary.
   → Nhận **cả hai**: thêm `@Expose({ name: 'isPrimary' })` hoặc `@Transform` map `isPrimary` → `is_primary` trong DTO. Giữ `is_primary` là tên chuẩn trong response.

2. **Thiếu `cover_url`** — FE gửi `coverUrl` (ảnh cover từ `/files/upload`), entity `Career` không có cột.
   → Thêm `@Column({ length: 500, nullable: true }) cover_url: string` + migration + field trong Create/Update DTO (nhận cả `coverUrl`) + `CareerDto`.

3. **Thiếu `POST /careers/:id/apply`** — FE (`career-apply-form.tsx`) và mingo-store `/careers/[slug]` đều cần nộp hồ sơ.
   → Entity mới `CareerApplication` (`career_applications`): `id`, `career_id` (FK → careers), `full_name`, `email`, `phone`, `cover_letter` (text, nullable), `cv_url` (varchar 500), `status` (`new|reviewing|rejected|hired`, default `new`), `created_at`.
   → `POST /careers/:id/apply` — **public**, `multipart/form-data`, field file tên `cv`. Upload CV qua `FilesService` đang có, lưu URL. Chặn: chỉ nhận `.pdf/.doc/.docx`, max 5MB, trả 400 nếu sai. Trả `201 { id, created_at }`, không echo lại data ứng viên.
   → `GET /careers/:id/applications` + `PATCH /career-applications/:id` (đổi `status`) — **admin only**, để admin UI list/duyệt hồ sơ.

## P1 — Module `brands` (mingo-store `/brands`, `/brands/[slug]`)

Hiện hardcode ở `mingo-store/src/config/brands.ts` (8 sub-brand: Impact, Rokka, Oasis, ViVi, Ice Cream Sandwich, Fruttega, Verano, Fruitesia).

Entity `Brand` (`brands`): `id` (uuid), `name`, `slug` (unique), `logo_url` (nullable — Fruttega chưa có logo), `description` (text, nullable), `display_order` (int, default 0), `is_active` (bool, default true), timestamps + `deleted_at`.

Endpoints: `GET /brands` (filter `?active=true`, sort theo `display_order`), `GET /brands/slug/:slug`, `POST/PATCH/DELETE /brands` (admin).

Liên kết sản phẩm: thêm `brand_id` (uuid, nullable, FK) vào entity `Product`, expose trong `ProductResponseDto` dưới dạng `brand: { id, name, slug, logo_url } | null` (giống `ProductCategorySummaryDto`), và thêm filter `?brand=<slug>` vào `GET /products` — trang `/brands/[slug]` cần list sản phẩm theo brand.

Seed 8 brand trên trong migration để mingo-store bỏ được `config/brands.ts`.

## P2 — Module `stores` (store locator, mingo-store `/about#distribution`)

Hiện mock ở `mingo-store/src/features/distribution/data.ts` — giữ nguyên shape đó để FE chỉ phải đổi 1 hàm `getStores()`.

Entity `Store` (`stores`): `id`, `name`, `address`, `province_code` (varchar), `province_name`, `district_code` (varchar), `district_name`, `lat` (decimal 10,7), `lng` (decimal 10,7), `product_lines` (`text[]` hoặc jsonb — giá trị `bars|boxes|cones`), `is_active`, timestamps.

Endpoints:
- `GET /stores?province=&district=&line=` → trả `Store[]` (filter theo **code**, không theo tên có dấu).
- `GET /stores/provinces` → `[{ code, name, districts: [{ code, name, lat, lng }] }]` cho dropdown.
- `POST/PATCH/DELETE /stores` (admin).

Không cần geo-search bán kính, PostGIS, hay phân trang — dữ liệu cỡ vài trăm dòng, FE lọc client-side phần còn lại.

## P3 — `POST /contact` (form liên hệ)

`mingo-store/src/features/contact/use-submit-contact.ts` đang mock, có `TODO(api)` ghi rõ "đổi sang POST /contact, không gọi /marketing".

Entity `ContactSubmission` (`contact_submissions`): `id`, `full_name`, `email`, `phone` (nullable), `subject` (nullable), `message` (text), `status` (`new|handled`, default `new`), `created_at`.

- `POST /contact` — public, rate-limit theo IP (dùng `@nestjs/throttler` nếu đã có, không thì bỏ qua và ghi TODO). Gửi mail thông báo qua `MailModule` đang có.
- `GET /contact` + `PATCH /contact/:id` (đổi `status`) — admin only.

---

## Thứ tự làm

P0 → P1 → P2 → P3. Sau **mỗi** P chạy `npm run openapi:export` và báo lại, đừng gộp một lần cuối — FE cần contract sớm để làm admin UI song song.

## Không làm (YAGNI)

CMS cho `/about`, `/policies`, `/faqs`, `/partnership` — nội dung tĩnh, sửa bằng deploy rẻ hơn build CMS. Chỉ làm khi marketing thực sự yêu cầu tự sửa.
