# 🎯 Frontend Integration Guide

**E-commerce Backend API Documentation**  
**Version:** 1.0  
**Date:** 2025-10-12

---

## 🚀 Quick Start

This guide provides everything you need to integrate with the new E-commerce Backend API.

### 📁 Documentation Files

1. **[Frontend API Integration Guide](./frontend_api_integration.md)** - Complete API reference
2. **[API Examples & Use Cases](./api_examples.md)** - Real-world implementation examples
3. **[Product Schema Documentation](../product_schema_docs.md)** - Backend implementation details

---

## 🎯 Key Features

### ✅ **Products Management**
- **Simple Products** - Products without variants (single SKU, stock)
- **Variant Products** - Products with multiple size/color options (JSONB variants)
- **Full CRUD Operations** - Create, Read, Update, Delete
- **Advanced Search** - Text search with filters
- **Stock Management** - Real-time stock tracking

### ✅ **Categories Management**
- **Hierarchical Categories** - Parent-child relationships
- **SEO-Friendly** - Slug-based URLs
- **Active/Inactive** - Status management

### ✅ **Advanced Features**
- **Pagination** - Efficient data loading
- **Filtering** - By category, status, featured, etc.
- **Sorting** - By price, name, date
- **Soft Delete** - Products can be restored
- **JSONB Variants** - Flexible variant management

---

## 🔧 Technical Stack

- **Backend:** NestJS + PostgreSQL + TypeORM
- **Node.js:** v22.20.0
- **Database:** PostgreSQL with JSONB support
- **Authentication:** JWT tokens
- **API Format:** RESTful JSON

---

## 📊 Database Schema

### Products Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR 255)
- slug (VARCHAR 255, UNIQUE)
- description (TEXT)
- short_description (VARCHAR 500)
- price (DECIMAL 10,2)
- sale_price (DECIMAL 10,2)
- cost_price (DECIMAL 10,2)
- images (JSONB) - Array of image URLs
- variants (JSONB) - Array of variant objects
- stock_quantity (INT)
- sku (VARCHAR 100, UNIQUE)
- barcode (VARCHAR 100)
- category_id (INT, FK)
- tags (JSONB) - Array of tag strings
- status (VARCHAR 20) - active/draft/out_of_stock/discontinued
- is_featured (BOOLEAN)
- meta_title (VARCHAR 255)
- meta_description (VARCHAR 500)
- weight (DECIMAL 8,2)
- dimensions (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP) - Soft delete
```

### Categories Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR 100)
- slug (VARCHAR 100, UNIQUE)
- description (TEXT)
- image_url (VARCHAR 500)
- parent_id (INT, FK to categories)
- display_order (INT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 🎨 Product Types

### 1. Simple Products
Products without variants - single SKU, single stock quantity.

```typescript
{
  "name": "Basic White T-Shirt",
  "slug": "basic-white-tshirt",
  "price": 299000,
  "sale_price": 249000,
  "stock_quantity": 50,
  "sku": "TEE-WHITE-001",
  "variants": [], // Empty array
  "category_id": 1
}
```

### 2. Variant Products
Products with multiple options (size, color, etc.) - variants stored in JSONB.

```typescript
{
  "name": "Premium Polo Shirt",
  "slug": "premium-polo-shirt",
  "price": 399000,
  "stock_quantity": 0, // No main stock
  "sku": null, // No main SKU
  "variants": [
    {
      "name": "M - Black",
      "sku": "POLO-M-BLACK",
      "price": 399000,
      "stock": 10
    },
    {
      "name": "L - Black", 
      "sku": "POLO-L-BLACK",
      "price": 419000,
      "stock": 12
    }
  ],
  "category_id": 2
}
```

---

## 🔑 Authentication

All API endpoints require JWT authentication:

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## 📡 API Endpoints Overview

### Products
- `GET /products` - List products with filters
- `GET /products/:id` - Get product by ID
- `GET /products/slug/:slug` - Get product by slug
- `GET /products/search?q=:keyword` - Search products
- `GET /products/:id/stock` - Get total stock
- `POST /products` - Create product
- `PATCH /products/:id` - Update product
- `PATCH /products/:id/variants/:sku/stock` - Update variant stock
- `DELETE /products/:id` - Delete product

### Categories
- `GET /categories` - List all categories
- `GET /categories/active` - List active categories
- `GET /categories/:id` - Get category by ID
- `GET /categories/slug/:slug` - Get category by slug
- `POST /categories` - Create category
- `PATCH /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

---

## 🎯 Common Use Cases

### 1. Homepage
```typescript
// Get featured products
const featuredProducts = await fetch('/products?is_featured=true&limit=8');
```

### 2. Category Page
```typescript
// Get products by category
const categoryProducts = await fetch('/products?category_id=1&page=1&limit=12');
```

### 3. Product Detail
```typescript
// Get product by slug (SEO-friendly)
const product = await fetch('/products/slug/premium-polo-shirt');
```

### 4. Search
```typescript
// Search products
const searchResults = await fetch('/products/search?q=polo&limit=20');
```

### 5. Admin Management
```typescript
// Create product with variants
const newProduct = await fetch('/products', {
  method: 'POST',
  body: JSON.stringify({
    name: "New Product",
    slug: "new-product",
    price: 299000,
    variants: [
      { name: "M - Red", sku: "PROD-M-RED", price: 299000, stock: 10 }
    ]
  })
});
```

---

## 🚨 Important Notes

### 1. Product Logic Rules
- **Simple Products:** Must have `stock_quantity` and `sku`, `variants` should be empty
- **Variant Products:** Must have `variants` array, `stock_quantity` should be 0, `sku` should be null
- **Sale Price:** Must be less than or equal to regular price
- **Slugs & SKUs:** Must be unique across all products

### 2. Stock Management
- **Simple Products:** Use `stock_quantity` field
- **Variant Products:** Use `variants[].stock` field
- **Total Stock:** Use `/products/:id/stock` endpoint for variant products

### 3. Error Handling
- Always check response status codes
- Handle validation errors (400)
- Handle authentication errors (401)
- Handle not found errors (404)
- Handle conflict errors (409) - duplicate slug/SKU

### 4. Performance Tips
- Use pagination for large datasets
- Cache frequently accessed data
- Use search endpoint for text queries
- Implement infinite scroll for better UX

---

## 🧪 Testing

### Sample Data Available
The backend comes with sample data:
- **3 Categories:** T-Shirts, Polo Shirts, Accessories
- **5 Products:** Mix of simple and variant products
- **Test Variants:** Premium Polo Shirt with 6 size/color combinations

### Test Endpoints
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/products
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/categories
```

---

## 🆘 Support & Resources

### Documentation
- [Complete API Reference](./frontend_api_integration.md)
- [Implementation Examples](./api_examples.md)
- [Backend Schema Details](../product_schema_docs.md)

### Development Server
- **URL:** `http://localhost:3000`
- **Swagger Docs:** `http://localhost:3000/api` (when server is running)

### Contact
For questions or issues, contact the backend development team.

---

## 🎉 Getting Started Checklist

- [ ] Set up authentication with JWT tokens
- [ ] Read the complete API documentation
- [ ] Review the implementation examples
- [ ] Test the sample endpoints
- [ ] Implement error handling
- [ ] Set up TypeScript interfaces
- [ ] Test with different product types
- [ ] Implement search and filtering
- [ ] Add pagination support
- [ ] Test variant management

---

**Happy Coding! 🚀**

*Last Updated: 2025-10-12*
