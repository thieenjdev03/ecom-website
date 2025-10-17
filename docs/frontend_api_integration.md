# 🚀 Frontend API Integration Guide

**Project:** E-commerce Backend  
**API Version:** v1  
**Base URL:** `http://localhost:3000`  
**Date:** 2025-10-12

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Products API](#products-api)
3. [Categories API](#categories-api)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Examples](#examples)
7. [TypeScript Interfaces](#typescript-interfaces)

---

## 🔐 Authentication

All API endpoints require authentication via JWT token in the Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📦 Products API

### Base Endpoint: `/products`

### 1. Get All Products

```http
GET /products
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `category_id` (number) - Filter by category
- `status` (string) - Filter by status: `active`, `draft`, `out_of_stock`, `discontinued`
- `is_featured` (boolean) - Filter featured products
- `search` (string) - Search in name and description
- `sort_by` (string, default: `created_at`) - Sort field: `created_at`, `price`, `name`
- `sort_order` (string, default: `DESC`) - Sort direction: `ASC`, `DESC`

**Example:**
```typescript
// Get featured products, page 1, 10 items
const response = await fetch('/products?is_featured=true&page=1&limit=10');

// Search for polo shirts
const response = await fetch('/products?search=polo&status=active');

// Get products by category, sorted by price
const response = await fetch('/products?category_id=2&sort_by=price&sort_order=ASC');
```

### 2. Get Product by ID

```http
GET /products/:id
```

**Example:**
```typescript
const response = await fetch('/products/1');
```

### 3. Get Product by Slug

```http
GET /products/slug/:slug
```

**Example:**
```typescript
const response = await fetch('/products/slug/premium-polo-shirt');
```

### 4. Search Products

```http
GET /products/search?q=:keyword&limit=:limit
```

**Example:**
```typescript
const response = await fetch('/products/search?q=polo&limit=10');
```

### 5. Get Product Stock

```http
GET /products/:id/stock
```

**Example:**
```typescript
const response = await fetch('/products/3/stock');
// Returns: { "data": 45 }
```

### 6. Create Product

```http
POST /products
```

**Request Body:**
```typescript
interface CreateProductRequest {
  name: string;                    // Required, max 255 chars
  slug: string;                    // Required, max 255 chars, unique
  description?: string;            // Optional
  short_description?: string;      // Optional, max 500 chars
  price: number;                   // Required, >= 0
  sale_price?: number;             // Optional, must be <= price
  cost_price?: number;             // Optional, >= 0
  images?: string[];               // Optional, array of image URLs
  variants?: ProductVariant[];     // Optional, see interface below
  stock_quantity?: number;         // Optional, >= 0
  sku?: string;                    // Optional, max 100 chars, unique
  barcode?: string;                // Optional, max 100 chars
  category_id?: number;            // Optional
  tags?: string[];                 // Optional, array of strings
  status?: 'active' | 'draft' | 'out_of_stock' | 'discontinued';
  is_featured?: boolean;           // Optional, default false
  meta_title?: string;             // Optional, max 255 chars
  meta_description?: string;       // Optional, max 500 chars
  weight?: number;                 // Optional, >= 0
}
```

**Example - Simple Product:**
```typescript
const productData = {
  name: "Basic White T-Shirt",
  slug: "basic-white-tshirt",
  description: "100% cotton, comfortable fit",
  short_description: "Classic white tee",
  price: 299000,
  sale_price: 249000,
  images: ["https://example.com/tshirt.jpg"],
  stock_quantity: 50,
  sku: "TEE-WHITE-001",
  category_id: 1,
  tags: ["t-shirt", "basic", "unisex"],
  status: "active"
};

const response = await fetch('/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(productData)
});
```

**Example - Product with Variants:**
```typescript
const productWithVariants = {
  name: "Premium Polo Shirt",
  slug: "premium-polo-shirt",
  description: "High quality cotton pique polo shirt",
  price: 399000,
  images: ["https://example.com/polo.jpg"],
  variants: [
    { name: "M - Black", sku: "POLO-M-BLACK", price: 399000, stock: 10 },
    { name: "L - Black", sku: "POLO-L-BLACK", price: 419000, stock: 12 }
  ],
  category_id: 2,
  tags: ["polo", "men", "premium"],
  status: "active",
  is_featured: true
};
```

### 7. Update Product

```http
PATCH /products/:id
```

**Request Body:** Same as Create Product (all fields optional)

**Example:**
```typescript
const updateData = {
  price: 349000,
  sale_price: 299000,
  stock_quantity: 45
};

const response = await fetch('/products/1', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});
```

### 8. Update Variant Stock

```http
PATCH /products/:id/variants/:sku/stock
```

**Request Body:**
```typescript
{
  "stock": number
}
```

**Example:**
```typescript
const response = await fetch('/products/3/variants/POLO-M-BLACK/stock', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ stock: 15 })
});
```

### 9. Delete Product (Soft Delete)

```http
DELETE /products/:id
```

**Example:**
```typescript
const response = await fetch('/products/1', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📂 Categories API

### Base Endpoint: `/categories`

### 1. Get All Categories

```http
GET /categories
```

**Example:**
```typescript
const response = await fetch('/categories');
```

### 2. Get Active Categories Only

```http
GET /categories/active
```

**Example:**
```typescript
const response = await fetch('/categories/active');
```

### 3. Get Category by ID

```http
GET /categories/:id
```

**Example:**
```typescript
const response = await fetch('/categories/1');
```

### 4. Get Category by Slug

```http
GET /categories/slug/:slug
```

**Example:**
```typescript
const response = await fetch('/categories/slug/t-shirts');
```

### 5. Create Category

```http
POST /categories
```

**Request Body:**
```typescript
interface CreateCategoryRequest {
  name: string;                    // Required, max 100 chars
  slug: string;                    // Required, max 100 chars, unique
  description?: string;            // Optional
  image_url?: string;              // Optional, max 500 chars
  parent_id?: number;              // Optional, for hierarchical categories
  display_order?: number;          // Optional, default 0
  is_active?: boolean;             // Optional, default true
}
```

**Example:**
```typescript
const categoryData = {
  name: "T-Shirts",
  slug: "t-shirts",
  description: "All types of t-shirts",
  display_order: 1,
  is_active: true
};

const response = await fetch('/categories', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(categoryData)
});
```

### 6. Update Category

```http
PATCH /categories/:id
```

**Request Body:** Same as Create Category (all fields optional)

### 7. Delete Category

```http
DELETE /categories/:id
```

---

## 📊 Response Format

### Success Response

```typescript
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

### Products List Response

```typescript
interface ProductsListResponse {
  data: {
    data: Product[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
  success: boolean;
}
```

### Single Product Response

```typescript
interface ProductResponse {
  data: Product;
  message: string;
  success: boolean;
}
```

### Categories Response

```typescript
interface CategoriesResponse {
  data: Category[];
  message: string;
  success: boolean;
}
```

---

## ❌ Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (for DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate slug/SKU)
- `500` - Internal Server Error

### Example Error Handling

```typescript
try {
  const response = await fetch('/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const result = await response.json();
  return result.data;
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

---

## 💡 Examples

### React Hook for Products

```typescript
import { useState, useEffect } from 'react';

interface UseProductsOptions {
  page?: number;
  limit?: number;
  categoryId?: number;
  status?: string;
  isFeatured?: boolean;
  search?: string;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.categoryId) params.append('category_id', options.categoryId.toString());
        if (options.status) params.append('status', options.status);
        if (options.isFeatured !== undefined) params.append('is_featured', options.isFeatured.toString());
        if (options.search) params.append('search', options.search);

        const response = await fetch(`/products?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch products');

        const result = await response.json();
        setProducts(result.data.data);
        setMeta(result.data.meta);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [options]);

  return { products, loading, error, meta };
};
```

### Vue Composable for Categories

```typescript
import { ref, onMounted } from 'vue';

export const useCategories = () => {
  const categories = ref<Category[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const fetchCategories = async () => {
    try {
      loading.value = true;
      const response = await fetch('/categories/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const result = await response.json();
      categories.value = result.data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchCategories);

  return { categories, loading, error, fetchCategories };
};
```

---

## 🔧 TypeScript Interfaces

```typescript
// Product Interfaces
interface ProductVariant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  barcode?: string;
}

interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: string; // Decimal as string from database
  sale_price?: string;
  cost_price?: string;
  images: string[];
  variants: ProductVariant[];
  stock_quantity: number;
  sku?: string;
  barcode?: string;
  category_id?: number;
  category?: Category;
  tags: string[];
  status: 'active' | 'draft' | 'out_of_stock' | 'discontinued';
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  weight?: string;
  dimensions?: ProductDimensions;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Category Interfaces
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  parent?: Category;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Request/Response Interfaces
interface CreateProductRequest {
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  images?: string[];
  variants?: ProductVariant[];
  stock_quantity?: number;
  sku?: string;
  barcode?: string;
  category_id?: number;
  tags?: string[];
  status?: 'active' | 'draft' | 'out_of_stock' | 'discontinued';
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  weight?: number;
}

interface UpdateProductRequest extends Partial<CreateProductRequest> {}

interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  display_order?: number;
  is_active?: boolean;
}

interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}
```

---

## 🚀 Quick Start Checklist

- [ ] Set up authentication with JWT token
- [ ] Implement error handling for API calls
- [ ] Create TypeScript interfaces for type safety
- [ ] Test all CRUD operations for products
- [ ] Test all CRUD operations for categories
- [ ] Implement search and filtering functionality
- [ ] Handle product variants display
- [ ] Implement pagination for product lists
- [ ] Add loading states and error messages
- [ ] Test with different product types (simple vs variants)

---

## 📞 Support

For any questions or issues with the API integration, please contact the backend team or refer to the Swagger documentation at `http://localhost:3000/api` when the server is running.

---

**Last Updated:** 2025-10-12  
**API Version:** v1  
**Node.js Version:** v22.20.0
