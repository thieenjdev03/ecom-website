# Products Filter by Collection

## Overview

The Products API now supports filtering products by collection ID. This allows you to retrieve all products that belong to a specific collection using the standard products endpoint.

## Feature Update

### What's New

Added `collection_id` query parameter to the products list endpoint, enabling:
- ✅ Filter products by collection
- ✅ Combine with other filters (category, status, search, etc.)
- ✅ Use standard pagination (offset-based)
- ✅ Get enriched product data with category, variants, colors, sizes

### Benefits

1. **Flexibility**: Use either `/collections/:id/products` (cursor pagination) or `/products?collection_id=xxx` (offset pagination)
2. **Filtering**: Combine collection filter with other product filters
3. **Consistency**: Uses the same product response format across all endpoints
4. **Performance**: Efficient JOIN query with proper indexing

---

## API Documentation

### Endpoint

```
GET /products
```

### New Query Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| collection_id | UUID | No | Filter products by collection ID |

### All Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| collection_id | UUID | No | - | Filter by collection ID |
| category_id | UUID | No | - | Filter by category ID |
| status | enum | No | - | Filter by status (active, draft, out_of_stock, discontinued) |
| is_featured | boolean | No | - | Filter featured products |
| enable_sale_tag | boolean | No | - | Filter products with sale tag |
| search | string | No | - | Search in product name and description |
| page | number | No | 1 | Page number (min: 1) |
| limit | number | No | 20 | Items per page (min: 1, max: 100) |
| sort_by | enum | No | created_at | Sort field (created_at, updated_at, name, price, status) |
| sort_order | enum | No | DESC | Sort order (ASC, DESC) |
| locale | string | No | en | Language locale (en, vi) |

---

## Examples

### Example 1: Get Products in a Collection

```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "prod-uuid-1",
      "name": "Premium Cotton T-Shirt",
      "slug": "premium-cotton-tshirt",
      "price": 299000,
      "sale_price": 249000,
      "images": ["https://cdn.example.com/tshirt.jpg"],
      "status": "active",
      "is_featured": false,
      "category": {
        "id": "cat-123",
        "name": "T-Shirts",
        "slug": "t-shirts"
      },
      "created_at": "2024-12-01T10:00:00.000Z",
      "updated_at": "2024-12-01T10:00:00.000Z"
    }
    // ... more products
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Example 2: Filter Collection Products by Category

```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&category_id=cat-123
```

Get products that are both in the collection AND in a specific category.

### Example 3: Filter Collection Products by Status

```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&status=active
```

Get only active products in the collection.

### Example 4: Search Within Collection

```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&search=shirt
```

Search for products containing "shirt" within the collection.

### Example 5: Get Featured Products in Collection

```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&is_featured=true
```

Get only featured products in the collection.

### Example 6: Combined Filters

```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&category_id=cat-123&status=active&is_featured=true&sort_by=price&sort_order=ASC
```

Get active, featured products in both the collection and category, sorted by price ascending.

---

## Use Cases

### Frontend - Collection Page with Filters

```typescript
interface ProductFilters {
  collectionId: string;
  categoryId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

async function loadCollectionProducts(filters: ProductFilters) {
  const params = new URLSearchParams({
    collection_id: filters.collectionId,
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 20).toString(),
  });
  
  if (filters.categoryId) params.append('category_id', filters.categoryId);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  
  const response = await fetch(`/api/products?${params}`);
  return response.json();
}

// Usage
const data = await loadCollectionProducts({
  collectionId: 'collection-uuid',
  categoryId: 'category-uuid',
  status: 'active',
  page: 1,
  limit: 24
});
```

### React Component - Collection with Filters

```tsx
import { useState, useEffect } from 'react';

function CollectionProductsPage({ collectionId }) {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: null,
    search: '',
    page: 1
  });
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [collectionId, filters]);

  const loadProducts = async () => {
    const params = new URLSearchParams({
      collection_id: collectionId,
      page: filters.page.toString(),
      limit: '24'
    });
    
    if (filters.categoryId) params.append('category_id', filters.categoryId);
    if (filters.search) params.append('search', filters.search);
    
    const response = await fetch(`/api/products?${params}`);
    const data = await response.json();
    
    setProducts(data.data);
    setMeta(data.meta);
  };

  const handleCategoryFilter = (categoryId) => {
    setFilters(prev => ({ ...prev, categoryId, page: 1 }));
  };

  const handleSearch = (search) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select onChange={(e) => handleCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="cat-1">T-Shirts</option>
          <option value="cat-2">Jeans</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {meta && (
        <Pagination
          current={meta.page}
          total={meta.totalPages}
          onChange={handlePageChange}
        />
      )}
    </div>
  );
}
```

### Vue Component - Collection with Filters

```vue
<template>
  <div class="collection-products">
    <!-- Filters -->
    <div class="filters">
      <input
        v-model="search"
        type="text"
        placeholder="Search products..."
        @input="handleSearch"
      />
      <select v-model="selectedCategory" @change="handleCategoryChange">
        <option value="">All Categories</option>
        <option value="cat-1">T-Shirts</option>
        <option value="cat-2">Jeans</option>
      </select>
    </div>

    <!-- Products Grid -->
    <div class="products-grid">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="meta"
      :current="meta.page"
      :total="meta.totalPages"
      @change="handlePageChange"
    />
  </div>
</template>

<script>
export default {
  props: {
    collectionId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      products: [],
      meta: null,
      search: '',
      selectedCategory: '',
      currentPage: 1
    }
  },
  watch: {
    collectionId: 'loadProducts'
  },
  mounted() {
    this.loadProducts();
  },
  methods: {
    async loadProducts() {
      const params = new URLSearchParams({
        collection_id: this.collectionId,
        page: this.currentPage.toString(),
        limit: '24'
      });
      
      if (this.selectedCategory) {
        params.append('category_id', this.selectedCategory);
      }
      if (this.search) {
        params.append('search', this.search);
      }
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      this.products = data.data;
      this.meta = data.meta;
    },
    handleSearch() {
      this.currentPage = 1;
      this.loadProducts();
    },
    handleCategoryChange() {
      this.currentPage = 1;
      this.loadProducts();
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.loadProducts();
    }
  }
}
</script>
```

---

## Comparison: Two Ways to Get Collection Products

### Option 1: Collections Endpoint (Cursor Pagination)

```bash
GET /collections/:id/products?limit=20&cursor=xxx
```

**Best For:**
- ✅ Infinite scroll
- ✅ Real-time data
- ✅ Large datasets
- ✅ Mobile apps

**Features:**
- Cursor-based pagination
- Consistent results
- No duplicate/skipped items
- Efficient for large datasets

### Option 2: Products Endpoint (Offset Pagination)

```bash
GET /products?collection_id=xxx&page=1&limit=20
```

**Best For:**
- ✅ Traditional pagination
- ✅ Jump to specific page
- ✅ Show total pages
- ✅ Combined filters

**Features:**
- Offset-based pagination
- Can combine with other filters
- Can jump to any page
- Shows total count

### Which One to Use?

| Scenario | Recommended Endpoint |
|----------|---------------------|
| Infinite scroll | `/collections/:id/products` |
| Page numbers (1, 2, 3...) | `/products?collection_id=xxx` |
| Need to filter by category | `/products?collection_id=xxx&category_id=yyy` |
| Need to search | `/products?collection_id=xxx&search=keyword` |
| Need multiple filters | `/products?collection_id=xxx&...` |
| Simple list | Either works |

---

## Technical Details

### Database Query

When `collection_id` is provided, the query joins with the `product_collections` table:

```sql
SELECT product.*
FROM products product
LEFT JOIN categories category ON category.id = product.category_id
INNER JOIN product_collections pc ON pc.product_id = product.id
WHERE product.deleted_at IS NULL
  AND pc.collection_id = :collection_id
  -- ... other filters
ORDER BY product.created_at DESC
LIMIT 20 OFFSET 0;
```

### Performance

- ✅ Uses existing indexes on `product_collections`
- ✅ INNER JOIN for efficient filtering
- ✅ Query plan optimized for collection filters
- ✅ Works well with other filters

### Indexes Used

```sql
-- Primary index for collection filtering
CREATE INDEX idx_product_collections_collection_id 
ON product_collections(collection_id);

-- Composite index for product lookup
CREATE INDEX idx_product_collections_collection_product 
ON product_collections(collection_id, product_id);

-- Product indexes
CREATE INDEX idx_products_created_at_id 
ON products(created_at DESC, id DESC);
```

---

## Testing

### Test 1: Basic Collection Filter

```bash
curl -X GET "http://localhost:3000/products?collection_id=550e8400-e29b-41d4-a716-446655440000&limit=10"
```

**Expected:**
- Returns products in the collection
- Max 10 items
- Has meta with pagination info

### Test 2: Collection + Category Filter

```bash
curl -X GET "http://localhost:3000/products?collection_id=550e8400-e29b-41d4-a716-446655440000&category_id=cat-123"
```

**Expected:**
- Returns products that are in BOTH the collection AND the category

### Test 3: Collection + Search

```bash
curl -X GET "http://localhost:3000/products?collection_id=550e8400-e29b-41d4-a716-446655440000&search=shirt"
```

**Expected:**
- Returns products in collection that match "shirt"

### Test 4: Pagination

```bash
curl -X GET "http://localhost:3000/products?collection_id=550e8400-e29b-41d4-a716-446655440000&page=2&limit=20"
```

**Expected:**
- Returns page 2 of results
- Skip first 20 items

### Test 5: Invalid Collection ID

```bash
curl -X GET "http://localhost:3000/products?collection_id=invalid-uuid"
```

**Expected:**
- 400 Bad Request (invalid UUID format)

---

## Error Handling

### Invalid UUID Format

**Request:**
```bash
GET /products?collection_id=not-a-uuid
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": [
    "collection_id must be a UUID"
  ],
  "error": "Bad Request"
}
```

### Collection Not Found

Products endpoint doesn't validate if collection exists - it will simply return empty results if no products are found.

**Request:**
```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440999
```

**Response (200):**
```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

---

## Best Practices

1. **Use Appropriate Pagination:**
   - Use cursor pagination (`/collections/:id/products`) for infinite scroll
   - Use offset pagination (`/products?collection_id=xxx`) for page numbers

2. **Combine Filters Wisely:**
   - Collection + Category: Show specific product types in collection
   - Collection + Search: Search within collection
   - Collection + Status: Filter by product availability

3. **Cache Results:**
   - Collection products don't change frequently
   - Cache on frontend for better UX
   - Consider ETags or Last-Modified headers

4. **Handle Empty Results:**
   - Show appropriate message when no products found
   - Suggest removing filters
   - Show related collections

5. **Performance Tips:**
   - Use reasonable page sizes (20-50)
   - Don't fetch all products at once
   - Consider lazy loading images

---

## Migration Notes

### Breaking Changes

None - this is a backward-compatible addition.

### Database Changes

No migration required - uses existing `product_collections` table and indexes.

### Code Changes

**Modified Files:**
1. `src/modules/products/dto/query-product.dto.ts` - Added `collection_id` parameter
2. `src/modules/products/products.service.ts` - Added collection filtering logic

**No changes required to:**
- Controllers
- Entities
- Routes
- Migrations

---

## FAQ

### Q: What's the difference between this and `/collections/:id/products`?

**A:** 
- `/collections/:id/products` - Cursor pagination, dedicated endpoint
- `/products?collection_id=xxx` - Offset pagination, can combine with other filters

### Q: Can I filter by multiple collections?

**A:** No, currently only one collection at a time. To get products from multiple collections, make separate requests.

### Q: Does this affect performance?

**A:** No, the INNER JOIN is efficient with proper indexes. Performance is similar to category filtering.

### Q: Can I use this with other filters?

**A:** Yes! You can combine with category_id, status, search, is_featured, etc.

### Q: Which pagination should I use?

**A:** 
- **Cursor** (`/collections/:id/products`) for infinite scroll
- **Offset** (`/products?collection_id=xxx`) for page numbers

### Q: Will empty results return 404?

**A:** No, it returns 200 with empty array. Use `/collections/:id` to verify collection exists.

---

## Related Documentation

- [Collections API Documentation](./collections_api.md)
- [Collections API Payloads](./collections_api_payloads.md)
- [Products API Documentation](./api_products.md)
- [Collections Module README](../src/modules/collections/README.md)

---

**Last Updated:** December 8, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

