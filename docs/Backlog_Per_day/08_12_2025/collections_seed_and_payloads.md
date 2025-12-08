# Collections - Seed Data và API Payloads

## 📌 Tổng Quan

Đã tạo xong:
1. ✅ Seed script cho collections
2. ✅ Document đầy đủ về API payloads
3. ✅ Thêm script vào package.json

---

## 🌱 Seed Script

### File: `scripts/seed-collections.ts`

Script tự động tạo 10 collections mẫu với dữ liệu thực tế:

1. **Summer Collection 2024** - 12 sản phẩm
2. **Winter Essentials** - 10 sản phẩm
3. **New Arrivals** - 15 sản phẩm
4. **Best Sellers** - 20 sản phẩm
5. **Sale Items** - 8 sản phẩm
6. **Premium Collection** - 6 sản phẩm
7. **Casual Wear** - 14 sản phẩm
8. **Office Attire** - 10 sản phẩm
9. **Activewear** - 12 sản phẩm
10. **Limited Edition** - 5 sản phẩm

### Cách Chạy

```bash
# Bước 1: Chạy migration (nếu chưa chạy)
npm run migration:run

# Bước 2: Đảm bảo có products trong database
npm run seed:products

# Bước 3: Chạy seed collections
npm run seed:collections
```

### Kết Quả

Script sẽ:
- ✅ Xóa collections và product_collections cũ (nếu có)
- ✅ Tạo 10 collections mới
- ✅ Lấy ngẫu nhiên products và gán vào collections
- ✅ Hiển thị summary với số lượng products trong mỗi collection
- ✅ Tổng cộng tạo ~112 product-collection assignments

### Output Mẫu

```
🌱 Starting collections seed...

✅ Database connection established

🗑️  Clearing existing collections...
✅ Cleared existing collections

📦 Creating collections...
   ✓ Created: Summer Collection 2024 (summer-collection-2024)
   ✓ Created: Winter Essentials (winter-essentials)
   ✓ Created: New Arrivals (new-arrivals)
   ...
✅ Created 10 collections

🔍 Fetching products...
✅ Found 50 products

🔗 Assigning products to collections...
   ✓ Summer Collection 2024: 12 products
   ✓ Winter Essentials: 10 products
   ✓ New Arrivals: 15 products
   ...
✅ Created 112 product-collection assignments

📊 Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Summer Collection 2024    - 12 products
   Winter Essentials         - 10 products
   New Arrivals             - 15 products
   Best Sellers             - 20 products
   Sale Items               - 8 products
   Premium Collection       - 6 products
   Casual Wear              - 14 products
   Office Attire            - 10 products
   Activewear               - 12 products
   Limited Edition          - 5 products
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Collections seed completed successfully!
```

---

## 📝 API Payloads Documentation

### File: `docs/collections_api_payloads.md`

Document đầy đủ về tất cả request/response payloads cho Collections API.

### Nội Dung Chính

#### 1. **Create Collection**
- Full example với tất cả fields
- Minimum required (chỉ name)
- Validation rules chi tiết
- Success response
- Error responses (400, 409)

#### 2. **Update Collection**
- Partial update examples
- Update name only
- Update SEO fields
- Deactivate collection
- Update banner
- Update slug với validation

#### 3. **Assign Products**
- Assign multiple products
- Assign single product
- Success response với added/skipped count
- Error responses cho invalid UUIDs

#### 4. **Remove Products**
- Remove multiple/single products
- Success response với removed count

#### 5. **Query Parameters**
- List collections với pagination
- List products trong collection
- Validation rules cho limit/cursor

#### 6. **Response Formats**
- Single collection response
- Paginated collections response
- Paginated products response
- Product count response
- Delete response (204 No Content)

#### 7. **Complete Workflow Example**
Step-by-step workflow với curl commands:
1. Create collection
2. Assign products
3. List products
4. Update collection
5. Check product count

#### 8. **Testing with Postman**
- Import collection instructions
- Environment variables setup
- 10 ready-to-use requests

#### 9. **Best Practices**
10 best practices cho việc sử dụng API

#### 10. **Common Errors & Solutions**
Bảng troubleshooting cho các lỗi thường gặp

---

## 🎯 Các Collections Mẫu

### 1. Summer Collection 2024
```json
{
  "name": "Summer Collection 2024",
  "slug": "summer-collection-2024",
  "description": "Discover our latest summer fashion trends. Light, breezy, and perfect for hot weather.",
  "banner_image_url": "https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=1200",
  "seo_title": "Summer Collection 2024 - Trendy Summer Fashion | Fashion Store",
  "seo_description": "Browse our curated summer collection featuring the latest trends in lightweight clothing, swimwear, and summer accessories.",
  "is_active": true
}
```

### 2. Winter Essentials
```json
{
  "name": "Winter Essentials",
  "slug": "winter-essentials",
  "description": "Stay warm and stylish this winter. Our winter collection features cozy sweaters, jackets, and cold-weather accessories.",
  "banner_image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
  "seo_title": "Winter Essentials - Cozy Winter Fashion | Fashion Store",
  "seo_description": "Shop our winter essentials collection for warm clothing, jackets, and accessories to keep you comfortable all season.",
  "is_active": true
}
```

### 3. Best Sellers
```json
{
  "name": "Best Sellers",
  "slug": "best-sellers",
  "description": "Our most popular products that customers love. These items are flying off the shelves for good reason!",
  "banner_image_url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200",
  "seo_title": "Best Sellers - Top Rated Fashion Products | Fashion Store",
  "seo_description": "Shop our best-selling products. Customer favorites and top-rated items that everyone is talking about.",
  "is_active": true
}
```

---

## 🔥 Quick Test Commands

### 1. Chạy Migration
```bash
npm run migration:run
```

### 2. Seed Collections
```bash
npm run seed:collections
```

### 3. Test API

**List collections:**
```bash
curl http://localhost:3000/collections?limit=10
```

**Get collection by ID:**
```bash
curl http://localhost:3000/collections/{collection-id}
```

**Get products in collection:**
```bash
curl http://localhost:3000/collections/{collection-id}/products?limit=20
```

**Get product count:**
```bash
curl http://localhost:3000/collections/{collection-id}/products/count
```

---

## 📊 Payload Examples Chi Tiết

### Create Collection - Full Payload
```json
{
  "name": "Flash Sale Weekend",
  "slug": "flash-sale-weekend",
  "description": "Limited time deals this weekend only! Save up to 70% on selected items.",
  "banner_image_url": "https://cdn.example.com/banners/flash-sale.jpg",
  "seo_title": "Flash Sale Weekend - Up to 70% Off | Fashion Store",
  "seo_description": "Don't miss our flash sale weekend! Huge discounts on fashion items for 3 days only.",
  "is_active": true
}
```

### Create Collection - Minimum Required
```json
{
  "name": "New Collection"
}
```
*Slug sẽ tự động generate thành "new-collection"*

### Update Collection - Multiple Fields
```json
{
  "description": "Updated description with more details",
  "banner_image_url": "https://cdn.example.com/new-banner.jpg",
  "seo_title": "New SEO Title",
  "is_active": false
}
```

### Assign Products - Batch Assignment
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

**Response:**
```json
{
  "added": 4,
  "skipped": 1
}
```
*"skipped": 1 nghĩa là 1 product đã có sẵn trong collection rồi*

### Remove Products
```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**Response:**
```json
{
  "removed": 2
}
```

---

## 🚀 Frontend Integration Examples

### React Hook - useCollections

```typescript
import { useState, useEffect } from 'react';

function useCollections(limit = 20) {
  const [collections, setCollections] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
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
    loadMore();
  }, []);

  return { collections, loading, hasMore, loadMore };
}

// Sử dụng:
function CollectionsPage() {
  const { collections, loading, hasMore, loadMore } = useCollections(20);

  return (
    <div>
      {collections.map(col => (
        <CollectionCard key={col.id} collection={col} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### JavaScript - Fetch All Products in Collection

```javascript
async function getAllProductsInCollection(collectionId) {
  let allProducts = [];
  let cursor = null;
  
  do {
    const params = new URLSearchParams({ limit: '50' });
    if (cursor) params.append('cursor', cursor);
    
    const response = await fetch(
      `/api/collections/${collectionId}/products?${params}`
    );
    const data = await response.json();
    
    allProducts = [...allProducts, ...data.items];
    cursor = data.nextCursor;
    
    console.log(`Loaded ${data.items.length} products...`);
  } while (cursor);
  
  console.log(`Total: ${allProducts.length} products`);
  return allProducts;
}

// Sử dụng:
const products = await getAllProductsInCollection('collection-uuid');
```

---

## ✅ Checklist

- [x] Tạo seed script với 10 collections mẫu
- [x] Thêm script vào package.json
- [x] Tạo document đầy đủ về payloads
- [x] Include validation rules
- [x] Include error responses
- [x] Include workflow examples
- [x] Include frontend examples
- [x] Include testing instructions
- [x] Include best practices
- [x] No linter errors

---

## 📚 Files Created

1. **scripts/seed-collections.ts** - Seed script với 10 collections
2. **docs/collections_api_payloads.md** - Complete payload documentation
3. **package.json** - Added "seed:collections" script

---

## 🎉 Next Steps

### 1. Test Seed Script
```bash
npm run seed:collections
```

### 2. Verify Data
```bash
curl http://localhost:3000/collections
```

### 3. Test API với Postman
Import các requests từ documentation vào Postman và test.

### 4. Frontend Integration
Sử dụng examples trong document để integrate vào frontend.

---

## 💡 Tips

1. **Seed Order:**
   - Chạy `seed:products` trước
   - Sau đó mới chạy `seed:collections`

2. **Re-seed:**
   - Script tự động xóa data cũ
   - An toàn để chạy nhiều lần

3. **Custom Collections:**
   - Edit `collectionsData` array trong seed script
   - Thêm/xóa collections theo ý muốn

4. **Product Assignment:**
   - Script random assign products
   - Mỗi lần chạy sẽ khác nhau

5. **Banner Images:**
   - Đang dùng Unsplash URLs
   - Thay bằng CDN của mình khi deploy

---

Hoàn thành! Bây giờ bạn có thể:
- ✅ Seed collections data
- ✅ Test tất cả API endpoints
- ✅ Tham khảo payloads cho frontend integration
- ✅ Debug với error examples

