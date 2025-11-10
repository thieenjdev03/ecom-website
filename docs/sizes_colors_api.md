## Sizes & Colors API

This document describes the available endpoints for managing Sizes and Colors used by product variants. It covers request/response payloads, validation, filtering, and typical error cases.

### Common Notes
- All IDs are UUID strings.
- Timestamps are ISO 8601 strings returned by the API.
- Errors follow NestJS HTTP exceptions with `message` and `statusCode`.

---

## Sizes

Entity fields:
- `id: string` (UUID)
- `name: string` (required)
- `category` (optional relation to `Category`, used to filter sizes per product category)
- `sortOrder: number` (default 0)
- `createdAt: string`
- `updatedAt: string`

DTOs and validation:
- Create
  - `name: string` (required)
  - `categoryId?: number` (optional, matches `Category.id`)
  - `sortOrder?: number` (optional)
- Update: partial of Create

### Create Size
- Method: POST
- Path: `/sizes`
- Body:
```json
{
  "name": "M",
  "categoryId": 1,
  "sortOrder": 10
}
```
- 201 Created, Response:
```json
{
  "id": "<uuid>",
  "name": "M",
  "category": { "id": 1, "name": "Shirts", "slug": "shirts" },
  "sortOrder": 10,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```
- Errors:
  - 404 Not Found: `Category not found` (if `categoryId` does not exist)

### List Sizes (optional category filter)
- Method: GET
- Path: `/sizes`
- Query: `categoryId?: number`
- Example: `/sizes?categoryId=1`
- 200 OK, Response (sorted by `sortOrder ASC`):
```json
[
  { "id": "<uuid>", "name": "S", "category": { "id": 1, "name": "Shirts", "slug": "shirts" }, "sortOrder": 0,  "createdAt": "...", "updatedAt": "..." },
  { "id": "<uuid>", "name": "M", "category": { "id": 1, "name": "Shirts", "slug": "shirts" }, "sortOrder": 10, "createdAt": "...", "updatedAt": "..." }
]
```

### Get Size by ID
- Method: GET
- Path: `/sizes/:id`
- Params: `id` (UUID)
- 200 OK, Response:
```json
{ "id": "<uuid>", "name": "M", "category": { "id": 1, "name": "Shirts", "slug": "shirts" }, "sortOrder": 10, "createdAt": "...", "updatedAt": "..." }
```
- Errors:
  - 404 Not Found: `Size not found`

### Update Size
- Method: PATCH
- Path: `/sizes/:id`
- Params: `id` (UUID)
- Body (partial):
```json
{ "name": "XL", "categoryId": 2, "sortOrder": 20 }
```
- 200 OK, Response: same shape as Get by ID
- Errors:
  - 404 Not Found: `Size not found`
  - 404 Not Found: `Category not found` (if updating to non-existent `categoryId`)

### Delete Size
- Method: DELETE
- Path: `/sizes/:id`
- Params: `id` (UUID)
- 204 No Content
- Errors:
- 404 Not Found: `Size not found`

---

## Colors

Entity fields:
- `id: string` (UUID)
- `name: string` (required, unique by business rule)
- `hexCode?: string` (format `#RRGGBB`, optional)
- `createdAt: string`
- `updatedAt: string`

DTOs and validation:
- Create
  - `name: string` (required)
  - `hexCode?: string` (optional, must match `^#[0-9A-Fa-f]{6}$`)
- Update: partial of Create

### Create Color
- Method: POST
- Path: `/colors`
- Body:
```json
{ "name": "Black", "hexCode": "#000000" }
```
- 201 Created, Response:
```json
{ "id": "<uuid>", "name": "Black", "hexCode": "#000000", "createdAt": "...", "updatedAt": "..." }
```
- Errors:
  - 409 Conflict: `Color already exists` (duplicate name)

### List Colors
- Method: GET
- Path: `/colors`
- 200 OK, Response (ordered by `name ASC`):
```json
[
  { "id": "<uuid>", "name": "Black", "hexCode": "#000000", "createdAt": "...", "updatedAt": "..." },
  { "id": "<uuid>", "name": "Blue",  "hexCode": "#0000FF", "createdAt": "...", "updatedAt": "..." }
]
```

### Get Color by ID
- Method: GET
- Path: `/colors/:id`
- Params: `id` (UUID)
- 200 OK, Response:
```json
{ "id": "<uuid>", "name": "Black", "hexCode": "#000000", "createdAt": "...", "updatedAt": "..." }
```
- Errors:
  - 404 Not Found: `Color not found`

### Update Color
- Method: PATCH
- Path: `/colors/:id`
- Params: `id` (UUID)
- Body (partial):
```json
{ "name": "Midnight", "hexCode": "#111111" }
```
- 200 OK, Response: same shape as Get by ID
- Errors:
  - 404 Not Found: `Color not found`
  - 409 Conflict: `Color already exists` (if updating `name` to an existing one)
  - 400 Bad Request: `Unable to update color` (generic update failure)

### Delete Color
- Method: DELETE
- Path: `/colors/:id`
- Params: `id` (UUID)
- 204 No Content
- Errors:
  - 404 Not Found: `Color not found`

---

## Frontend Integration Tips
- Use `/sizes?categoryId=` to fetch sizes relevant to a selected `Category` before composing variant matrices.
- Colors are global; fetch `/colors` to populate the color selector.
- When creating product variants, persist both `size_id` and `color_id` (UUIDs) in each variant item.


