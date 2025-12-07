# Product Detail Structure Documentation

This document describes all fields available in the Product entity, including which fields are required and optional.

## Product Entity Fields

### Required Fields

#### 1. `name` (LangObject) - **REQUIRED**
- **Type**: JSON object with language codes as keys
- **Description**: Product name in multiple languages
- **Example**: 
  ```json
  { 
    "en": "Premium Polo Shirt", 
    "vi": "Áo Polo Cao Cấp" 
  }
  ```
- **Validation**: Must be a valid object with language key-value pairs

#### 2. `slug` (LangObject) - **REQUIRED**
- **Type**: JSON object with language codes as keys
- **Description**: URL-friendly product identifier in multiple languages
- **Example**: 
  ```json
  { 
    "en": "premium-polo-shirt", 
    "vi": "ao-polo-cao-cap" 
  }
  ```
- **Validation**: Must be a valid object with language key-value pairs

#### 3. `price` (number) - **REQUIRED**
- **Type**: Decimal (10, 2)
- **Description**: Base price of the product
- **Example**: `399000`
- **Validation**: Must be a number ≥ 0

---

### Optional Fields

#### Basic Information

#### 4. `description` (LangObject) - Optional
- **Type**: JSON object with language codes as keys
- **Description**: Full product description in multiple languages
- **Example**: 
  ```json
  { 
    "en": "High quality cotton polo shirt with modern design...", 
    "vi": "Áo polo cotton chất lượng cao với thiết kế hiện đại..." 
  }
  ```
- **Default**: `null`

#### 5. `short_description` (LangObject) - Optional
- **Type**: JSON object with language codes as keys
- **Description**: Brief product description in multiple languages
- **Example**: 
  ```json
  { 
    "en": "Premium cotton polo", 
    "vi": "Áo polo cotton cao cấp" 
  }
  ```
- **Default**: `null`

---

#### Pricing Fields

#### 6. `sale_price` (number) - Optional
- **Type**: Decimal (10, 2)
- **Description**: Discounted price when product is on sale
- **Example**: `349000`
- **Validation**: Must be ≥ 0
- **Default**: `null`

#### 7. `cost_price` (number) - Optional
- **Type**: Decimal (10, 2)
- **Description**: Cost price for internal calculation/profit margin
- **Example**: `200000`
- **Validation**: Must be ≥ 0
- **Default**: `null`

---

#### Media & Visual

#### 8. `images` (string[]) - Optional
- **Type**: JSON array of strings
- **Description**: Array of product image URLs
- **Example**: 
  ```json
  [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
  ```
- **Default**: `[]` (empty array)

---

#### Inventory & Stock

#### 9. `stock_quantity` (number) - Optional
- **Type**: Integer
- **Description**: Total stock quantity available
- **Example**: `50`
- **Validation**: Must be ≥ 0
- **Default**: `0`

#### 10. `sku` (string) - Optional
- **Type**: String (max 100 characters)
- **Description**: Stock Keeping Unit - unique product identifier
- **Example**: `"POLO-001"`
- **Validation**: Max 100 characters, must be unique
- **Default**: `null`

#### 11. `barcode` (string) - Optional
- **Type**: String (max 100 characters)
- **Description**: Product barcode (EAN, UPC, etc.)
- **Example**: `"1234567890123"`
- **Validation**: Max 100 characters
- **Default**: `null`

---

#### Product Variants

#### 12. `variants` (ProductVariant[]) - Optional
- **Type**: JSON array of ProductVariant objects
- **Description**: Product variations (size, color combinations)
- **Default**: `[]` (empty array)

**ProductVariant Structure:**

Each variant contains:

- `name` (LangObject) - **REQUIRED**
  - Variant name in multiple languages
  - Example: `{ "en": "M - Black", "vi": "M - Đen" }`

- `sku` (string) - **REQUIRED**
  - Unique SKU for this variant
  - Example: `"POLO-M-BLACK"`

- `price` (number) - **REQUIRED**
  - Price for this specific variant
  - Example: `399000`
  - Must be ≥ 0

- `stock` (number) - **REQUIRED**
  - Stock quantity for this variant
  - Example: `10`
  - Must be ≥ 0

- `color_id` (string UUID) - **REQUIRED**
  - Reference to Color entity
  - Example: `"44fd41a7-63b1-41f6-b05d-1935d392f1d4"`

- `size_id` (string UUID) - **REQUIRED**
  - Reference to Size entity
  - Example: `"07bdcefc-da8a-4b29-9945-602abb4adc02"`

- `barcode` (string) - Optional
  - Barcode specific to this variant
  - Example: `"1234567890123"`

- `image_url` (string) - Optional
  - Image URL specific to this variant (e.g., showing the color)
  - Example: `"https://res.cloudinary.com/.../red.jpg"`
  - Must be a valid URL with http/https protocol

---

#### Categorization

#### 13. `category_id` (string UUID) - Optional
- **Type**: UUID
- **Description**: Reference to the product's category
- **Example**: `"b4b2b07f-6825-402b-bd2c-f9aef8cfbba5"`
- **Default**: `null`

#### 14. `tags` (string[]) - Optional
- **Type**: JSON array of strings
- **Description**: Product tags for filtering and search
- **Example**: `["polo", "men", "premium"]`
- **Default**: `[]` (empty array)

---

#### Status & Display

#### 15. `status` (enum) - Optional
- **Type**: Enum string
- **Description**: Product status
- **Possible Values**: 
  - `"active"` - Product is visible and available for purchase
  - `"inactive"` - Product is hidden from customers
  - `"draft"` - Product is in draft mode (not published)
  - `"out_of_stock"` - Product is out of stock
  - `"discontinued"` - Product is discontinued
- **Default**: `"active"`

#### 16. `is_featured` (boolean) - Optional
- **Type**: Boolean
- **Description**: Whether product should appear in featured sections
- **Example**: `false`
- **Default**: `false`

#### 17. `enable_sale_tag` (boolean) - Optional
- **Type**: Boolean
- **Description**: Whether to display a "SALE" tag on the product
- **Example**: `false`
- **Default**: `false`

---

#### SEO Fields

#### 18. `meta_title` (LangObject) - Optional
- **Type**: JSON object with language codes as keys
- **Description**: SEO meta title in multiple languages
- **Example**: 
  ```json
  { 
    "en": "Buy Premium Polo Shirt", 
    "vi": "Mua Áo Polo Cao Cấp" 
  }
  ```
- **Default**: `null`

#### 19. `meta_description` (LangObject) - Optional
- **Type**: JSON object with language codes as keys
- **Description**: SEO meta description in multiple languages
- **Example**: 
  ```json
  { 
    "en": "High quality polo shirt made from premium cotton...", 
    "vi": "Áo polo chất lượng cao làm từ cotton cao cấp..." 
  }
  ```
- **Default**: `null`

---

#### Shipping Information

#### 20. `weight` (number) - Optional
- **Type**: Decimal (10, 2)
- **Description**: Product weight in kilograms
- **Example**: `0.3`
- **Validation**: Must be ≥ 0
- **Default**: `null`

#### 21. `dimensions` (ProductDimensions) - Optional
- **Type**: JSON object
- **Description**: Product dimensions in centimeters
- **Default**: `null`

**ProductDimensions Structure:**

- `length` (number) - Optional
  - Length in cm
  - Example: `28`
  - Must be ≥ 0

- `width` (number) - Optional
  - Width in cm
  - Example: `20`
  - Must be ≥ 0

- `height` (number) - Optional
  - Height in cm
  - Example: `2`
  - Must be ≥ 0

**Example:**
```json
{
  "length": 28,
  "width": 20,
  "height": 2
}
```

---

#### System Fields (Auto-generated)

#### 22. `id` (string UUID) - Auto-generated
- **Type**: UUID
- **Description**: Unique identifier for the product
- **Auto-generated**: Yes (by database)

#### 23. `created_at` (Date) - Auto-generated
- **Type**: Timestamp
- **Description**: When the product was created
- **Auto-generated**: Yes (by database)

#### 24. `updated_at` (Date) - Auto-generated
- **Type**: Timestamp
- **Description**: When the product was last updated
- **Auto-generated**: Yes (by database)

#### 25. `deleted_at` (Date) - Auto-generated
- **Type**: Timestamp (nullable)
- **Description**: Soft delete timestamp (for soft deletion)
- **Auto-generated**: Yes (by database)
- **Default**: `null`

---

## Field Requirements Summary

### REQUIRED for Product Creation:
1. ✅ `name` (LangObject)
2. ✅ `slug` (LangObject)
3. ✅ `price` (number)

### REQUIRED for Each Variant (if using variants):
1. ✅ `name` (LangObject)
2. ✅ `sku` (string)
3. ✅ `price` (number)
4. ✅ `stock` (number)
5. ✅ `color_id` (UUID)
6. ✅ `size_id` (UUID)

### OPTIONAL but Recommended:
- `description` - For better product information
- `short_description` - For product listings
- `images` - At least one image for visual appeal
- `category_id` - For proper categorization
- `stock_quantity` - For inventory management
- `sku` - For inventory tracking
- `status` - To control visibility

### OPTIONAL for Advanced Features:
- `sale_price` - For promotions
- `cost_price` - For profit tracking
- `variants` - For products with size/color options
- `tags` - For search and filtering
- `is_featured` - For homepage/featured sections
- `enable_sale_tag` - For sale badges
- `meta_title`, `meta_description` - For SEO
- `weight`, `dimensions` - For shipping calculations
- `barcode` - For POS integration

---

## Example: Complete Product Object

```json
{
  "name": {
    "en": "Premium Polo Shirt",
    "vi": "Áo Polo Cao Cấp"
  },
  "slug": {
    "en": "premium-polo-shirt",
    "vi": "ao-polo-cao-cap"
  },
  "description": {
    "en": "High quality cotton polo shirt with modern design and comfortable fit. Perfect for casual or semi-formal occasions.",
    "vi": "Áo polo cotton chất lượng cao với thiết kế hiện đại và form dáng thoải mái. Hoàn hảo cho các dịp thường ngày hoặc bán trang trọng."
  },
  "short_description": {
    "en": "Premium cotton polo shirt",
    "vi": "Áo polo cotton cao cấp"
  },
  "price": 399000,
  "sale_price": 349000,
  "cost_price": 200000,
  "images": [
    "https://res.cloudinary.com/demo/image/upload/v1/polo-main.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1/polo-detail.jpg"
  ],
  "variants": [
    {
      "name": {
        "en": "M - Black",
        "vi": "M - Đen"
      },
      "sku": "POLO-M-BLACK",
      "price": 349000,
      "stock": 10,
      "color_id": "44fd41a7-63b1-41f6-b05d-1935d392f1d4",
      "size_id": "07bdcefc-da8a-4b29-9945-602abb4adc02",
      "barcode": "1234567890123",
      "image_url": "https://res.cloudinary.com/demo/image/upload/v1/polo-black.jpg"
    },
    {
      "name": {
        "en": "L - White",
        "vi": "L - Trắng"
      },
      "sku": "POLO-L-WHITE",
      "price": 349000,
      "stock": 15,
      "color_id": "55ed42b8-74c2-52g7-c16e-2046e403g2e5",
      "size_id": "18cedfgd-eb9b-5c3a-a056-713bcc5bec13"
    }
  ],
  "stock_quantity": 25,
  "sku": "POLO-001",
  "category_id": "b4b2b07f-6825-402b-bd2c-f9aef8cfbba5",
  "tags": ["polo", "men", "premium", "cotton"],
  "status": "active",
  "is_featured": true,
  "enable_sale_tag": true,
  "meta_title": {
    "en": "Buy Premium Polo Shirt - High Quality Cotton",
    "vi": "Mua Áo Polo Cao Cấp - Cotton Chất Lượng Cao"
  },
  "meta_description": {
    "en": "Shop our premium cotton polo shirt. Modern design, comfortable fit, perfect for any occasion. Free shipping on orders over $50.",
    "vi": "Mua áo polo cotton cao cấp của chúng tôi. Thiết kế hiện đại, form dáng thoải mái, hoàn hảo cho mọi dịp. Miễn phí vận chuyển cho đơn hàng trên 1 triệu."
  },
  "weight": 0.3,
  "dimensions": {
    "length": 28,
    "width": 20,
    "height": 2
  }
}
```

---

## Validation Rules

### Global Rules:
- All language objects (LangObject) must contain at least one language key-value pair
- All numeric price/weight fields must be >= 0
- All UUID fields must be valid UUID v4 format
- All URLs must include http:// or https:// protocol

### Business Rules:
- If `sale_price` is provided, it should typically be less than `price`
- If `variants` are provided, the total `stock_quantity` should equal the sum of variant stocks
- If `enable_sale_tag` is `true`, there should typically be a `sale_price` set
- SKU must be unique across all products (if provided)

---

## Notes for Frontend Integration

1. **Multi-language Support**: All text fields use the LangObject structure. Frontend should detect user's language and display the appropriate value.

2. **Image Handling**: The `images` array contains URLs. The first image is typically used as the main/thumbnail image.

3. **Variant Logic**: If a product has variants, display the variant selector (size/color). The base `price` is usually the starting/minimum price.

4. **Stock Display**: 
   - If variants exist, show stock per variant
   - Otherwise, use `stock_quantity`

5. **Price Display**:
   - If `sale_price` exists and is less than `price`, show both (strikethrough original)
   - If `enable_sale_tag` is true, display a "SALE" badge

6. **Status Filtering**:
   - Only show products with `status: "active"` to customers
   - Admin panel can display all statuses

7. **SEO**: Use `meta_title` and `meta_description` for page meta tags if provided, otherwise fall back to `name` and `short_description`.

