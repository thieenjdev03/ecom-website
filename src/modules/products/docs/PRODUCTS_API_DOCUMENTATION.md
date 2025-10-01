# Products API Documentation

## Overview
The Products API provides comprehensive product management with support for variants, attributes, media, and global options. This API follows the new simplified model without complex option-value linking.

## Data Model

### Core Entities

#### Product
- `id` (UUID): Primary key
- `title` (string): Product name
- `slug` (string): URL-friendly identifier (unique)
- `description` (text): Product description
- `status` (enum): 'draft' | 'published' | 'archived'
- `defaultVariantId` (UUID, nullable): Default variant for quick display
- `price` (decimal): Base price (with default 0)
- `priceOriginal` (decimal): Original price (with default 0)
- `attribute` (string): Additional attributes (with default '')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### ProductVariant
- `id` (UUID): Primary key
- `productId` (UUID): Foreign key to Product
- `sku` (string): Unique stock keeping unit
- `name` (string, nullable): Variant display name (e.g., "Red / M")
- `priceOriginal` (decimal): Original price
- `priceFinal` (decimal): Final price after discounts
- `currency` (string): Currency code (default: 'VND')
- `stockOnHand` (integer): Available stock
- `stockReserved` (integer): Reserved stock
- `thumbnailUrl` (string, nullable): Variant-specific image
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### ProductAttribute
- `id` (UUID): Primary key
- `productId` (UUID): Foreign key to Product
- `key` (string): Attribute name (e.g., "Brand", "Material")
- `value` (string): Attribute value (e.g., "Nike", "Cotton")

#### ProductMedia
- `id` (UUID): Primary key
- `productId` (UUID): Foreign key to Product
- `url` (string): Media URL
- `type` (enum): 'image' | 'video' (default: 'image')
- `position` (integer): Display order (default: 0)
- `isPrimary` (boolean): Primary image flag (default: false)
- `isHover` (boolean): Hover image flag (default: false)
- `variantId` (UUID, nullable): Variant-specific media
- `alt` (string, nullable): Alt text for accessibility

#### GlobalOption (for reference)
- `id` (UUID): Primary key
- `name` (string): Option name (e.g., "Color", "Size")
- `code` (string): Option code (e.g., "COLOR", "SIZE")

#### GlobalOptionValue (for reference)
- `id` (UUID): Primary key
- `optionId` (UUID): Foreign key to GlobalOption
- `value` (string): Option value (e.g., "Red", "M")
- `sort` (integer): Display order

## API Endpoints

### Public Endpoints

#### 1. Get All Products
```http
GET /products
```

**Query Parameters:**
- `keyword` (optional): Search keyword

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Premium Hoodie",
    "slug": "premium-hoodie",
    "description": "Comfortable and stylish hoodie",
    "status": "published",
    "defaultVariantId": null,
    "price": "0",
    "priceOriginal": "0",
    "attribute": "",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "variants": [
      {
        "id": "uuid",
        "productId": "uuid",
        "sku": "HOODIE-BLACK-M-COTTON",
        "name": "Black / M / Cotton",
        "priceOriginal": "450000",
        "priceFinal": "350000",
        "currency": "VND",
        "stockOnHand": 20,
        "stockReserved": 0,
        "thumbnailUrl": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "attributes": [
      {
        "id": "uuid",
        "productId": "uuid",
        "key": "Brand",
        "value": "Premium Co."
      },
      {
        "id": "uuid",
        "productId": "uuid",
        "key": "Weight",
        "value": "500g"
      }
    ]
  }
]
```

#### 2. Get Product by ID
```http
GET /products/:id
```

**Response:** Same structure as above, single product object

#### 3. Get Product by Slug
```http
GET /products/slug/:slug
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Premium Hoodie",
  "slug": "premium-hoodie",
  "description": "Comfortable and stylish hoodie",
  "status": "published",
  "defaultVariantId": null,
  "price": "0",
  "priceOriginal": "0",
  "attribute": "",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "variants": [...],
  "media": [
    {
      "id": "uuid",
      "productId": "uuid",
      "url": "https://picsum.photos/seed/hoodie1/600",
      "type": "image",
      "position": 0,
      "isPrimary": true,
      "isHover": false,
      "variantId": null,
      "alt": null
    }
  ],
  "attributes": [...]
}
```

#### 4. Get Variant Detail
```http
GET /products/variants/:id
```

**Response:**
```json
{
  "variant": {
    "id": "uuid",
    "productId": "uuid",
    "sku": "HOODIE-BLACK-M-COTTON",
    "name": "Black / M / Cotton",
    "priceOriginal": "450000",
    "priceFinal": "350000",
    "currency": "VND",
    "stockOnHand": 20,
    "stockReserved": 0,
    "thumbnailUrl": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Admin Endpoints

#### 1. Create Product
```http
POST /products
```

**Request Body:**
```json
{
  "title": "New Product",
  "slug": "new-product",
  "description": "Product description",
  "status": "published"
}
```

#### 2. Update Product
```http
PATCH /products/:id
```

**Request Body:** Same as create, all fields optional

#### 3. Delete Product
```http
DELETE /products/:id
```

#### 4. Generate Variants
```http
POST /admin/products/:id/variants/generate
```

**Request Body:**
```json
[
  {
    "sku": "PRODUCT-RED-M",
    "name": "Red / M",
    "priceOriginal": "199000",
    "priceFinal": "159000",
    "currency": "VND",
    "stockOnHand": 50,
    "thumbnailUrl": "https://example.com/image.jpg"
  }
]
```

#### 5. Update Variant
```http
PATCH /admin/products/variants/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "priceFinal": "149000",
  "stockOnHand": 30
}
```

#### 6. Adjust Variant Stock
```http
PATCH /admin/products/variants/:id/stock
```

**Request Body:**
```json
{
  "stockOnHand": 100
}
```

#### 7. Add Media
```http
POST /admin/products/:id/media
```

**Request Body:**
```json
[
  {
    "url": "https://example.com/image1.jpg",
    "type": "image",
    "position": 0,
    "isPrimary": true,
    "isHover": false,
    "alt": "Product image"
  },
  {
    "url": "https://example.com/image2.jpg",
    "type": "image",
    "position": 1,
    "isHover": true,
    "alt": "Product hover image"
  }
]
```

## Usage Examples

### Frontend Integration

#### Product Listing Page
```javascript
// Get all products with variants and attributes
const response = await fetch('/products');
const products = await response.json();

products.forEach(product => {
  console.log(`Product: ${product.title}`);
  console.log(`Variants: ${product.variants.length}`);
  console.log(`Price range: ${Math.min(...product.variants.map(v => parseFloat(v.priceFinal)))} - ${Math.max(...product.variants.map(v => parseFloat(v.priceFinal)))}`);
});
```

#### Product Detail Page
```javascript
// Get product by slug with full details
const response = await fetch('/products/slug/premium-hoodie');
const product = await response.json();

// Display primary image
const primaryImage = product.media.find(m => m.isPrimary);
console.log('Primary image:', primaryImage?.url);

// Display hover image
const hoverImage = product.media.find(m => m.isHover);
console.log('Hover image:', hoverImage?.url);

// Display attributes
product.attributes.forEach(attr => {
  console.log(`${attr.key}: ${attr.value}`);
});
```

#### Variant Selection
```javascript
// Get variant details when user selects options
const variantId = 'selected-variant-id';
const response = await fetch(`/products/variants/${variantId}`);
const { variant } = await response.json();

console.log(`Selected: ${variant.name}`);
console.log(`Price: ${variant.priceFinal} ${variant.currency}`);
console.log(`Stock: ${variant.stockOnHand}`);
```

### Admin Integration

#### Create Product with Variants
```javascript
// 1. Create product
const productResponse = await fetch('/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New T-Shirt',
    slug: 'new-t-shirt',
    description: 'Comfortable cotton t-shirt',
    status: 'published'
  })
});
const product = await productResponse.json();

// 2. Generate variants
const variantsResponse = await fetch(`/admin/products/${product.id}/variants/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([
    {
      sku: 'TSHIRT-RED-M',
      name: 'Red / M',
      priceOriginal: '199000',
      priceFinal: '159000',
      stockOnHand: 50
    },
    {
      sku: 'TSHIRT-BLUE-L',
      name: 'Blue / L',
      priceOriginal: '199000',
      priceFinal: '159000',
      stockOnHand: 30
    }
  ])
});

// 3. Add media
const mediaResponse = await fetch(`/admin/products/${product.id}/media`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([
    {
      url: 'https://example.com/primary.jpg',
      isPrimary: true,
      position: 0
    },
    {
      url: 'https://example.com/hover.jpg',
      isHover: true,
      position: 1
    }
  ])
});
```

## Error Handling

### Common Error Responses

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Product with ID uuid not found",
  "error": "Not Found"
}
```

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["title should not be empty"],
  "error": "Bad Request"
}
```

#### 409 Conflict (Duplicate Slug)
```json
{
  "statusCode": 409,
  "message": "duplicate key value violates unique constraint",
  "error": "Conflict"
}
```

## Database Indexes

For optimal performance, the following indexes are recommended:

- `products(slug)` - Unique index for slug lookups
- `products(status, updatedAt)` - Composite index for status filtering
- `product_variants(productId)` - Foreign key index
- `product_variants(sku)` - Unique index for SKU lookups
- `product_media(productId, position)` - Composite index for media ordering
- `product_attributes(productId)` - Foreign key index

## Performance Considerations

1. **Pagination**: For large product catalogs, implement pagination on the `/products` endpoint
2. **Caching**: Cache product data with variants and attributes for frequently accessed products
3. **Image Optimization**: Use CDN for product media URLs
4. **Database Queries**: The API uses efficient JOIN queries to fetch related data in single requests

## Migration and Seeding

### Run Migrations
```bash
npm run migration:run
```

### Seed Sample Data
```bash
# Basic seed
npm run seed:products

# Diverse seed with multiple products
npm run seed:products-diverse
```

## Changelog

### v2.0.0
- Simplified product model without complex option-value linking
- Added product attributes support
- Enhanced API responses to include variants and attributes
- Improved seed scripts with sample data
- Added comprehensive documentation

