## Product Service API Requirements and Frontend CRUD UI Contract

This document defines the current Product service API (as implemented in `src/modules/products`) and a matching CRUD UI contract for the frontend. It is source-of-truth for request/response payloads, validation, and interaction flows.

Related reference lists used during product creation:
- See `docs/reference_lists_for_product_creation.md` for GET APIs of categories, colors, and sizes.

### Auth
- All endpoints require Bearer token: `Authorization: Bearer <jwt>`

### Base URL
- Products: `/products`

---

## 1) Data Models (as exposed by API)

### ProductDto (response)
- `id` (uuid)
- `productCode` (string)
- `productSku` (string | null)
- `category` ({ id: string; name?: string })
- `quantity` (number)
- `tags` (string[])
- `gender` (string[])
- `saleLabel` (string | null)
- `newLabel` (string | null)
- `isSale` (boolean)
- `isNew` (boolean)
- `variants` (ProductVariantDto[])
- `colors` (ColorDto[])
- `sizes` (SizeDto[])

### ProductVariantDto (response)
- `id` (uuid)
- `color` (ColorDto)
- `size` (SizeDto)
- `sku` (string)
- `price` (number)
- `salePrice` (number | null)
- `quantity` (number)
- `imageUrl` (string | null)
- `isAvailable` (boolean)

### ColorDto (response)
- `id` (uuid)
- `name` (string)
- `hexCode` (string | null)

### SizeDto (response)
- `id` (uuid)
- `name` (string)
- `category` ({ id: string } | null)
- `sortOrder` (number)

### CreateProductDto (request)
- `productCode` (string, required)
- `productSku` (string, optional)
- `categoryId` (uuid, required)
- `quantity` (number, optional, default 0)
- `tags` (string[], optional, default [])
- `gender` (string[], optional, default [])
- `saleLabel` (string, optional)
- `newLabel` (string, optional)
- `isSale` (boolean, optional, default false)
- `isNew` (boolean, optional, default false)
- `colorIds` (uuid[], required, min length 1)
- `sizeIds` (uuid[], required, min length 1)
- `variants` (CreateVariantDto[], optional)

### CreateVariantDto (request)
- `colorId` (uuid, required)
- `sizeId` (uuid, required)
- `sku` (string, required, unique)
- `price` (number, required)
- `salePrice` (number, optional)
- `quantity` (number, required)
- `imageUrl` (string, optional)

### UpdateProductDto (request)
- Partial of `CreateProductDto` except it cannot update: `colorIds`, `sizeIds`, `variants` in the same call. To modify colors/sizes/variants, use dedicated endpoints below.

---

## 2) Endpoints

### Create Product
- Method: POST `/products`
- Body: `CreateProductDto`
- Success: 201 Created → `ProductDto` (includes populated relations)
- Errors:
  - 409 Conflict → `Product code already exists` or `SKU ... already exists` (if variants collide)
  - 404 Not Found → `Category not found` | `One or more colors not found` | `One or more sizes not found`

Example body:
```json
{
  "productCode": "TSHIRT-001",
  "productSku": "TSHIRT-001-BASE",
  "categoryId": "00000000-0000-0000-0000-000000000001",
  "quantity": 0,
  "tags": ["tshirt", "summer"],
  "gender": ["men"],
  "saleLabel": null,
  "newLabel": "New",
  "isSale": false,
  "isNew": true,
  "colorIds": ["00000000-0000-0000-0000-0000000000a1"],
  "sizeIds": ["00000000-0000-0000-0000-0000000000b1"],
  "variants": [
    {
      "colorId": "00000000-0000-0000-0000-0000000000a1",
      "sizeId": "00000000-0000-0000-0000-0000000000b1",
      "sku": "TSHIRT-001-RED-M",
      "price": 19.99,
      "salePrice": null,
      "quantity": 50,
      "imageUrl": null
    }
  ]
}
```

### List Products
- Method: GET `/products`
- Query: none (no pagination yet)
- Success: 200 OK → `ProductDto[]`

### Get Product by Id
- Method: GET `/products/:id`
- Params: `id` (uuid)
- Success: 200 OK → `ProductDto`
- Errors: 404 Not Found → `Product not found`

### Update Product
- Method: PATCH `/products/:id`
- Params: `id` (uuid)
- Body: `UpdateProductDto`
- Success: 200 OK → `ProductDto`
- Errors:
  - 404 Not Found → `Product not found` | `Category not found`

Notes:
- To add/remove colors/sizes or to add/update/remove variants, use the dedicated endpoints below.

### Delete Product
- Method: DELETE `/products/:id`
- Params: `id` (uuid)
- Success: 204 No Content
- Errors: 404 Not Found → `Product not found`

### Add Colors to Product
- Method: POST `/products/:id/colors`
- Body: `{ "colorIds": string[] }`
- Success: 200 OK → `ProductDto` (with updated `colors`)
- Errors:
  - 404 Not Found → `Product not found` | `One or more colors not found`

### Remove Color from Product
- Method: DELETE `/products/:id/colors/:colorId`
- Success: 200 OK → `ProductDto` (with updated `colors`)
- Errors: 404 Not Found → `Product not found`

### Add Sizes to Product
- Method: POST `/products/:id/sizes`
- Body: `{ "sizeIds": string[] }`
- Success: 200 OK → `ProductDto` (with updated `sizes`)
- Errors:
  - 404 Not Found → `Product not found` | `One or more sizes not found`

### Remove Size from Product
- Method: DELETE `/products/:id/sizes/:sizeId`
- Success: 200 OK → `ProductDto` (with updated `sizes`)
- Errors: 404 Not Found → `Product not found`

### Add Single Variant
- Method: POST `/products/:id/variants`
- Body: `CreateVariantDto`
- Success: 201 Created → `ProductVariantDto`
- Errors:
  - 404 Not Found → `Product not found` | `Color or Size not found`
  - 409 Conflict → `SKU already exists` | `Variant with this color and size already exists`

### Update Variant
- Method: PATCH `/products/:id/variants/:variantId`
- Body: Partial<CreateVariantDto>
- Success: 200 OK → `ProductVariantDto`
- Errors: 404 Not Found → `Variant not found` | `Color not found` | `Size not found`

### Remove Variant
- Method: DELETE `/products/:id/variants/:variantId`
- Success: 204 No Content
- Errors: 404 Not Found → `Variant not found`

### Add Variants in Bulk
- Method: POST `/products/:id/variants/bulk`
- Body: `CreateVariantDto[]`
- Success: 201 Created → `ProductVariantDto[]`
- Errors:
  - 404 Not Found → `Product not found` | `Color or Size not found`
  - 409 Conflict → `SKU ... already exists` | `Duplicate variant with same color and size`

---

## 3) Validation Rules (frontend should mirror)
- `productCode`: required, string, unique
- `categoryId`: required, uuid
- `colorIds`: required, array of uuid, min 1
- `sizeIds`: required, array of uuid, min 1
- `tags`, `gender`: arrays of strings
- Variant
  - `colorId`, `sizeId`: required uuid
  - `sku`: required, unique
  - `price`: required number (decimal allowed)
  - `salePrice`: optional number (<= `price` recommended)
  - `quantity`: required number (int >= 0)

---

## 4) Frontend CRUD UI Contract

### Product List Page
- Table columns: `productCode`, `productSku`, `category.name`, `quantity`, `isSale`, `isNew`, `variants.length`
- Actions: View, Edit, Delete
- Fetch: GET `/products`

### Product Create Page
- Form sections
  - Basic: `productCode`, `productSku`, `categoryId` (select), `quantity`, `tags` (multi), `gender` (multi), `saleLabel`, `newLabel`, `isSale`, `isNew`
  - Associations: `colorIds` (multi-select), `sizeIds` (multi-select)
  - Variants (optional, dynamic list): each with `colorId`, `sizeId`, `sku`, `price`, `salePrice`, `quantity`, `imageUrl`
- Data sources (preload)
  - Categories: use existing categories API (id, name)
  - Colors: use colors API (id, name, hexCode)
  - Sizes: use sizes API (id, name, sortOrder)
- Submit → POST `/products` with `CreateProductDto`
- On success: redirect to Detail page and show success toast
- Error handling: display server validation/errors from messages above

### Product Detail Page
- Display `ProductDto` fields
- Tabs
  - Overview: basic fields
  - Colors: list and allow removal
  - Sizes: list and allow removal
  - Variants: table with edit/delete for each variant
- Fetch: GET `/products/:id`

### Product Edit Page (basic fields only)
- Editable fields: `productSku`, `categoryId`, `quantity`, `tags`, `gender`, `saleLabel`, `newLabel`, `isSale`, `isNew`
- Non-editable here: `productCode` (treat as immutable), colors, sizes, variants (managed in their own flows)
- Submit → PATCH `/products/:id` with `UpdateProductDto`

### Manage Colors
- Add colors: modal with multi-select colors → POST `/products/:id/colors` body `{ colorIds }`
- Remove color: inline action → DELETE `/products/:id/colors/:colorId`
- Refresh detail after success

### Manage Sizes
- Add sizes: modal with multi-select sizes → POST `/products/:id/sizes` body `{ sizeIds }`
- Remove size: inline action → DELETE `/products/:id/sizes/:sizeId`
- Refresh detail after success

### Manage Variants
- Add variant: modal/form → POST `/products/:id/variants`
  - Validate SKU uniqueness client-side when possible (pre-check among current variants); server is source-of-truth
- Edit variant: inline row edit or modal → PATCH `/products/:id/variants/:variantId`
- Delete variant: confirm → DELETE `/products/:id/variants/:variantId`
- Bulk add: CSV/import UI mapping to `CreateVariantDto[]` → POST `/products/:id/variants/bulk`
- Display `isAvailable` as derived from server; not editable directly (server maintains it)

### UX/Validation Details
- Disable submit until required fields are valid
- Number inputs for `quantity`, `price`, `salePrice`
- Ensure `salePrice <= price` when both present
- For variant create/edit, prevent selecting a color/size pair already used by another variant of the same product (client hint); server also enforces

### Error and Loading States
- Show toasts for success/failure
- Map server errors by message string; if unknown, show generic error
- Loading spinners on all network calls; disable relevant actions while pending

### Example Requests

Create Product:
```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json
```

List Products:
```http
GET /products
Authorization: Bearer <token>
```

Get Product:
```http
GET /products/{id}
Authorization: Bearer <token>
```

Update Product:
```http
PATCH /products/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

Delete Product:
```http
DELETE /products/{id}
Authorization: Bearer <token>
```

Add Colors:
```http
POST /products/{id}/colors
Authorization: Bearer <token>
Content-Type: application/json
```

Remove Color:
```http
DELETE /products/{id}/colors/{colorId}
Authorization: Bearer <token>
```

Add Sizes:
```http
POST /products/{id}/sizes
Authorization: Bearer <token>
Content-Type: application/json
```

Remove Size:
```http
DELETE /products/{id}/sizes/{sizeId}
Authorization: Bearer <token>
```

Add Variant:
```http
POST /products/{id}/variants
Authorization: Bearer <token>
Content-Type: application/json
```

Update Variant:
```http
PATCH /products/{id}/variants/{variantId}
Authorization: Bearer <token>
Content-Type: application/json
```

Remove Variant:
```http
DELETE /products/{id}/variants/{variantId}
Authorization: Bearer <token>
```

Bulk Add Variants:
```http
POST /products/{id}/variants/bulk
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 5) Notes and Future Extensions
- Pagination/filters for GET `/products` can be added later; FE should be prepared to adapt.
- Media handling for variant `imageUrl` is a simple string URL today; a future file-upload flow may replace it.
- `isAvailable` is determined/stored by backend; FE should treat as read-only.


