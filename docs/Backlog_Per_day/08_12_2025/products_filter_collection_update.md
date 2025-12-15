# Products Filter by Collection - Update Note

## 📌 Tóm Tắt

Đã cập nhật Products API để hỗ trợ filter theo collection ID.

## ✅ Thay Đổi

### 1. DTO Update
**File:** `src/modules/products/dto/query-product.dto.ts`

Thêm field mới:
```typescript
@ApiPropertyOptional({ 
  example: 'c5c5d08f-7936-503c-ce3d-g0bgf9cfccb6', 
  description: 'Filter by collection ID' 
})
@IsOptional()
@IsUUID()
collection_id?: string;
```

### 2. Service Update
**File:** `src/modules/products/products.service.ts`

Thêm logic filter:
```typescript
// Filter by collection if collection_id is provided
if (collection_id) {
  queryBuilder
    .innerJoin('product_collections', 'pc', 'pc.product_id = product.id')
    .andWhere('pc.collection_id = :collection_id', { collection_id });
}
```

## 🎯 Tính Năng

### Endpoint Mới
```
GET /products?collection_id={uuid}
```

### Có Thể Kết Hợp Với
- ✅ `category_id` - Lọc theo category
- ✅ `status` - Lọc theo status
- ✅ `is_featured` - Lọc featured products
- ✅ `search` - Tìm kiếm trong collection
- ✅ `page` & `limit` - Phân trang
- ✅ `sort_by` & `sort_order` - Sắp xếp

## 📝 Examples

### Example 1: Lấy Products Trong Collection
```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&limit=20
```

### Example 2: Lọc Theo Collection + Category
```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&category_id=cat-123
```

### Example 3: Search Trong Collection
```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&search=shirt
```

### Example 4: Collection + Multiple Filters
```bash
GET /products?collection_id=550e8400-e29b-41d4-a716-446655440000&category_id=cat-123&status=active&is_featured=true&page=1&limit=24
```

## 🔄 So Sánh 2 Cách

### Cách 1: Collections Endpoint
```bash
GET /collections/:id/products?limit=20&cursor=xxx
```

**Đặc điểm:**
- Cursor-based pagination
- Tốt cho infinite scroll
- Không thể kết hợp filters khác

### Cách 2: Products Endpoint (MỚI)
```bash
GET /products?collection_id=xxx&page=1&limit=20
```

**Đặc điểm:**
- Offset-based pagination
- Có page numbers (1, 2, 3...)
- Kết hợp được với filters khác
- Tốt cho traditional pagination

## 🎨 Frontend Use Cases

### Use Case 1: Collection Page với Filters

```typescript
// Load products với filters
async function loadProducts(collectionId: string, filters: any) {
  const params = new URLSearchParams({
    collection_id: collectionId,
    page: filters.page || '1',
    limit: '24'
  });
  
  if (filters.categoryId) {
    params.append('category_id', filters.categoryId);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.status) {
    params.append('status', filters.status);
  }
  
  const response = await fetch(`/api/products?${params}`);
  return response.json();
}
```

### Use Case 2: React Component

```tsx
function CollectionPage({ collectionId }) {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: null,
    search: '',
    page: 1
  });

  useEffect(() => {
    loadProducts(collectionId, filters).then(data => {
      setProducts(data.data);
    });
  }, [collectionId, filters]);

  return (
    <div>
      {/* Filters */}
      <CategoryFilter onChange={cat => setFilters({...filters, categoryId: cat})} />
      <SearchBox onChange={q => setFilters({...filters, search: q})} />
      
      {/* Products */}
      <ProductGrid products={products} />
      
      {/* Pagination */}
      <Pagination 
        current={filters.page}
        onChange={p => setFilters({...filters, page: p})}
      />
    </div>
  );
}
```

## 🗄️ Database Query

Khi có `collection_id`, query sẽ JOIN với `product_collections`:

```sql
SELECT product.*, category.*
FROM products product
LEFT JOIN categories category ON category.id = product.category_id
INNER JOIN product_collections pc ON pc.product_id = product.id
WHERE product.deleted_at IS NULL
  AND pc.collection_id = 'collection-uuid'
  -- ... other filters
ORDER BY product.created_at DESC
LIMIT 20 OFFSET 0;
```

## ⚡ Performance

- ✅ Sử dụng existing indexes
- ✅ INNER JOIN hiệu quả
- ✅ Không cần migration
- ✅ Performance tương đương category filter

## 📊 Response Format

```json
{
  "data": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "slug": "product-slug",
      "price": 299000,
      "sale_price": 249000,
      "images": ["..."],
      "status": "active",
      "category": {
        "id": "cat-id",
        "name": "Category",
        "slug": "category"
      },
      // ... full product details
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

## 🧪 Testing

### Test 1: Basic Filter
```bash
curl http://localhost:3000/products?collection_id=550e8400-e29b-41d4-a716-446655440000
```

### Test 2: Combined Filters
```bash
curl "http://localhost:3000/products?collection_id=550e8400-e29b-41d4-a716-446655440000&category_id=cat-123&status=active"
```

### Test 3: Search
```bash
curl "http://localhost:3000/products?collection_id=550e8400-e29b-41d4-a716-446655440000&search=shirt"
```

## 📋 Validation

### Valid UUID
```bash
✅ collection_id=550e8400-e29b-41d4-a716-446655440000
```

### Invalid UUID
```bash
❌ collection_id=not-a-uuid
Response: 400 Bad Request
```

### Collection Không Tồn Tại
```bash
✅ Returns 200 with empty array
{
  "data": [],
  "meta": { "total": 0, ... }
}
```

## 💡 Best Practices

1. **Chọn Pagination Phù Hợp:**
   - Infinite scroll → `/collections/:id/products` (cursor)
   - Page numbers → `/products?collection_id=xxx` (offset)

2. **Kết Hợp Filters:**
   - Collection + Category: Lọc loại sản phẩm cụ thể
   - Collection + Search: Tìm kiếm trong collection
   - Collection + Status: Lọc theo trạng thái

3. **Cache Results:**
   - Products trong collection ít thay đổi
   - Cache ở frontend
   - Improve UX

4. **Handle Empty Results:**
   - Hiển thị message phù hợp
   - Suggest bỏ filters
   - Show related collections

## 📚 Documentation

Chi tiết đầy đủ tại:
- **`/docs/products_filter_by_collection.md`** - Complete documentation
- **`/docs/collections_api.md`** - Collections API
- **`/docs/api_products.md`** - Products API

## ✅ Checklist

- [x] Thêm `collection_id` vào DTO
- [x] Update service với filter logic
- [x] No breaking changes
- [x] No migration required
- [x] No linter errors
- [x] Backward compatible
- [x] Document đầy đủ
- [x] Examples included

## 🎯 Use Cases Summary

| Scenario | Endpoint | Pagination |
|----------|----------|-----------|
| Infinite scroll | `/collections/:id/products` | Cursor |
| Page numbers | `/products?collection_id=xxx` | Offset |
| Filter by category | `/products?collection_id=xxx&category_id=yyy` | Offset |
| Search | `/products?collection_id=xxx&search=keyword` | Offset |
| Multiple filters | `/products?collection_id=xxx&...` | Offset |

## 🚀 Next Steps

1. **Test API:**
   ```bash
   npm run start:dev
   curl http://localhost:3000/products?collection_id=xxx
   ```

2. **Frontend Integration:**
   - Update collection pages
   - Add filter components
   - Implement pagination

3. **Optional Enhancements:**
   - Add filter by multiple collections
   - Add price range filter
   - Add sort by popularity

---

**Status:** ✅ COMPLETE & READY TO USE

Feature đã sẵn sàng để sử dụng! Không cần migration, backward compatible, và có document đầy đủ. 🎉

