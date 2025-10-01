# Product Data Model & API Design

## 1. Data Model (Normalized, filter-friendly)

**Core Tables** - `categories` --- product categories (tree with
`parent_id`). - `products` --- product general info (name, description,
brand, currency, default images...). - `product_images` --- multiple
images (cover, hover). - `options` --- global options (Size, Color). -
`option_values` --- option values (S, M, L / Red, Blue...). -
`product_options` --- link product with options. - `skus` --- variants
(SKU, price, stock, discount). - `sku_option_values` --- link SKU with
option values. - `reviews` --- product reviews.

**Recommended Fields** - `products`: `id (uuid)`, `name`, `slug`,
`description`, `currency`, `category_id`, `default_price`, `rating_avg`,
`rating_count`, `created_at`, `updated_at`. - `product_images`: `id`,
`product_id`, `url`, `is_cover`, `is_hover`, `position`. - `skus`: `id`,
`product_id`, `sku`, `price_original`, `price`, `stock`, `is_active`,
`main_image_id`, `barcode`, `weight`, `created_at`, `updated_at`. -
`options`: `id`, `name`, `code`. - `option_values`: `id`, `option_id`,
`value`, `sort`. - `product_options`: `product_id`, `option_id`. -
`sku_option_values`: `sku_id`, `option_id`, `option_value_id`. -
`reviews`: `id`, `product_id`, `user_id`, `rating`, `title`, `content`,
`created_at`.

------------------------------------------------------------------------

## 2. Indexes for fast filtering

-   `skus(product_id, is_active, price)`
-   `skus(stock)`
-   `products(category_id)`
-   `option_values(option_id, value)`
-   `sku_option_values`: indexes on `(sku_id)`, `(option_value_id)`,
    `(option_id, option_value_id)`

------------------------------------------------------------------------

## 3. Filter Query Samples (Postgres)

**Filter by category + color=Red + size=M + price range**

``` sql
SELECT p.id, p.name, MIN(s.price) AS min_price
FROM products p
JOIN skus s ON s.product_id = p.id AND s.is_active = TRUE
WHERE p.category_id = $1
  AND s.price BETWEEN $2 AND $3
  AND EXISTS (
    SELECT 1
    FROM sku_option_values sov
    JOIN option_values ov ON ov.id = sov.option_value_id
    JOIN options o ON o.id = ov.option_id
    WHERE sov.sku_id = s.id AND o.code = 'COLOR' AND ov.value = 'Red'
  )
  AND EXISTS (
    SELECT 1
    FROM sku_option_values sov
    JOIN option_values ov ON ov.id = sov.option_value_id
    JOIN options o ON o.id = ov.option_id
    WHERE sov.sku_id = s.id AND o.code = 'SIZE' AND ov.value = 'M'
  )
GROUP BY p.id, p.name
ORDER BY min_price ASC
LIMIT 20 OFFSET 0;
```

**Filter multiple colors/sizes**

``` sql
AND EXISTS (
  SELECT 1 FROM sku_option_values sov
  JOIN option_values ov ON ov.id = sov.option_value_id
  JOIN options o ON o.id = ov.option_id
  WHERE sov.sku_id = s.id AND o.code = 'COLOR' AND ov.value = ANY ($colors)
)
AND EXISTS (
  SELECT 1 FROM sku_option_values sov
  JOIN option_values ov ON ov.id = sov.option_value_id
  JOIN options o ON o.id = ov.option_id
  WHERE sov.sku_id = s.id AND o.code = 'SIZE' AND ov.value = ANY ($sizes)
)
```

------------------------------------------------------------------------

## 4. API Design (Only POST style)

### Create product + options + skus

`POST /products`

``` json
{
  "name": "Áo thun Logo",
  "slug": "ao-thun-logo",
  "description": "Cotton 100%, form regular",
  "currency": "VND",
  "categoryId": "cat-uuid",
  "images": [
    {"url": "https://.../cover.jpg", "isCover": true},
    {"url": "https://.../hover.jpg", "isHover": true}
  ],
  "options": [ {"code": "COLOR"}, {"code": "SIZE"} ],
  "optionValues": { "COLOR": ["Red", "Blue"], "SIZE": ["S", "M", "L"] },
  "skus": [
    {
      "sku": "TSHIRT-RED-S",
      "priceOriginal": 199000,
      "price": 159000,
      "stock": 50,
      "options": {"COLOR": "Red", "SIZE": "S"},
      "mainImageUrl": "https://.../red_s.jpg"
    }
  ]
}
```

### Add option value

`POST /options/values`

``` json
{ "optionCode": "SIZE", "value": "XL", "sort": 40 }
```

### Add variant (SKU)

`POST /products/{id}/skus`

``` json
{
  "sku": "TSHIRT-RED-XL",
  "priceOriginal": 199000,
  "price": 159000,
  "stock": 25,
  "options": {"COLOR": "Red", "SIZE": "XL"}
}
```

### Update price/stock

`POST /skus/price`

``` json
{ "sku": "TSHIRT-RED-M", "price": 149000 }
```

`POST /skus/stock`

``` json
{ "sku": "TSHIRT-RED-M", "stock": 80 }
```

### Add review

`POST /products/{id}/reviews`

``` json
{ "rating": 5, "title": "Đẹp", "content": "Vải mịn, form ổn" }
```

------------------------------------------------------------------------

## 5. Admin Flow

1.  Select category → name/description/currency → upload cover/hover
    images.\
2.  Choose options (COLOR, SIZE).\
3.  Choose values for options (add if missing).\
4.  Generate variant grid → fill SKU, price, stock.\
5.  Submit once → backend transaction creates everything.

------------------------------------------------------------------------

## 6. TypeORM (NestJS) Implementation Notes

-   Use UUID for all PKs.\
-   Cascade only for `product_images`.\
-   Service `ProductCreator` (transaction): ensure options, values,
    create product, product_options, skus, sku_option_values.\
-   Validate: SKU options ⊆ product options.

------------------------------------------------------------------------

## 7. Optimization Notes

-   SKU generator: `slug-COLOR-SIZE`.\
-   Store both `price_original` and `price`.\
-   Variant image priority: color-specific → fallback cover.\
-   Optionally denormalize `colors_agg[]`, `sizes_agg[]` for fast
    facets.

------------------------------------------------------------------------

## 8. Facet Example

``` sql
SELECT ov.value AS color, COUNT(DISTINCT p.id) AS product_count
FROM products p
JOIN skus s ON s.product_id = p.id AND s.is_active = TRUE
JOIN sku_option_values sov ON sov.sku_id = s.id
JOIN option_values ov ON ov.id = sov.option_value_id
JOIN options o ON o.id = ov.option_id AND o.code = 'COLOR'
WHERE p.category_id = $1
GROUP BY ov.value
ORDER BY product_count DESC;
```
