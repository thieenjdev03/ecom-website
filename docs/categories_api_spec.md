## Categories API

Tài liệu mô tả API quản lý danh mục (categories).

- Base path: `/categories`
- Định dạng: JSON
- Mã thời gian: `createdAt`, `updatedAt` theo ISO 8601

### Kiểu dữ liệu Category

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "parent": { /* Category hoặc null (nếu có load quan hệ) */ },
  "children": [ /* Array<Category> (nếu có load quan hệ) */ ],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

Lưu ý:
- `slug` là duy nhất trong hệ thống.
- `parentId` là UUID hợp lệ của một Category khác (tùy chọn).

---

### 1) Tạo danh mục

- Method: `POST /categories`
- Body:

```json
{
  "name": "string",
  "slug": "string",
  "parentId": "uuid | optional"
}
```

- Responses:
  - 201 Created: Trả về đối tượng Category vừa tạo
  - 404 Not Found: `Parent category not found`
  - 409 Conflict: `Slug already exists`
  - 400 Bad Request: Sai định dạng dữ liệu (ví dụ `parentId` không phải UUID)

- Ví dụ curl:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Áo nam",
    "slug": "ao-nam"
  }' \
  http://localhost:3000/categories
```

---

### 2) Danh sách danh mục

- Method: `GET /categories`
- Mô tả: Trả về danh sách Category. Mặc định bao gồm quan hệ `parent` và `children`.

- Responses:
  - 200 OK: `Category[]`

- Ví dụ curl:

```bash
curl http://localhost:3000/categories
```

---

### 3) Chi tiết danh mục

- Method: `GET /categories/:id`
- Params:
  - `id` (UUID): id của Category

- Responses:
  - 200 OK: `Category`
  - 404 Not Found: `Category not found`
  - 400 Bad Request: `id` không phải UUID hợp lệ

- Ví dụ curl:

```bash
curl http://localhost:3000/categories/6e5e2f2e-1a6b-4f1e-9b8c-0a2e3c1a2f9d
```

---

### 4) Cập nhật danh mục

- Method: `PATCH /categories/:id`
- Params:
  - `id` (UUID)
- Body (tối thiểu một trường):

```json
{
  "name": "string | optional",
  "slug": "string | optional",
  "parentId": "uuid | optional"
}
```

- Ràng buộc & lỗi:
  - 200 OK: Trả về Category đã cập nhật
  - 404 Not Found: `Category not found` hoặc `Parent category not found`
  - 409 Conflict: `Slug already exists` (khi đổi slug sang slug đã tồn tại)
  - 400 Bad Request: Dữ liệu không hợp lệ (ví dụ `id`/`parentId` không phải UUID)

- Ví dụ curl:

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Áo sơ mi nam",
    "slug": "ao-so-mi-nam"
  }' \
  http://localhost:3000/categories/6e5e2f2e-1a6b-4f1e-9b8c-0a2e3c1a2f9d
```

---

### 5) Xóa danh mục

- Method: `DELETE /categories/:id`
- Params:
  - `id` (UUID)

- Responses:
  - 204 No Content: Xóa thành công
  - 404 Not Found: `Category not found`
  - 400 Bad Request: `id` không phải UUID hợp lệ

- Ví dụ curl:

```bash
curl -X DELETE http://localhost:3000/categories/6e5e2f2e-1a6b-4f1e-9b8c-0a2e3c1a2f9d
```

---

### Ghi chú triển khai

- Quan hệ trả về trong `findAll` và `findOne` bao gồm `parent` và `children`.
- `slug` là duy nhất; server trả `409 Conflict` khi trùng.
- Khi cung cấp `parentId`, server sẽ kiểm tra sự tồn tại của danh mục cha.


