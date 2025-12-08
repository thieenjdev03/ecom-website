# Collections Module - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Run Migration

```bash
npm run migration:run
```

This creates the `collections` and `product_collections` tables with all necessary indexes.

### Step 2: Start the Server

```bash
npm run start:dev
```

Server will start at `http://localhost:3000`

### Step 3: Test the API

#### Create a Collection

```bash
curl -X POST http://localhost:3000/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Collection",
    "description": "Hot summer items"
  }'
```

**Response:**
```json
{
  "id": "abc-123-uuid",
  "name": "Summer Collection",
  "slug": "summer-collection",
  "description": "Hot summer items",
  "is_active": true,
  "created_at": "2024-12-08T10:00:00.000Z",
  "updated_at": "2024-12-08T10:00:00.000Z"
}
```

#### List Collections

```bash
curl http://localhost:3000/collections?limit=10
```

**Response:**
```json
{
  "items": [...],
  "nextCursor": "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ=="
}
```

#### Assign Products to Collection

First, get some product IDs from your products table, then:

```bash
curl -X POST http://localhost:3000/collections/abc-123-uuid/products \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["product-uuid-1", "product-uuid-2"]
  }'
```

**Response:**
```json
{
  "added": 2,
  "skipped": 0
}
```

#### Get Products in Collection

```bash
curl http://localhost:3000/collections/abc-123-uuid/products?limit=20
```

**Response:**
```json
{
  "items": [
    {
      "id": "product-uuid-1",
      "name": {"en": "Product Name"},
      "price": 100000,
      ...
    }
  ],
  "nextCursor": "..."
}
```

## 📝 Common Use Cases

### 1. Create a Seasonal Collection

```typescript
const response = await fetch('http://localhost:3000/collections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Winter 2024',
    description: 'Cozy winter fashion',
    banner_image_url: 'https://cdn.example.com/winter-banner.jpg',
    seo_title: 'Winter Collection 2024',
    is_active: true
  })
});
const collection = await response.json();
console.log('Created:', collection.id);
```

### 2. Add Products to Collection

```typescript
const productIds = ['uuid1', 'uuid2', 'uuid3'];

const response = await fetch(`http://localhost:3000/collections/${collectionId}/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productIds })
});
const result = await response.json();
console.log(`Added ${result.added} products`);
```

### 3. Paginate Through Products

```typescript
async function getAllProducts(collectionId) {
  let allProducts = [];
  let cursor = null;
  
  do {
    const params = new URLSearchParams({ limit: '20' });
    if (cursor) params.append('cursor', cursor);
    
    const response = await fetch(`http://localhost:3000/collections/${collectionId}/products?${params}`);
    const data = await response.json();
    
    allProducts = [...allProducts, ...data.items];
    cursor = data.nextCursor;
  } while (cursor);
  
  return allProducts;
}
```

### 4. Update Collection Status

```typescript
const response = await fetch(`http://localhost:3000/collections/${collectionId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ is_active: false })
});
```

## 🎨 Frontend Examples

### React Component - Collection List

```tsx
import { useState, useEffect } from 'react';

function CollectionsList() {
  const [collections, setCollections] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20' });
    if (cursor) params.append('cursor', cursor);
    
    const response = await fetch(`/api/collections?${params}`);
    const data = await response.json();
    
    setCollections(prev => [...prev, ...data.items]);
    setCursor(data.nextCursor);
    setLoading(false);
  };

  useEffect(() => { loadMore(); }, []);

  return (
    <div>
      {collections.map(col => (
        <div key={col.id}>
          <h3>{col.name}</h3>
          <p>{col.description}</p>
        </div>
      ))}
      {cursor && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

### Vue Component - Collection Products

```vue
<template>
  <div>
    <div v-for="product in products" :key="product.id">
      <h4>{{ product.name }}</h4>
      <p>{{ product.price }}</p>
    </div>
    <button v-if="hasMore" @click="loadMore" :disabled="loading">
      {{ loading ? 'Loading...' : 'Load More' }}
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      products: [],
      cursor: null,
      loading: false,
      hasMore: true
    }
  },
  async mounted() {
    await this.loadProducts();
  },
  methods: {
    async loadProducts() {
      this.loading = true;
      const params = new URLSearchParams({ limit: '20' });
      if (this.cursor) params.append('cursor', this.cursor);
      
      const response = await fetch(`/api/collections/${this.collectionId}/products?${params}`);
      const data = await response.json();
      
      this.products.push(...data.items);
      this.cursor = data.nextCursor;
      this.hasMore = data.nextCursor !== null;
      this.loading = false;
    },
    async loadMore() {
      await this.loadProducts();
    }
  }
}
</script>
```

## 🔍 Debugging Tips

### Check if Migration Ran

```bash
# Connect to your database
psql $DATABASE_URL

# Check if tables exist
\dt collections
\dt product_collections

# Check indexes
\di collections*
\di product_collections*
```

### Check Collection Count

```bash
curl http://localhost:3000/collections
```

### Check Specific Collection

```bash
curl http://localhost:3000/collections/YOUR_COLLECTION_ID
```

### Verify Product Assignment

```bash
# Get product count
curl http://localhost:3000/collections/YOUR_COLLECTION_ID/products/count

# List products
curl http://localhost:3000/collections/YOUR_COLLECTION_ID/products?limit=5
```

## 🐛 Common Issues

### Issue: "Collection with slug already exists"

**Solution:** Either use a different name or explicitly set a unique slug:
```json
{
  "name": "Summer Collection",
  "slug": "summer-collection-2024"
}
```

### Issue: "Products not found"

**Solution:** Verify product IDs exist:
```bash
# Check if product exists
curl http://localhost:3000/products/YOUR_PRODUCT_ID
```

### Issue: "Invalid cursor token"

**Solution:** Don't manually modify cursor tokens. They're base64 encoded and validated.

### Issue: Migration fails

**Solution:** Check if tables already exist:
```bash
npm run migration:revert
npm run migration:run
```

## 📚 Further Reading

- Full API Documentation: `/docs/collections_api.md`
- Technical Details: `/src/modules/collections/README.md`
- Module Code: `/src/modules/collections/`

## 🎯 Next Steps

1. **Create your first collection** using the examples above
2. **Add products** to the collection
3. **Test pagination** with the cursor parameter
4. **Integrate with your frontend** using the React/Vue examples
5. **Read the full documentation** for advanced features

## 💡 Pro Tips

- Use slugs in URLs for SEO: `/collections/slug/summer-collection`
- Cache collection data on the frontend (it doesn't change often)
- Use cursor pagination for better performance with large datasets
- Batch product assignments (add multiple products at once)
- Set `is_active: false` for draft collections

## 🚨 Important Notes

- Collections use **UUID** primary keys
- Product-collection assignments have a **unique constraint**
- Deleting a collection **cascades** to product_collections table
- Deleting a product **cascades** to product_collections table
- Soft-deleted products are **excluded** from collection product listings
- Cursor tokens are **opaque** - don't try to parse or modify them manually

## ✅ Quick Checklist

- [ ] Migration ran successfully
- [ ] Can create a collection
- [ ] Can list collections
- [ ] Can assign products
- [ ] Can list products in collection
- [ ] Pagination works with cursor
- [ ] Can update collection
- [ ] Can delete collection

Happy coding! 🎉

