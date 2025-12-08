# Collections API - Request & Response Payloads

Complete API payload examples for the Collections module.

## Table of Contents
- [Create Collection](#create-collection)
- [Update Collection](#update-collection)
- [Assign Products](#assign-products)
- [Remove Products](#remove-products)
- [Query Parameters](#query-parameters)
- [Response Formats](#response-formats)

---

## Create Collection

### Endpoint
```
POST /collections
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

### Request Body - Full Example
```json
{
  "name": "Summer Collection 2024",
  "slug": "summer-collection-2024",
  "description": "Discover our latest summer fashion trends. Light, breezy, and perfect for hot weather.",
  "banner_image_url": "https://cdn.example.com/banners/summer-2024.jpg",
  "seo_title": "Summer Collection 2024 - Trendy Summer Fashion | Fashion Store",
  "seo_description": "Browse our curated summer collection featuring the latest trends in lightweight clothing, swimwear, and summer accessories.",
  "is_active": true
}
```

### Request Body - Minimum Required
```json
{
  "name": "Summer Collection 2024"
}
```
*Note: Slug will be auto-generated as "summer-collection-2024"*

### Request Body - Validation Rules

| Field | Type | Required | Max Length | Rules |
|-------|------|----------|-----------|-------|
| name | string | Yes | 255 | Not empty |
| slug | string | No | 255 | Unique, URL-friendly (auto-generated if not provided) |
| description | text | No | - | - |
| banner_image_url | string | No | 500 | Valid URL format |
| seo_title | string | No | 255 | - |
| seo_description | text | No | - | - |
| is_active | boolean | No | - | Default: true |

### Success Response (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Collection 2024",
  "slug": "summer-collection-2024",
  "description": "Discover our latest summer fashion trends. Light, breezy, and perfect for hot weather.",
  "banner_image_url": "https://cdn.example.com/banners/summer-2024.jpg",
  "seo_title": "Summer Collection 2024 - Trendy Summer Fashion | Fashion Store",
  "seo_description": "Browse our curated summer collection featuring the latest trends in lightweight clothing, swimwear, and summer accessories.",
  "is_active": true,
  "created_at": "2024-12-08T10:00:00.000Z",
  "updated_at": "2024-12-08T10:00:00.000Z"
}
```

### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "name must be a string"
  ],
  "error": "Bad Request"
}
```

**409 Conflict - Duplicate Slug**
```json
{
  "statusCode": 409,
  "message": "Collection with slug \"summer-collection-2024\" already exists",
  "error": "Conflict"
}
```

---

## Update Collection

### Endpoint
```
PATCH /collections/:id
```

### Request Body - Partial Update
All fields are optional. Only include fields you want to update.

```json
{
  "name": "Summer Collection 2024 - Updated",
  "description": "New description for the collection",
  "is_active": false
}
```

### Request Body Examples

**Update Name Only**
```json
{
  "name": "Winter Essentials 2025"
}
```

**Update SEO Fields**
```json
{
  "seo_title": "New SEO Title",
  "seo_description": "New SEO description for better ranking"
}
```

**Deactivate Collection**
```json
{
  "is_active": false
}
```

**Update Banner**
```json
{
  "banner_image_url": "https://cdn.example.com/new-banner.jpg"
}
```

**Update Slug (with validation)**
```json
{
  "slug": "new-unique-slug"
}
```
*Note: Slug must be unique*

### Success Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Collection 2024 - Updated",
  "slug": "summer-collection-2024",
  "description": "New description for the collection",
  "banner_image_url": "https://cdn.example.com/banners/summer-2024.jpg",
  "seo_title": "Summer Collection 2024 - Trendy Summer Fashion | Fashion Store",
  "seo_description": "Browse our curated summer collection featuring the latest trends in lightweight clothing, swimwear, and summer accessories.",
  "is_active": false,
  "created_at": "2024-12-08T10:00:00.000Z",
  "updated_at": "2024-12-08T11:30:00.000Z"
}
```

### Error Responses

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Collection with ID \"invalid-id\" not found",
  "error": "Not Found"
}
```

**409 Conflict - Slug Already Exists**
```json
{
  "statusCode": 409,
  "message": "Collection with slug \"existing-slug\" already exists",
  "error": "Conflict"
}
```

---

## Assign Products

### Endpoint
```
POST /collections/:id/products
```

### Request Body - Assign Multiple Products
```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001",
    "770e8400-e29b-41d4-a716-446655440002",
    "880e8400-e29b-41d4-a716-446655440003",
    "990e8400-e29b-41d4-a716-446655440004"
  ]
}
```

### Request Body - Assign Single Product
```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

### Request Body - Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| productIds | array | Yes | Minimum 1 item, each must be valid UUID |

### Success Response (200 OK)
```json
{
  "added": 4,
  "skipped": 1
}
```

**Response Fields:**
- `added`: Number of products successfully added to the collection
- `skipped`: Number of products already in the collection (duplicates)

### Success Response Examples

**All Products Added**
```json
{
  "added": 5,
  "skipped": 0
}
```

**Some Products Already Assigned**
```json
{
  "added": 3,
  "skipped": 2
}
```

**All Products Already Assigned**
```json
{
  "added": 0,
  "skipped": 5
}
```

### Error Responses

**400 Bad Request - Invalid Product IDs**
```json
{
  "statusCode": 400,
  "message": "Products not found: 550e8400-e29b-41d4-a716-446655440000, 660e8400-e29b-41d4-a716-446655440001",
  "error": "Bad Request"
}
```

**400 Bad Request - Invalid UUID Format**
```json
{
  "statusCode": 400,
  "message": [
    "each value in productIds must be a UUID"
  ],
  "error": "Bad Request"
}
```

**400 Bad Request - Empty Array**
```json
{
  "statusCode": 400,
  "message": [
    "productIds must contain at least 1 elements"
  ],
  "error": "Bad Request"
}
```

**404 Not Found - Collection Not Found**
```json
{
  "statusCode": 404,
  "message": "Collection with ID \"invalid-id\" not found",
  "error": "Not Found"
}
```

---

## Remove Products

### Endpoint
```
DELETE /collections/:id/products
```

### Request Body - Remove Multiple Products
```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

### Request Body - Remove Single Product
```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

### Success Response (200 OK)
```json
{
  "removed": 2
}
```

**Response Fields:**
- `removed`: Number of products successfully removed from the collection

### Success Response Examples

**All Products Removed**
```json
{
  "removed": 5
}
```

**Some Products Not in Collection**
```json
{
  "removed": 2
}
```
*Note: Products not in the collection are silently ignored*

**No Products Removed**
```json
{
  "removed": 0
}
```

### Error Responses

Same validation errors as Assign Products endpoint.

---

## Query Parameters

### List Collections

**Endpoint:** `GET /collections`

**Query Parameters:**

| Parameter | Type | Required | Default | Min | Max | Description |
|-----------|------|----------|---------|-----|-----|-------------|
| limit | integer | No | 20 | 1 | 100 | Number of items per page |
| cursor | string | No | - | - | - | Base64 cursor token for pagination |

**Example URLs:**
```
GET /collections
GET /collections?limit=10
GET /collections?limit=20&cursor=eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ==
```

### List Products in Collection

**Endpoint:** `GET /collections/:id/products`

**Query Parameters:**

Same as List Collections above.

**Example URLs:**
```
GET /collections/550e8400-e29b-41d4-a716-446655440000/products
GET /collections/550e8400-e29b-41d4-a716-446655440000/products?limit=50
GET /collections/550e8400-e29b-41d4-a716-446655440000/products?limit=20&cursor=eyJpZCI6IjQ1NiIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ==
```

---

## Response Formats

### Single Collection Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Collection 2024",
  "slug": "summer-collection-2024",
  "description": "Discover our latest summer fashion trends.",
  "banner_image_url": "https://cdn.example.com/banners/summer-2024.jpg",
  "seo_title": "Summer Collection 2024 - Trendy Summer Fashion",
  "seo_description": "Browse our curated summer collection.",
  "is_active": true,
  "created_at": "2024-12-08T10:00:00.000Z",
  "updated_at": "2024-12-08T10:00:00.000Z"
}
```

### Paginated Collections Response

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Summer Collection 2024",
      "slug": "summer-collection-2024",
      "description": "Discover our latest summer fashion trends.",
      "banner_image_url": "https://cdn.example.com/banners/summer-2024.jpg",
      "seo_title": "Summer Collection 2024 - Trendy Summer Fashion",
      "seo_description": "Browse our curated summer collection.",
      "is_active": true,
      "created_at": "2024-12-08T10:00:00.000Z",
      "updated_at": "2024-12-08T10:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Winter Essentials",
      "slug": "winter-essentials",
      "description": "Stay warm and stylish this winter.",
      "banner_image_url": "https://cdn.example.com/banners/winter-essentials.jpg",
      "seo_title": "Winter Essentials - Cozy Winter Fashion",
      "seo_description": "Shop our winter essentials collection.",
      "is_active": true,
      "created_at": "2024-12-08T09:30:00.000Z",
      "updated_at": "2024-12-08T09:30:00.000Z"
    }
  ],
  "nextCursor": "eyJpZCI6IjY2MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMSIsImNyZWF0ZWRfYXQiOiIyMDI0LTEyLTA4VDA5OjMwOjAwLjAwMFoifQ=="
}
```

**Response Fields:**
- `items`: Array of collection objects
- `nextCursor`: Base64 token for next page (null if last page)

### Paginated Products Response

```json
{
  "items": [
    {
      "id": "prod-550e8400-e29b-41d4-a716-446655440000",
      "name": {
        "en": "Premium Cotton T-Shirt",
        "vi": "Áo Thun Cotton Cao Cấp"
      },
      "slug": {
        "en": "premium-cotton-tshirt",
        "vi": "ao-thun-cotton-cao-cap"
      },
      "description": {
        "en": "High quality cotton t-shirt with modern design",
        "vi": "Áo thun cotton chất lượng cao với thiết kế hiện đại"
      },
      "short_description": {
        "en": "Comfortable premium cotton tee",
        "vi": "Áo thun cotton cao cấp thoải mái"
      },
      "price": 299000,
      "sale_price": 249000,
      "cost_price": 150000,
      "images": [
        "https://cdn.example.com/products/tshirt-1.jpg",
        "https://cdn.example.com/products/tshirt-2.jpg"
      ],
      "variants": [],
      "stock_quantity": 100,
      "sku": "TSHIRT-001",
      "barcode": "1234567890123",
      "tags": ["t-shirt", "cotton", "casual"],
      "status": "active",
      "is_featured": false,
      "enable_sale_tag": true,
      "meta_title": {
        "en": "Buy Premium Cotton T-Shirt | Fashion Store",
        "vi": "Mua Áo Thun Cotton Cao Cấp | Cửa Hàng Thời Trang"
      },
      "meta_description": {
        "en": "Shop premium cotton t-shirts at great prices",
        "vi": "Mua áo thun cotton cao cấp với giá tốt"
      },
      "weight": 0.2,
      "dimensions": {
        "length": 70,
        "width": 50,
        "height": 2
      },
      "category": {
        "id": "cat-123",
        "name": "T-Shirts",
        "slug": "t-shirts"
      },
      "created_at": "2024-12-01T10:00:00.000Z",
      "updated_at": "2024-12-01T10:00:00.000Z"
    }
  ],
  "nextCursor": "eyJpZCI6InByb2QtNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiY3JlYXRlZF9hdCI6IjIwMjQtMTItMDFUMTA6MDA6MDAuMDAwWiJ9"
}
```

### Product Count Response

**Endpoint:** `GET /collections/:id/products/count`

```json
15
```
*Note: Returns a plain number, not an object*

### Delete Response

**Endpoint:** `DELETE /collections/:id`

**Status Code:** `204 No Content`

**Response Body:** Empty (no content)

---

## Complete Workflow Example

### 1. Create a Collection
```bash
curl -X POST http://localhost:3000/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Flash Sale Weekend",
    "description": "Limited time deals this weekend only!"
  }'
```

**Response:**
```json
{
  "id": "abc-123",
  "name": "Flash Sale Weekend",
  "slug": "flash-sale-weekend",
  ...
}
```

### 2. Assign Products
```bash
curl -X POST http://localhost:3000/collections/abc-123/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productIds": ["prod-1", "prod-2", "prod-3"]
  }'
```

**Response:**
```json
{
  "added": 3,
  "skipped": 0
}
```

### 3. List Products
```bash
curl http://localhost:3000/collections/abc-123/products?limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "items": [...],
  "nextCursor": "eyJ..."
}
```

### 4. Update Collection
```bash
curl -X PATCH http://localhost:3000/collections/abc-123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "banner_image_url": "https://cdn.example.com/flash-sale.jpg",
    "is_active": true
  }'
```

### 5. Check Product Count
```bash
curl http://localhost:3000/collections/abc-123/products/count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
3
```

---

## Testing with Postman

### Import Collection

Create a Postman collection with these requests:

1. **Create Collection** - POST /collections
2. **List Collections** - GET /collections?limit=20
3. **Get Collection** - GET /collections/:id
4. **Get by Slug** - GET /collections/slug/:slug
5. **Update Collection** - PATCH /collections/:id
6. **Delete Collection** - DELETE /collections/:id
7. **Assign Products** - POST /collections/:id/products
8. **Remove Products** - DELETE /collections/:id/products
9. **List Products** - GET /collections/:id/products?limit=20
10. **Product Count** - GET /collections/:id/products/count

### Environment Variables

```json
{
  "baseUrl": "http://localhost:3000",
  "authToken": "YOUR_JWT_TOKEN",
  "collectionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Best Practices

1. **Always validate UUIDs** before sending requests
2. **Use appropriate page sizes** (20-50 recommended)
3. **Handle nextCursor = null** to detect end of pagination
4. **Batch product assignments** for better performance
5. **Cache collection data** on the frontend
6. **Use slugs in URLs** for SEO benefits
7. **Check product count** before pagination for UX
8. **Handle 404 errors** gracefully when collection not found
9. **Validate banner URLs** before submission
10. **Set is_active: false** for draft collections

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 409 Conflict | Slug already exists | Use different slug or let it auto-generate |
| 400 Bad Request | Invalid UUID | Verify product IDs are valid UUIDs |
| 404 Not Found | Collection doesn't exist | Check collection ID is correct |
| 400 Invalid cursor | Cursor token corrupted | Don't modify cursor tokens manually |
| 400 Validation | Missing required fields | Include "name" field |

---

For more information, see:
- [Collections API Documentation](./collections_api.md)
- [Quick Start Guide](./collections_quickstart.md)
- [Module README](../src/modules/collections/README.md)

