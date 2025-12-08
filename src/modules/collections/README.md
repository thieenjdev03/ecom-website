# Collections Module

## Overview

The Collections module provides a complete implementation of product collections with many-to-many relationships, CRUD operations, and cursor-based pagination.

## Features

- ✅ Full CRUD operations for collections
- ✅ Many-to-many relationship between products and collections
- ✅ Product assignment and removal from collections
- ✅ Cursor-based pagination for collections listing
- ✅ Cursor-based pagination for products within collections
- ✅ Auto-generated slugs with uniqueness validation
- ✅ Comprehensive error handling and validation
- ✅ Full TypeScript typing and documentation

## Database Schema

### Collections Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Collection name (required) |
| slug | VARCHAR(255) | Unique URL-friendly identifier |
| description | TEXT | Collection description (optional) |
| banner_image_url | VARCHAR(500) | Banner image URL (optional) |
| seo_title | VARCHAR(255) | SEO title (optional) |
| seo_description | TEXT | SEO description (optional) |
| is_active | BOOLEAN | Active status (default: true) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Product Collections Junction Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Foreign key to products |
| collection_id | UUID | Foreign key to collections |
| created_at | TIMESTAMP | Assignment timestamp |

**Constraints:**
- Unique constraint on (product_id, collection_id)
- CASCADE delete on both foreign keys

## API Endpoints

### Collections CRUD

#### Create Collection
```http
POST /collections
Content-Type: application/json

{
  "name": "Summer Collection 2024",
  "slug": "summer-collection-2024",  // Optional, auto-generated if not provided
  "description": "Discover our latest summer fashion collection",
  "banner_image_url": "https://example.com/banner.jpg",
  "seo_title": "Summer Collection 2024 - Fashion Store",
  "seo_description": "Browse our curated summer collection",
  "is_active": true
}
```

#### Get All Collections (with cursor pagination)
```http
GET /collections?limit=20&cursor=<base64_token>
```

Response:
```json
{
  "items": [...],
  "nextCursor": "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ=="
}
```

#### Get Collection by ID
```http
GET /collections/:id
```

#### Get Collection by Slug
```http
GET /collections/slug/:slug
```

#### Update Collection
```http
PATCH /collections/:id
Content-Type: application/json

{
  "name": "Updated Collection Name",
  "is_active": false
}
```

#### Delete Collection
```http
DELETE /collections/:id
```

### Product Assignment

#### Assign Products to Collection
```http
POST /collections/:id/products
Content-Type: application/json

{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

Response:
```json
{
  "added": 2,
  "skipped": 0
}
```

#### Remove Products from Collection
```http
DELETE /collections/:id/products
Content-Type: application/json

{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

Response:
```json
{
  "removed": 1
}
```

#### Get Products in Collection (with cursor pagination)
```http
GET /collections/:id/products?limit=20&cursor=<base64_token>
```

Response:
```json
{
  "items": [...],
  "nextCursor": "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ=="
}
```

#### Get Product Count in Collection
```http
GET /collections/:id/products/count
```

## Cursor-Based Pagination

### How It Works

Cursor-based pagination uses tuple comparison for efficient, consistent pagination:

1. **Sorting**: Results are ordered by `(created_at DESC, id DESC)`
2. **Cursor Token**: Base64-encoded JSON containing `{id, created_at}`
3. **Query**: Uses tuple comparison: `(created_at, id) < (cursor.created_at, cursor.id)`

### Benefits

- ✅ Consistent results (no duplicates/skipped items)
- ✅ Efficient database queries with composite indexes
- ✅ Works well with real-time data
- ✅ No offset calculation overhead

### Example Usage

```typescript
// First request (no cursor)
GET /collections?limit=20

// Response
{
  "items": [...20 items...],
  "nextCursor": "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ=="
}

// Next page request
GET /collections?limit=20&cursor=eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ==

// Response
{
  "items": [...20 items...],
  "nextCursor": "..." // or null if no more pages
}
```

## Validation

### Collection Creation/Update

- `name`: Required, max 255 characters
- `slug`: Optional (auto-generated), unique, max 255 characters
- `description`: Optional, text
- `banner_image_url`: Optional, max 500 characters
- `seo_title`: Optional, max 255 characters
- `seo_description`: Optional, text
- `is_active`: Optional, boolean (default: true)

### Product Assignment

- `productIds`: Required, array of valid UUIDs, minimum 1 item
- All product IDs must exist in the database
- Duplicate assignments are automatically skipped

## Error Handling

The module provides comprehensive error handling:

| Error | Status Code | Description |
|-------|-------------|-------------|
| Collection not found | 404 | Collection ID/slug doesn't exist |
| Duplicate slug | 409 | Slug already exists |
| Invalid cursor | 400 | Malformed cursor token |
| Product not found | 400 | One or more product IDs invalid |
| Validation error | 400 | Invalid request data |

## Database Indexes

The following indexes are automatically created by the migration:

```sql
-- Collections table
CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_active ON collections(is_active) WHERE is_active = true;
CREATE INDEX idx_collections_created_at_id ON collections(created_at DESC, id DESC);

-- Product collections table
CREATE INDEX idx_product_collections_product_id ON product_collections(product_id);
CREATE INDEX idx_product_collections_collection_id ON product_collections(collection_id);
CREATE INDEX idx_product_collections_collection_product ON product_collections(collection_id, product_id);

-- Products table (for cursor pagination)
CREATE INDEX idx_products_created_at_id ON products(created_at DESC, id DESC);
```

## Module Structure

```
collections/
├── entities/
│   ├── collection.entity.ts           # Collection entity definition
│   └── product-collection.entity.ts   # Junction table entity
├── dto/
│   ├── create-collection.dto.ts       # Create collection validation
│   ├── update-collection.dto.ts       # Update collection validation
│   ├── assign-products.dto.ts         # Product assignment validation
│   └── query-collection.dto.ts        # Pagination query validation
├── helpers/
│   └── cursor-pagination.helper.ts    # Cursor encode/decode utilities
├── collections.service.ts              # Business logic
├── collections.controller.ts           # API endpoints
├── collections.module.ts               # Module definition
└── README.md                           # This file
```

## Usage Examples

### Frontend Integration

```typescript
// Fetch collections with pagination
async function fetchCollections(cursor?: string) {
  const params = new URLSearchParams({ limit: '20' });
  if (cursor) params.append('cursor', cursor);
  
  const response = await fetch(`/api/collections?${params}`);
  return response.json();
}

// Load first page
const firstPage = await fetchCollections();
console.log(firstPage.items);

// Load next page
if (firstPage.nextCursor) {
  const secondPage = await fetchCollections(firstPage.nextCursor);
  console.log(secondPage.items);
}

// Fetch products in a collection
async function fetchCollectionProducts(collectionId: string, cursor?: string) {
  const params = new URLSearchParams({ limit: '20' });
  if (cursor) params.append('cursor', cursor);
  
  const response = await fetch(`/api/collections/${collectionId}/products?${params}`);
  return response.json();
}
```

### Testing with cURL

```bash
# Create a collection
curl -X POST http://localhost:3000/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Winter Collection",
    "description": "Cozy winter fashion"
  }'

# Get collections
curl http://localhost:3000/collections?limit=10

# Assign products
curl -X POST http://localhost:3000/collections/{id}/products \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["uuid1", "uuid2"]
  }'

# Get products in collection
curl http://localhost:3000/collections/{id}/products?limit=20
```

## Running Migrations

To apply the collections module migration:

```bash
npm run migration:run
```

To revert:

```bash
npm run migration:revert
```

## Best Practices

1. **Always use cursor pagination** for large datasets instead of offset-based pagination
2. **Validate product IDs** before assignment to provide better error messages
3. **Use slugs for frontend URLs** instead of UUIDs for SEO benefits
4. **Cache collection data** on the frontend to reduce API calls
5. **Handle nextCursor = null** to detect the end of pagination

## Performance Considerations

- Composite indexes on `(created_at, id)` enable efficient tuple comparison
- Junction table has indexes on both foreign keys for fast lookups
- Cursor pagination avoids expensive OFFSET queries
- Batch product assignments in a single request when possible

## Future Enhancements

Possible future improvements:

- [ ] Collection ordering/priority
- [ ] Collection nesting (parent-child relationships)
- [ ] Product ordering within collections
- [ ] Collection-specific product metadata
- [ ] Multi-language support for collection names/descriptions
- [ ] Collection visibility (public/private)
- [ ] Scheduled collection activation/deactivation

