# Plan Implement — Migrate Backend NestJS sang domain Mingo (kem)

> Bản chi tiết hoá **Workstream A** trong `mingo-refactor-roadmap.md` (v2). Nguyên tắc: **không đổi platform, không phá API contract FE đang dùng** — mọi thay đổi là additive hoặc dọn dẹp. Kèm bảng API diff ở cuối để FE đối chiếu.

## 0. Mapping domain (chốt từ mockup landing page Mingo)

Mockup xác nhận cấu trúc site: nav "Dòng sản phẩm / Thương hiệu / Hợp tác / Về Mingo", footer liệt kê 4 dòng sản phẩm + 8 thương hiệu, công ty Hồng Tân Phát Co., Ltd.

| Khái niệm Mingo | Entity backend | Ghi chú |
|---|---|---|
| Dòng sản phẩm: Kem hộp, Kem que, Kem ốc quế, Kem đá | `categories` | Cây phẳng 4 node, dùng `display_order` theo footer |
| Thương hiệu: Fruitesia, Fruttega, Rokka, Oasis, Impact, Sandwich, Verano, Vivi | `collections` | **Không cần schema mới** — collections đã có `slug`, `banner_image_url`, SEO fields, N-N qua `product_collections`. Mỗi SP gán đúng 1 collection thương hiệu (quy ước nghiệp vụ, không cần constraint) |
| Vị (Flavor) | `colors` | `name` + `hex_code` (màu đại diện) + `image_url` (ảnh vị) — field có sẵn |
| Quy cách (Cây / Hộp 450ml / Combo...) | `sizes` | Đã có FK `category_id` — size theo từng dòng sản phẩm, đúng nhu cầu |
| "Phải thử" (landing) | `products.is_featured` | Field có sẵn |
| "Hợp tác" (B2B form) | `marketing_contacts` | Thêm source mới `partnership` |
| Hero banner (landing) | — | v1: FE hardcode config. P2: bảng `banners` (schema đề xuất ở mục 6) |

---

## Giai đoạn 1 — Dọn nợ kỹ thuật & vá an toàn (1.5–2 ngày)

**1.1. Vá `RolesGuard`** *(làm đầu tiên)* — ✅ DONE
- Bypass thực tế nằm ở **3 nơi** (không phải 1): `src/auth/roles.guard.ts`, `src/auth/jwt.guard.ts`, và bản sao y hệt `src/modules/auth/jwt/jwt.guard.ts` — đã xoá cả 3.
- Phát hiện thêm: `src/auth/jwt-auth.guard.ts` là guard chết (`canActivate()` luôn `return true`, không ai import) — đã xoá.
- Repo chưa có hạ tầng e2e (`test/` không tồn tại dù `package.json` khai báo `test:e2e`) → thay vì dựng e2e harness mới, viết unit test theo pattern có sẵn (`src/auth/roles.guard.spec.ts`) verify không còn bypass ở mọi `NODE_ENV`. `npx tsc --noEmit` sạch.

**1.2. Thống nhất migration path**
- Sửa `config/db.config.ts` (runtime) trỏ về `src/migrations` (nơi có 11 file thật); xoá thư mục rỗng `src/database/migrations`.
- Quy ước: **không auto-run migration lúc app boot** — chạy `npm run migration:run` như một bước deploy/CI riêng. Verify từ DB trống ra đúng schema hiện tại.

**1.3. Dọn code mồ côi** — ⚠️ ĐÃ SỬA GIẢ ĐỊNH SAU KHI GREP
- ~~Xoá `src/auth/*`~~ **KHÔNG xoá** — grep xác nhận `src/auth/*` (RolesGuard, Role enum, decorators) bị `users`, `orders`, `addresses`, `otp_service`, `health`, và cả `modules/auth` (JwtStrategy) import trực tiếp. Đây là auth infra dùng chung thật, không phải bản cũ chưa dọn. Chỉ phần chết đã xoá ở 1.1 (`jwt-auth.guard.ts`).
- Xoá `data-source.ts` root (dùng `DB_HOST/DB_PORT/...` lệch chuẩn `DATABASE_URL`) hoặc sửa nó đọc `DATABASE_URL` nếu CLI cần.
- Module `variants`: xác nhận không controller nào expose → xoá module/entity. Bảng `variants` trong DB: nếu rỗng → viết migration `DropTable`; nếu có data → giữ bảng, chỉ xoá code, ghi chú lại.

**1.4. Làm rõ `UserWishlist`** *(quyết định mở — cần xác nhận trước khi làm)*
- Đọc `user-wishlist.controller.ts` + DTO + migration thực tế để biết danh sách sản phẩm wishlist đang lưu ở đâu.
- Kịch bản A — đang hoạt động đúng ở đâu đó: chỉ document lại, không sửa.
- Kịch bản B — thiết kế dở dang (1 row/user, không có product id): redesign tối thiểu — bảng `user_wishlist_products(user_id, product_id, created_at)` unique `(user_id, product_id)` + migration chuyển data cũ (nếu có) + sửa service/controller giữ nguyên route.

**1.5. Baseline**
- Commit `env.example` đang pending (đối chiếu `.env` thật).
- `npm run openapi:export` → commit `docs/openapi.json` làm hợp đồng gốc; cuối dự án diff lại để chứng minh chỉ additive.

**Done khi:** build + `migration:run` sạch trên DB trống; e2e auth pass; OpenAPI baseline đã commit.

---

## Giai đoạn 2 — Payment VNPay (3–5 ngày) — *đường găng*

**2.0. Thủ tục (bắt đầu NGAY tuần 1, song song code):** đăng ký merchant VNPay cho pháp nhân Hồng Tân Phát Co., Ltd (cần ĐKKD, website, tài khoản ngân hàng DN). Duyệt thường mất vài ngày → không để chặn sandbox.

**2.1. Module `modules/vnpay`** (theo đúng pattern `modules/paypal` có sẵn):
- `vnpay.service.ts`: build payment URL (sort params alphabet, HMAC-SHA512 với `VNPAY_HASH_SECRET`), verify checksum cho return/IPN.
- `vnpay.controller.ts`:
  - `POST /vnpay/create-payment` — body `{ orderId }` → trả `{ paymentUrl }`. Validate order tồn tại, status `PENDING_PAYMENT`, amount lấy từ `order.summary.total` (snapshot), **không nhận amount từ FE**.
  - `GET /vnpay/return` — verify checksum, redirect về FE `checkout/success|error` kèm orderNumber. **Chỉ để hiển thị, không set trạng thái.**
  - `GET /vnpay/ipn` — nguồn sự thật duy nhất: verify checksum → check amount khớp summary → idempotency qua `vnpay_events` → update order `PAID`, ghi `paidAmount/paidCurrency/paidAt` (cột có sẵn từ PayPal, tái dùng) + append `tracking_history`.
- `vnpay_events` entity: copy pattern `paypal_events` — `rawData` jsonb, unique theo `vnp_TxnRef + vnp_TransactionNo` (chống IPN retry tạo double-paid).

**2.2. Chiến lược `vnp_TxnRef`:** dùng `${orderNumber}-${attempt}` (attempt tăng mỗi lần khách bấm thanh toán lại) — không cần thêm cột mới vào `orders`, tra ngược order từ TxnRef bằng cách strip suffix.

**2.3. Sửa payment method enum/DTO:**
- `Order.paymentMethod`: thêm `'VNPAY'`, **gỡ `'STRIPE'`** khỏi type + class-validator (an toàn: chưa từng có đơn STRIPE vì chưa implement).
- Env mới: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`, `VNPAY_RETURN_URL` → cập nhật `env.example`.

**2.4. Test matrix (sandbox):** thanh toán thành công / khách huỷ / sai checksum / IPN gửi trùng 3 lần / amount mismatch / đơn hết hạn. Giữ PayPal chạy song song (regression), COD giữ nguyên flow thủ công.

**Done khi:** đơn VNPay end-to-end trên sandbox, IPN retry không double-paid, PayPal cũ không gãy.

---

## Giai đoạn 3 — Điều chỉnh domain & tích hợp landing (1.5–2 ngày)

**3.1. Products — featured filter:** xác nhận `GET /products` đã filter được `is_featured` (đã có filter `collection_id`); nếu chưa → thêm query param `is_featured=true` cho section "Phải thử".

**3.2. Marketing — form Hợp tác:** thêm `'partnership'` vào enum/validation `source` của `marketing_contacts` (nếu source là varchar thì chỉ sửa DTO, không cần migration); tag `b2b`. FE trang Hợp tác gọi thẳng `POST /marketing`.

**3.3. Shipping:**
- Thay data Google Sheet: bảng giá nội địa theo province/district/weight (bỏ bảng cross-border), thêm method "Giao nhanh nội thành" nếu cấu trúc Sheet có cột method.
- `shipping.config`: default currency VND, country VN; xem lại cache TTL (bảng giá nội địa ít đổi → TTL dài hơn được).

**3.4. Order status:** **giữ nguyên enum 14 trạng thái, không migration** — việc ẩn trạng thái cross-border xử lý ở FE admin (roadmap Phase 4). Optional (nếu muốn chặt chẽ): thêm whitelist chuyển trạng thái hợp lệ trong `changeOrderStatus` — để P2.

**3.5. Email templates (mail module):** order confirmation / welcome / reset password → branding Mingo, tiếng Việt, tagline "Joy in every bite!", footer pháp nhân Hồng Tân Phát.

---

## Giai đoạn 4 — Data migration & seed (1–1.5 ngày)

- Seed **4 categories** đúng thứ tự footer: Kem hộp, Kem que, Kem ốc quế, Kem đá (`display_order` 1-4).
- Seed **8 collections thương hiệu**: Fruitesia, Fruttega, Rokka, Oasis, Impact, Sandwich, Verano, Vivi — mỗi cái có `slug`, `banner_image_url`, SEO fields.
- Seed **flavors** (bảng colors): tối thiểu theo SP ra mắt — Creme Caramel `#F0DFAF` + ảnh, Matcha Red Bean `#7CB342` + ảnh...
- Seed **sizes theo category**: Kem que (Cây, Combo 5 cây), Kem hộp (450ml, 1L), Kem ốc quế (Cái, Lốc 4), Kem đá (Cây, Túi 10).
- **Archive bikini:** `UPDATE products SET status='discontinued'` (hoặc soft delete `deleted_at`) — KHÔNG hard delete; orders cũ là snapshot JSONB, không đụng.
- Cloudinary: tạo folder `mingo/` cho packshot mới; ảnh cũ giữ nguyên (URL trong order snapshot còn tham chiếu).
- Viết seed dạng **idempotent script** (`npm run seed:mingo` — upsert theo slug) để chạy lại được trên staging/prod.

---

## Giai đoạn 5 — Kiểm thử & bàn giao (1–1.5 ngày)

- e2e: auth, product list/filter (category/collection/featured), tạo đơn COD, đơn VNPay sandbox, đổi status + tracking_history ghi `changed_by`, shipping fee nội thành ra số đúng.
- Regression: PayPal capture + webhook, OTP, mail, Cloudinary signature.
- Re-export OpenAPI → diff với baseline GĐ1: chỉ được phép additive (+ VNPay endpoints, + is_featured param, − STRIPE khỏi enum).
- Deploy staging → bàn giao FE bắt đầu Phase 3.5 (UI VNPay) + Phase 5 (seed qua admin).

---

## 6. Danh sách migration phải viết

1. `DropTable variants` (chỉ khi xác nhận bảng rỗng — GĐ1).
2. Redesign `user_wishlist_products` (chỉ khi rơi vào kịch bản B — GĐ1).
3. `CreateTable vnpay_events` (GĐ2).
4. Enum PG `source` của marketing thêm `partnership` (chỉ khi là enum thật, không phải varchar — GĐ3).
5. *(P2, chưa làm)* `CreateTable banners`: `id, title jsonb {en,vi}, subtitle jsonb, image_url, cta_link, background_color, sort_order, is_active, starts_at, ends_at` — cho hero landing quản lý qua admin thay vì hardcode FE.

## 7. Bảng API diff (gửi FE đối chiếu)

| Endpoint / Contract | Thay đổi | Loại |
|---|---|---|
| `POST /vnpay/create-payment` | Mới | Additive |
| `GET /vnpay/return`, `GET /vnpay/ipn` | Mới (FE chỉ quan tâm return redirect) | Additive |
| `Order.paymentMethod` | + `VNPAY`, − `STRIPE` | Breaking nhẹ — FE ẩn Stripe (Phase 2 FE) |
| `GET /products` | + query `is_featured` (nếu chưa có) | Additive |
| `POST /marketing` | + `source: partnership` | Additive |
| Toàn bộ còn lại | Giữ nguyên 100% | — |

## 8. Rủi ro & quyết định mở

| # | Vấn đề | Hướng xử lý |
|---|---|---|
| 1 | VNPay merchant duyệt chậm | Đăng ký tuần 1; sandbox không phụ thuộc duyệt |
| 2 | Cấu trúc wishlist thật chưa rõ | Task 1.4 đọc code trước, chỉ redesign nếu thật sự dở dang |
| 3 | Hero banner hardcode FE | Chấp nhận v1; P2 thêm bảng `banners` (schema sẵn ở mục 6) |
| 4 | Ai cập nhật Google Sheet giá ship | Bàn giao vận hành + hướng dẫn cấu trúc cột; P2 chuyển vào DB |
| 5 | Sản phẩm 1 thương hiệu nhưng collections là N-N | Quy ước nghiệp vụ khi nhập liệu; không thêm constraint để giữ linh hoạt (SP vẫn vào được collection "Best seller" song song) |

## 9. Timeline

| Tuần | Việc | Effort |
|---|---|---|
| 1 | GĐ1 dọn nợ + đăng ký merchant VNPay | 1.5–2 ngày |
| 2 | GĐ2 VNPay (sandbox) | 3–5 ngày |
| 3 | GĐ3 domain + GĐ4 seed | 2.5–3.5 ngày |
| 3–4 | GĐ5 test + bàn giao FE | 1–1.5 ngày |

**Tổng: ~8–12 ngày** cho 1 backend dev — khớp ước lượng Workstream A trong roadmap v2. GĐ3/GĐ4 có thể kéo lên chạy song song GĐ2 nếu có người thứ hai.
