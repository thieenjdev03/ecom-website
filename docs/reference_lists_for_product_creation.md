## Reference Lists for Product Creation (Categories, Colors, Sizes)

This document describes the read APIs the frontend should use to populate selection lists when creating or editing a Product. It complements `docs/product_api_ui_spec.md`.

### Auth
- All endpoints require Bearer token: `Authorization: Bearer <jwt>`

---

## Categories

### List Categories
- Method: GET `/categories`
- Query: none
- Success: 200 OK → `Category[]`

Category entity (selected fields):
- `id` (uuid)
- `name` (string)
- `slug` (string)
- `parent` (Category | null)
- `children` (Category[])

Usage in Product Create/Edit UI:
- Populate category select with `{ id, name }`.
- If hierarchical UI is needed, use `parent`/`children` relations.

---

## Colors

### List Colors
- Method: GET `/colors`
- Query: none
- Success: 200 OK → `Color[]`

Color entity (selected fields):
- `id` (uuid)
- `name` (string)
- `hexCode` (string | null)

Usage in Product Create/Edit UI:
- Populate multi-select for `colorIds` using `{ id, name, hexCode }`.
- Also used when creating variants (color selection per variant).

---

## Sizes

### List Sizes
- Method: GET `/sizes`
- Query params (optional):
  - `categoryId` (uuid): filter sizes belonging to a category
- Success: 200 OK → `Size[]`

Size entity (selected fields):
- `id` (uuid)
- `name` (string)
- `category` ({ id: string } | null)
- `sortOrder` (number)

Usage in Product Create/Edit UI:
- Populate multi-select for `sizeIds` using `{ id, name }`.
- When `categoryId` is selected for the product, you may filter sizes by calling `/sizes?categoryId=<id>`.
- Also used when creating variants (size selection per variant).

---

## Example Calls

List Categories:
```http
GET /categories
Authorization: Bearer <token>
```

List Colors:
```http
GET /colors
Authorization: Bearer <token>
```

List Sizes (all):
```http
GET /sizes
Authorization: Bearer <token>
```

List Sizes (by category):
```http
GET /sizes?categoryId={categoryId}
Authorization: Bearer <token>
```

---

## Notes
- For Product creation, these lists should be loaded before rendering the form to avoid empty dropdowns.
- Use `id` values returned here to populate `categoryId`, `colorIds`, and `sizeIds` in `CreateProductDto` (see `product_api_ui_spec.md`).


