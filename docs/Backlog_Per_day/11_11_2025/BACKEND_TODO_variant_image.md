# 🚀 Backend TODO: Add `image_url` to Variant + `weight`/`dimensions` to Product

## 📋 Quick Summary

**What:** Add 3 new optional fields:
1. `image_url` to `ProductVariant` (JSONB array)
2. `weight` to `Product` (decimal column)
3. `dimensions` to `Product` (JSONB column)

**Why:** Frontend has implemented:
- Variant image upload UI (need backend storage)
- Shipping info fields (weight & dimensions for logistics)

**Priority:** 🔥 High (blocks full feature deployment)

**Estimated Time:** 5-6 hours (including migration)

---

## ✅ What Needs to Be Done

### 1. Update DTOs

**File:** `src/modules/products/dto/product-variant.dto.ts`
```typescript
export class ProductVariantDto {
  // ... existing fields ...
  
  @IsString()
  @IsUrl()
  @IsOptional()
  image_url?: string; // 🆕 ADD THIS
}
```

**File:** `src/modules/products/dto/create-product.dto.ts`
```typescript
export class CreateProductDto {
  // ... existing fields ...
  
  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number; // 🆕 ADD THIS (kg)
  
  @IsObject()
  @ValidateNested()
  @Type(() => DimensionsDto)
  @IsOptional()
  dimensions?: DimensionsDto; // 🆕 ADD THIS
}

// 🆕 NEW DTO
export class DimensionsDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  length?: number; // cm
  
  @IsNumber()
  @Min(0)
  @IsOptional()
  width?: number; // cm
  
  @IsNumber()
  @Min(0)
  @IsOptional()
  height?: number; // cm
}
```

### 2. Update Entity
**File:** `src/modules/products/entities/product.entity.ts`

```typescript
export interface ProductVariant {
  // ... existing fields ...
  image_url?: string; // 🆕 ADD THIS
}

@Entity('products')
export class Product {
  // ... existing fields ...
  
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weight?: number; // 🆕 ADD THIS
  
  @Column('jsonb', { nullable: true })
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  }; // 🆕 ADD THIS
}
```

### 3. Database Migration

**Check if needed:**
```sql
-- Check if weight column exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'weight';

-- Check if dimensions column exists and its type
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'dimensions';
```

**Migration (if needed):**
```sql
-- Add weight if doesn't exist
ALTER TABLE products ADD COLUMN weight DECIMAL(10,2) NULL;

-- Add or convert dimensions to JSONB
-- If doesn't exist:
ALTER TABLE products ADD COLUMN dimensions JSONB NULL;

-- If exists as text/string (⚠️ DATA LOSS WARNING):
ALTER TABLE products ALTER COLUMN dimensions TYPE JSONB USING NULL;
```

**Note:** For `variants` field - no migration needed (already JSONB)

---

## 📦 Example API Payload

**Request:** `POST /products`
```json
{
  "name": "Classic T-Shirt",
  "slug": "classic-tshirt",
  "price": 199000,
  "weight": 0.3,              // 🆕 NEW (kg)
  "dimensions": {             // 🆕 NEW (cm)
    "length": 28,
    "width": 20,
    "height": 2
  },
  "variants": [
    {
      "name": "S - Red",
      "sku": "TSHIRT-S-RED",
      "color_id": "uuid-red",
      "size_id": "uuid-s",
      "price": 199000,
      "stock": 20,
      "image_url": "https://res.cloudinary.com/.../red.jpg" // 🆕 NEW
    },
    {
      "name": "M - Blue",
      "sku": "TSHIRT-M-BLUE",
      "color_id": "uuid-blue",
      "size_id": "uuid-m",
      "price": 199000,
      "stock": 30
      // No image_url - still valid!
    }
  ]
}
```

**Partial Update:** `PATCH /products/:id`
```json
{
  "weight": 0.35,
  "dimensions": {
    "length": 30,
    "width": 22,
    "height": 2
  }
}
```

---

## 🧪 Testing Checklist

### Variant Images
- [ ] Create product with variant `image_url` → saves correctly
- [ ] Update variant `image_url` → updates correctly
- [ ] Create variant without `image_url` → still works
- [ ] GET product endpoint returns variant `image_url`
- [ ] Update variant stock preserves existing `image_url`

### Weight & Dimensions
- [ ] Create product with `weight` → saves correctly
- [ ] Create product with `dimensions` → saves correctly (as JSONB)
- [ ] Create product with partial dimensions (only length) → works
- [ ] Update `weight` → updates correctly
- [ ] Update `dimensions` → updates correctly
- [ ] GET product returns `weight` and `dimensions`
- [ ] Set `weight: null` → clears the field
- [ ] Set `dimensions: null` → clears the field
- [ ] Negative weight rejected
- [ ] Negative dimensions rejected

---

## 📚 Full Documentation

See detailed spec: `docs/variant-image-url-requirement.md`

---

## 🎯 Acceptance Criteria

✅ Backend accepts `image_url` in `ProductVariantDto`  
✅ Backend returns `image_url` in all product endpoints  
✅ Field is optional (backward compatible)  
✅ URL validation works correctly  
✅ No breaking changes to existing products  

---

## 💬 Questions?

Contact frontend team or see:
- `docs/variant-image-url-requirement.md` (detailed spec)
- `docs/product_data_structure.md` (updated with image_url)
- `docs/product-upload-ui-requirements.md` (UI implementation details)

---

**Status:** ⚠️ Awaiting Backend Implementation  
**Frontend:** ✅ Already Implemented (waiting for BE support)  
**Created:** 2025-11-11

