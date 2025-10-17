# 🎯 API Examples & Use Cases

**Project:** E-commerce Backend  
**Date:** 2025-10-12

---

## 📋 Table of Contents

1. [Product Management Examples](#product-management-examples)
2. [Category Management Examples](#category-management-examples)
3. [Search & Filter Examples](#search--filter-examples)
4. [Variant Management Examples](#variant-management-examples)
5. [Real-world Scenarios](#real-world-scenarios)

---

## 📦 Product Management Examples

### 1. E-commerce Homepage

**Scenario:** Display featured products on homepage

```typescript
// Get featured products for homepage
const getFeaturedProducts = async () => {
  const response = await fetch('/products?is_featured=true&limit=8&sort_by=created_at&sort_order=DESC', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.data.data; // Array of featured products
};
```

### 2. Product Catalog Page

**Scenario:** Show products by category with pagination

```typescript
// Get products for a specific category
const getProductsByCategory = async (categoryId: number, page: number = 1) => {
  const response = await fetch(`/products?category_id=${categoryId}&page=${page}&limit=12&status=active`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return {
    products: result.data.data,
    pagination: result.data.meta
  };
};
```

### 3. Product Detail Page

**Scenario:** Show single product with all details

```typescript
// Get product by slug for SEO-friendly URLs
const getProductBySlug = async (slug: string) => {
  const response = await fetch(`/products/slug/${slug}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.data;
};

// Usage
const product = await getProductBySlug('premium-polo-shirt');
console.log(product.variants); // Array of variants
```

### 4. Admin Product Creation

**Scenario:** Admin creates a new product

```typescript
// Create a simple product
const createSimpleProduct = async () => {
  const productData = {
    name: "Summer Cotton Dress",
    slug: "summer-cotton-dress",
    description: "Light and comfortable cotton dress perfect for summer",
    short_description: "Summer cotton dress",
    price: 450000,
    sale_price: 399000,
    images: [
      "https://example.com/dress-1.jpg",
      "https://example.com/dress-2.jpg"
    ],
    stock_quantity: 25,
    sku: "DRESS-SUMMER-001",
    category_id: 1,
    tags: ["dress", "summer", "cotton", "women"],
    status: "active",
    is_featured: true,
    meta_title: "Buy Summer Cotton Dress Online",
    meta_description: "Light and comfortable cotton dress perfect for summer weather"
  };

  const response = await fetch('/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  return await response.json();
};
```

### 5. Product with Variants Creation

**Scenario:** Create a product with multiple size/color variants

```typescript
const createProductWithVariants = async () => {
  const productData = {
    name: "Classic Denim Jeans",
    slug: "classic-denim-jeans",
    description: "Classic fit denim jeans in multiple sizes and colors",
    short_description: "Classic denim jeans",
    price: 599000,
    images: [
      "https://example.com/jeans-blue.jpg",
      "https://example.com/jeans-black.jpg"
    ],
    variants: [
      // Blue variants
      { name: "28 - Blue", sku: "JEANS-28-BLUE", price: 599000, stock: 5 },
      { name: "30 - Blue", sku: "JEANS-30-BLUE", price: 599000, stock: 8 },
      { name: "32 - Blue", sku: "JEANS-32-BLUE", price: 599000, stock: 10 },
      { name: "34 - Blue", sku: "JEANS-34-BLUE", price: 599000, stock: 6 },
      // Black variants
      { name: "28 - Black", sku: "JEANS-28-BLACK", price: 599000, stock: 3 },
      { name: "30 - Black", sku: "JEANS-30-BLACK", price: 599000, stock: 7 },
      { name: "32 - Black", sku: "JEANS-32-BLACK", price: 599000, stock: 9 },
      { name: "34 - Black", sku: "JEANS-34-BLACK", price: 599000, stock: 4 }
    ],
    category_id: 2,
    tags: ["jeans", "denim", "classic", "men"],
    status: "active",
    is_featured: true
  };

  const response = await fetch('/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  return await response.json();
};
```

---

## 📂 Category Management Examples

### 1. Navigation Menu

**Scenario:** Build category navigation menu

```typescript
// Get active categories for navigation
const getNavigationCategories = async () => {
  const response = await fetch('/categories/active', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.data; // Array of active categories
};
```

### 2. Hierarchical Categories

**Scenario:** Create parent-child category structure

```typescript
// Create parent category
const createParentCategory = async () => {
  const categoryData = {
    name: "Clothing",
    slug: "clothing",
    description: "All clothing items",
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

  const parentCategory = await response.json();
  return parentCategory.data;
};

// Create child category
const createChildCategory = async (parentId: number) => {
  const categoryData = {
    name: "Men's T-Shirts",
    slug: "mens-t-shirts",
    description: "T-shirts for men",
    parent_id: parentId,
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

  return await response.json();
};
```

---

## 🔍 Search & Filter Examples

### 1. Product Search

**Scenario:** Implement search functionality

```typescript
// Search products by keyword
const searchProducts = async (keyword: string, limit: number = 20) => {
  const response = await fetch(`/products/search?q=${encodeURIComponent(keyword)}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.data;
};

// Advanced search with filters
const advancedSearch = async (filters: {
  keyword?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  status?: string;
}) => {
  const params = new URLSearchParams();
  
  if (filters.keyword) params.append('search', filters.keyword);
  if (filters.categoryId) params.append('category_id', filters.categoryId.toString());
  if (filters.isFeatured !== undefined) params.append('is_featured', filters.isFeatured.toString());
  if (filters.status) params.append('status', filters.status);
  
  // Note: Price filtering would need to be implemented in the backend
  // For now, we can filter on the frontend after getting results
  
  const response = await fetch(`/products?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  // Frontend price filtering (if backend doesn't support it)
  let products = result.data.data;
  if (filters.minPrice || filters.maxPrice) {
    products = products.filter((product: Product) => {
      const price = parseFloat(product.price);
      if (filters.minPrice && price < filters.minPrice) return false;
      if (filters.maxPrice && price > filters.maxPrice) return false;
      return true;
    });
  }
  
  return {
    products,
    meta: result.data.meta
  };
};
```

### 2. Filter by Category

**Scenario:** Filter products by category

```typescript
// Get products by category with sorting
const getProductsByCategory = async (categoryId: number, sortBy: string = 'created_at') => {
  const response = await fetch(`/products?category_id=${categoryId}&sort_by=${sortBy}&sort_order=DESC&status=active`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.data;
};
```

---

## 🎨 Variant Management Examples

### 1. Display Product Variants

**Scenario:** Show variants in product detail page

```typescript
// Get product with variants
const getProductWithVariants = async (productId: number) => {
  const response = await fetch(`/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  const product = result.data;
  
  // Group variants by size or color for better display
  const groupedVariants = groupVariantsByAttribute(product.variants);
  
  return {
    product,
    groupedVariants
  };
};

// Helper function to group variants
const groupVariantsByAttribute = (variants: ProductVariant[]) => {
  const groups: { [key: string]: ProductVariant[] } = {};
  
  variants.forEach(variant => {
    // Extract size from variant name (e.g., "M - Black" -> "M")
    const size = variant.name.split(' - ')[0];
    if (!groups[size]) {
      groups[size] = [];
    }
    groups[size].push(variant);
  });
  
  return groups;
};
```

### 2. Update Variant Stock

**Scenario:** Admin updates stock for specific variant

```typescript
// Update variant stock
const updateVariantStock = async (productId: number, sku: string, newStock: number) => {
  const response = await fetch(`/products/${productId}/variants/${sku}/stock`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stock: newStock })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update variant stock');
  }
  
  return await response.json();
};

// Usage
await updateVariantStock(3, 'POLO-M-BLACK', 15);
```

### 3. Check Product Availability

**Scenario:** Check if product/variant is in stock

```typescript
// Check total stock for a product
const checkProductStock = async (productId: number) => {
  const response = await fetch(`/products/${productId}/stock`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.data; // Total stock count
};

// Check specific variant stock
const checkVariantStock = async (productId: number, sku: string) => {
  const response = await fetch(`/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  const product = result.data;
  
  const variant = product.variants.find((v: ProductVariant) => v.sku === sku);
  return variant ? variant.stock : 0;
};
```

---

## 🌟 Real-world Scenarios

### 1. E-commerce Homepage Component

```typescript
// React component for homepage
const Homepage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomepageData = async () => {
      try {
        // Load featured products and categories in parallel
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/products?is_featured=true&limit=8', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/categories/active', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const productsResult = await productsResponse.json();
        const categoriesResult = await categoriesResponse.json();

        setFeaturedProducts(productsResult.data.data);
        setCategories(categoriesResult.data);
      } catch (error) {
        console.error('Failed to load homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomepageData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <CategoryNavigation categories={categories} />
      <FeaturedProducts products={featuredProducts} />
    </div>
  );
};
```

### 2. Product Management Dashboard

```typescript
// Admin dashboard for managing products
const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    categoryId: '',
    status: 'active',
    search: ''
  });

  const loadProducts = async (page: number = 1) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '20');
    
    if (filters.categoryId) params.append('category_id', filters.categoryId);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`/products?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();
    setProducts(result.data.data);
    setPagination(result.data.meta);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(`/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Reload products after deletion
        loadProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  return (
    <div>
      <ProductFilters filters={filters} onFiltersChange={setFilters} />
      <ProductTable 
        products={products} 
        onDelete={handleDeleteProduct}
        pagination={pagination}
        onPageChange={loadProducts}
      />
    </div>
  );
};
```

### 3. Shopping Cart Integration

```typescript
// Shopping cart with variant support
interface CartItem {
  productId: number;
  variantSku?: string;
  quantity: number;
  product: Product;
}

const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = async (productId: number, variantSku?: string, quantity: number = 1) => {
    // Get product details
    const response = await fetch(`/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    const product = result.data;

    // Check stock availability
    let availableStock = 0;
    if (variantSku) {
      const variant = product.variants.find((v: ProductVariant) => v.sku === variantSku);
      availableStock = variant ? variant.stock : 0;
    } else {
      availableStock = product.stock_quantity;
    }

    if (availableStock < quantity) {
      throw new Error('Insufficient stock');
    }

    // Add to cart
    const cartItem: CartItem = {
      productId,
      variantSku,
      quantity,
      product
    };

    setCartItems(prev => [...prev, cartItem]);
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    setCartItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  return (
    <div>
      {cartItems.map((item, index) => (
        <CartItemComponent
          key={index}
          item={item}
          onQuantityChange={(quantity) => updateCartItemQuantity(index, quantity)}
        />
      ))}
    </div>
  );
};
```

---

## 🚀 Performance Tips

### 1. Caching Strategies

```typescript
// Simple cache implementation
const cache = new Map();

const fetchWithCache = async (url: string, ttl: number = 300000) => { // 5 minutes
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  
  return data;
};
```

### 2. Pagination Optimization

```typescript
// Load more products (infinite scroll)
const useInfiniteProducts = (filters: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      // Add filters...
      
      const response = await fetch(`/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      const newProducts = result.data.data;
      
      setProducts(prev => [...prev, ...newProducts]);
      setPage(prev => prev + 1);
      setHasMore(newProducts.length === 20);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, hasMore, loadMore };
};
```

---

**Last Updated:** 2025-10-12  
**API Version:** v1
