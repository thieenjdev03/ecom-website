# Collections API Documentation

## Overview

The Collections API provides endpoints for managing product collections with cursor-based pagination. Collections allow you to group products together for marketing, seasonal campaigns, or product curation.

## Base URL

```
/api/collections
```

## Authentication

All endpoints require authentication unless specified otherwise. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Create Collection

Create a new collection.

**Endpoint:** `POST /collections`

**Request Body:**

```json
{
  "name": "Summer Collection 2024",
  "slug": "summer-collection-2024",
  "description": "Discover our latest summer fashion collection",
  "banner_image_url": "https://example.com/banner.jpg",
  "seo_title": "Summer Collection 2024 - Fashion Store",
  "seo_description": "Browse our curated summer collection with the latest trends",
  "is_active": true
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Collection name (max 255 chars) |
| slug | string | No | URL-friendly identifier (auto-generated if not provided) |
| description | text | No | Collection description |
| banner_image_url | string | No | Banner image URL (max 500 chars) |
| seo_title | string | No | SEO title (max 255 chars) |
| seo_description | text | No | SEO description |
| is_active | boolean | No | Active status (default: true) |

**Success Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Collection 2024",
  "slug": "summer-collection-2024",
  "description": "Discover our latest summer fashion collection",
  "banner_image_url": "https://example.com/banner.jpg",
  "seo_title": "Summer Collection 2024 - Fashion Store",
  "seo_description": "Browse our curated summer collection with the latest trends",
  "is_active": true,
  "created_at": "2024-12-08T10:00:00.000Z",
  "updated_at": "2024-12-08T10:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input data
- `409 Conflict`: Slug already exists

---

### 2. List Collections (Cursor Pagination)

Get all collections with cursor-based pagination.

**Endpoint:** `GET /collections`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | No | 20 | Number of items per page (1-100) |
| cursor | string | No | - | Cursor token for next page |

**Example Request:**

```
GET /collections?limit=20
GET /collections?limit=20&cursor=eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ==
```

**Success Response (200 OK):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Summer Collection 2024",
      "slug": "summer-collection-2024",
      "description": "Discover our latest summer fashion collection",
      "banner_image_url": "https://example.com/banner.jpg",
      "seo_title": "Summer Collection 2024 - Fashion Store",
      "seo_description": "Browse our curated summer collection",
      "is_active": true,
      "created_at": "2024-12-08T10:00:00.000Z",
      "updated_at": "2024-12-08T10:00:00.000Z"
    }
  ],
  "nextCursor": "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ=="
}
```

**Notes:**
- `nextCursor` will be `null` when there are no more pages
- Results are sorted by `created_at DESC, id DESC`

---

### 3. Get Collection by ID

Get a single collection by its ID.

**Endpoint:** `GET /collections/:id`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Collection ID |

**Example Request:**

```
GET /collections/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Collection 2024",
  "slug": "summer-collection-2024",
  "description": "Discover our latest summer fashion collection",
  "banner_image_url": "https://example.com/banner.jpg",
  "seo_title": "Summer Collection 2024 - Fashion Store",
  "seo_description": "Browse our curated summer collection",
  "is_active": true,
  "created_at": "2024-12-08T10:00:00.000Z",
  "updated_at": "2024-12-08T10:00:00.000Z"
}
```

**Error Response:**

- `404 Not Found`: Collection not found

---

### 4. Get Collection by Slug

Get a single collection by its slug (SEO-friendly URL).

**Endpoint:** `GET /collections/slug/:slug`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Collection slug |

**Example Request:**

```
GET /collections/slug/summer-collection-2024
```

**Success Response (200 OK):**

Same as Get Collection by ID

**Error Response:**

- `404 Not Found`: Collection not found

---

### 5. Update Collection

Update an existing collection.

**Endpoint:** `PATCH /collections/:id`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Collection ID |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "Updated Collection Name",
  "description": "Updated description",
  "is_active": false
}
```

**Success Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Collection Name",
  "slug": "summer-collection-2024",
  "description": "Updated description",
  "banner_image_url": "https://example.com/banner.jpg",
  "seo_title": "Summer Collection 2024 - Fashion Store",
  "seo_description": "Browse our curated summer collection",
  "is_active": false,
  "created_at": "2024-12-08T10:00:00.000Z",
  "updated_at": "2024-12-08T11:30:00.000Z"
}
```

**Error Responses:**

- `404 Not Found`: Collection not found
- `409 Conflict`: New slug already exists

---

### 6. Delete Collection

Delete a collection. This will also remove all product associations.

**Endpoint:** `DELETE /collections/:id`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Collection ID |

**Success Response (204 No Content):**

No response body

**Error Response:**

- `404 Not Found`: Collection not found

---

### 7. Assign Products to Collection

Add products to a collection. Products already in the collection will be skipped.

**Endpoint:** `POST /collections/:id/products`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Collection ID |

**Request Body:**

```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001",
    "770e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productIds | array | Yes | Array of product UUIDs (minimum 1) |

**Success Response (200 OK):**

```json
{
  "added": 2,
  "skipped": 1
}
```

**Response Fields:**

| Field | Description |
|-------|-------------|
| added | Number of products successfully added |
| skipped | Number of products already in collection |

**Error Responses:**

- `400 Bad Request`: Invalid product IDs or products not found
- `404 Not Found`: Collection not found

---

### 8. Remove Products from Collection

Remove products from a collection.

**Endpoint:** `DELETE /collections/:id/products`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Collection ID |

**Request Body:**

```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**Success Response (200 OK):**

```json
{
  "removed": 2
}
```

**Error Response:**

- `404 Not Found`: Collection not found

---

### 9. Get Products in Collection (Cursor Pagination)

Get all products in a collection with cursor-based pagination.

**Endpoint:** `GET /collections/:id/products`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Collection ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | No | 20 | Number of items per page (1-100) |
| cursor | string | No | - | Cursor token for next page |

**Example Request:**

```
GET /collections/550e8400-e29b-41d4-a716-446655440000/products?limit=20
GET /collections/550e8400-e29b-41d4-a716-446655440000/products?limit=20&cursor=eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ==
```

**Success Response (200 OK):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": {
        "en": "Premium Polo Shirt",
        "vi": "Áo Polo Cao Cấp"
      },
      "slug": {
        "en": "premium-polo-shirt",
        "vi": "ao-polo-cao-cap"
      },
      "price": 399000,
      "sale_price": 349000,
      "images": ["https://example.com/image1.jpg"],
      "category": {
        "id": "cat-123",
        "name": "Shirts",
        "slug": "shirts"
      },
      "status": "active",
      "is_featured": false,
      "created_at": "2024-12-01T10:00:00.000Z",
      "updated_at": "2024-12-01T10:00:00.000Z"
    }
  ],
  "nextCursor": "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ=="
}
```

**Notes:**
- Products include full product details with category relations
- Soft-deleted products are excluded
- Results are sorted by `product.created_at DESC, product.id DESC`

**Error Response:**

- `404 Not Found`: Collection not found

---

### 10. Get Product Count in Collection

Get the total number of products in a collection.

**Endpoint:** `GET /collections/:id/products/count`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Collection ID |

**Example Request:**

```
GET /collections/550e8400-e29b-41d4-a716-446655440000/products/count
```

**Success Response (200 OK):**

```json
15
```

**Error Response:**

- `404 Not Found`: Collection not found

---

## Cursor Pagination

### Overview

The Collections API uses cursor-based pagination for efficient and consistent results. Unlike offset-based pagination, cursor pagination:

- ✅ Provides consistent results even when data changes
- ✅ Is more efficient for large datasets
- ✅ Avoids duplicate or skipped items
- ✅ Works well with real-time data

### How It Works

1. Make initial request without cursor:
```
GET /collections?limit=20
```

2. Server returns items and a `nextCursor`:
```json
{
  "items": [...],
  "nextCursor": "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ=="
}
```

3. Make next request with the cursor:
```
GET /collections?limit=20&cursor=eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ==
```

4. Repeat until `nextCursor` is `null`

### Frontend Implementation Example

```javascript
// React example with infinite scroll
import { useState, useEffect } from 'react';

function CollectionsList() {
  const [collections, setCollections] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadCollections = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (cursor) params.append('cursor', cursor);
      
      const response = await fetch(`/api/collections?${params}`);
      const data = await response.json();
      
      setCollections(prev => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  return (
    <div>
      {collections.map(collection => (
        <div key={collection.id}>{collection.name}</div>
      ))}
      {hasMore && (
        <button onClick={loadCollections} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

### Common Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid input data or malformed cursor |
| 404 | Not Found | Collection or product not found |
| 409 | Conflict | Slug already exists |
| 500 | Internal Server Error | Server error (contact support) |

## Rate Limiting

- Standard rate limits apply (documented in main API docs)
- Cursor pagination is more efficient than offset pagination for high-volume requests

## Best Practices

1. **Use appropriate page sizes**: 20-50 items per page is recommended
2. **Cache collection data**: Collections don't change frequently
3. **Use slugs in URLs**: Better for SEO than UUIDs
4. **Handle nextCursor = null**: Indicates no more data
5. **Batch product assignments**: Add multiple products in one request
6. **Error handling**: Always handle 404 and 400 errors gracefully

## Examples

### Complete Workflow Example

```bash
# 1. Create a collection
curl -X POST http://localhost:3000/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Winter Essentials",
    "description": "Must-have items for winter"
  }'

# Response: { "id": "abc-123", ... }

# 2. Assign products to collection
curl -X POST http://localhost:3000/collections/abc-123/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productIds": ["prod-1", "prod-2", "prod-3"]
  }'

# Response: { "added": 3, "skipped": 0 }

# 3. Get products in collection
curl http://localhost:3000/collections/abc-123/products?limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Update collection
curl -X PATCH http://localhost:3000/collections/abc-123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "is_active": true
  }'
```

## Support

For additional help or questions about the Collections API:

- Check the main API documentation
- Review the module README: `/src/modules/collections/README.md`
- Contact the development team

