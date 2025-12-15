# Collections API - Quick Reference Card

## 🚀 Quick Start

```bash
# 1. Run migration
npm run migration:run

# 2. Seed data
npm run seed:collections

# 3. Start server
npm run start:dev
```

---

## 📌 All Endpoints

### Collections CRUD

```bash
# Create
POST /collections
Body: { "name": "Collection Name" }

# List (cursor pagination)
GET /collections?limit=20&cursor=xxx

# Get by ID
GET /collections/:id

# Get by slug
GET /collections/slug/:slug

# Update
PATCH /collections/:id
Body: { "name": "New Name" }

# Delete
DELETE /collections/:id
```

### Product Management

```bash
# Assign products
POST /collections/:id/products
Body: { "productIds": ["uuid1", "uuid2"] }

# Remove products
DELETE /collections/:id/products
Body: { "productIds": ["uuid1"] }

# List products (cursor)
GET /collections/:id/products?limit=20&cursor=xxx

# List products (offset) - NEW!
GET /products?collection_id=:id&page=1&limit=20

# Product count
GET /collections/:id/products/count
```

---

## 🎯 Two Ways to Get Products

### Option 1: Cursor Pagination
```bash
GET /collections/:id/products?limit=20&cursor=xxx
```
✅ Best for: Infinite scroll, mobile apps, real-time data

### Option 2: Offset Pagination (NEW!)
```bash
GET /products?collection_id=:id&page=1&limit=20
```
✅ Best for: Page numbers, filters, traditional pagination

---

## 🔍 Filter Examples

```bash
# By collection only
GET /products?collection_id=xxx

# Collection + category
GET /products?collection_id=xxx&category_id=yyy

# Collection + search
GET /products?collection_id=xxx&search=shirt

# Collection + status
GET /products?collection_id=xxx&status=active

# Collection + featured
GET /products?collection_id=xxx&is_featured=true

# Multiple filters
GET /products?collection_id=xxx&category_id=yyy&status=active&search=polo&page=2
```

---

## 💻 Frontend Examples

### React - Load Products with Filters

```tsx
const loadProducts = async (collectionId, filters) => {
  const params = new URLSearchParams({
    collection_id: collectionId,
    page: filters.page || '1',
    limit: '24'
  });
  
  if (filters.categoryId) params.append('category_id', filters.categoryId);
  if (filters.search) params.append('search', filters.search);
  
  const res = await fetch(`/api/products?${params}`);
  return res.json();
};
```

### Vue - Infinite Scroll

```vue
<script>
async loadMore() {
  const params = new URLSearchParams({ limit: '20' });
  if (this.cursor) params.append('cursor', this.cursor);
  
  const res = await fetch(`/api/collections/${this.id}/products?${params}`);
  const data = await res.json();
  
  this.products.push(...data.items);
  this.cursor = data.nextCursor;
}
</script>
```

---

## 📝 Request Bodies

### Create Collection

**Minimum:**
```json
{
  "name": "Collection Name"
}
```

**Full:**
```json
{
  "name": "Summer 2024",
  "slug": "summer-2024",
  "description": "Hot summer items",
  "banner_image_url": "https://cdn.example.com/banner.jpg",
  "seo_title": "Summer Collection 2024",
  "seo_description": "Shop summer fashion",
  "is_active": true
}
```

### Assign Products

```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

---

## 📊 Response Formats

### Single Collection

```json
{
  "id": "uuid",
  "name": "Collection Name",
  "slug": "collection-name",
  "description": "...",
  "banner_image_url": "...",
  "is_active": true,
  "created_at": "2024-12-08T10:00:00.000Z",
  "updated_at": "2024-12-08T10:00:00.000Z"
}
```

### Cursor Pagination

```json
{
  "items": [...],
  "nextCursor": "eyJ..." // or null
}
```

### Offset Pagination

```json
{
  "data": [...],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Product Assignment

```json
{
  "added": 3,
  "skipped": 1
}
```

---

## 🐛 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 409 Conflict | Slug exists | Use different slug |
| 400 Bad Request | Invalid UUID | Check UUID format |
| 404 Not Found | Collection missing | Verify collection ID |
| 400 Validation | Missing fields | Include required fields |

---

## 🔗 Documentation Links

- Full API: `/docs/collections_api.md`
- Payloads: `/docs/collections_api_payloads.md`
- Filter Feature: `/docs/products_filter_by_collection.md`
- Quick Start: `/docs/collections_quickstart.md`

---

## ⚡ Quick Tips

1. **Pagination Choice:**
   - Infinite scroll → Use cursor
   - Page numbers → Use offset

2. **Filtering:**
   - Need filters → Use `/products?collection_id=xxx`
   - Simple list → Use `/collections/:id/products`

3. **Slugs:**
   - Auto-generated from name
   - Use in URLs for SEO

4. **Caching:**
   - Collections change rarely
   - Cache on frontend

5. **Performance:**
   - Use limit 20-50
   - Don't fetch all at once

---

## 🎯 When to Use What

| Need | Use |
|------|-----|
| Infinite scroll | `/collections/:id/products` |
| Page numbers | `/products?collection_id=xxx` |
| Filter by category | `/products?collection_id=xxx&category_id=yyy` |
| Search products | `/products?collection_id=xxx&search=keyword` |
| Multiple filters | `/products?collection_id=xxx&...` |
| Simple list | Either endpoint works |

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** December 8, 2025

