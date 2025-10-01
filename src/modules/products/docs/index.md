Ok, mình gợi ý kiến trúc “tối ưu – mở rộng được” cho Product API (NestJS + TypeORM + PostgreSQL), đáp ứng: phân loại màu/size (variant), mô tả (rich text), stock (tồn kho), giá gốc/giá sau giảm, ảnh đại diện & ảnh hover.

Mục tiêu
	•	Nhanh cho FE (ít query, trả đúng cấu trúc cần).
	•	Dễ mở rộng (thêm option khác ngoài màu/size).
	•	Chuẩn SKU (mỗi biến thể 1 SKU).
	•	Rõ ràng giá (base price, discount, lịch khuyến mãi).
	•	Quản lý ảnh (primary/hover/ordering).

Mô hình dữ liệu (tối ưu)

1) products (thông tin chung theo SP)
	•	id (PK, uuid), title, slug (unique, index), description (text/rich), status (draft/published), brandId?, categoryId?
	•	defaultVariantId? (FK để FE load nhanh 1 biến thể mặc định)
	•	createdAt/updatedAt

2) product_options (kiểu lựa chọn: Color/Size)
	•	id, productId (FK), name (Color/Size), position (thứ tự hiển thị)

3) product_option_values (giá trị: Red, Blue, S, M)
	•	id, productOptionId (FK), value, hexCode? (cho màu), meta jsonb?

4) product_variants (mỗi biến thể là 1 SKU)
	•	id, productId (FK), sku (unique), barcode?,
	•	Giá: priceOriginal (giá gốc), priceFinal (giá đã giảm – tính sẵn để FE không phải tính), currency
	•	Kho: stockOnHand (tồn thực), stockReserved (đã giữ trong giỏ/đơn), isInStock (computed), lowStockThreshold?
	•	SEO/UI: name (ví dụ: “Red / M”), thumbnailUrl? (ảnh đại diện riêng cho variant nếu có)
	•	weight/length/width/height?
	•	createdAt/updatedAt

5) product_variant_option_values (pivot – biến thể gắn với value)
	•	id, variantId (FK), optionValueId (FK)

Cho phép ma trận tùy ý (không chỉ màu/size).

6) product_media (ảnh/video của sản phẩm – cấp product)
	•	id, productId (FK), url, type (image/video), position (thứ tự),
	•	isPrimary (ảnh đại diện), isHover (ảnh hover), alt

Có thể thêm variantId? nếu muốn media riêng cho từng biến thể.

7) product_price_rules (khuyến mãi theo thời gian – optional)
	•	id, productId/variantId?, type (percent/fixed), value, startAt, endAt, priority

CRON/worker (job) tính priceFinal và cache.

8) product_attributes (thông số kỹ thuật linh hoạt)
	•	id, productId, key, value (hoặc spec jsonb)

Index/Constraint gợi ý
	•	products(slug) UNIQUE, products(status, updatedAt)
	•	product_variants(productId), product_variants(sku) UNIQUE
	•	product_media(productId, position)
	•	product_variant_option_values(variantId, optionValueId) UNIQUE

API design (tối ưu FE)

Public
	•	GET /products?keyword=&category=&page=&limit= → trả danh sách + minPrice, maxPrice, thumbnail.
	•	GET /products/:slug → trả product + options (Color/Size + values) + variants (nhẹ) [id,sku,priceFinal,stock, optionValueIds] + media (primary, hover first).
	•	GET /variants/:id → khi FE đã chọn đủ option → trả variant chi tiết (giá, tồn, thumbnail riêng).

Admin
	•	POST /products (tạo product + options + media)
	•	POST /products/:id/variants/bulk (tạo matrix biến thể từ các option values)
	•	PATCH /products/:id | /variants/:id (update)
	•	POST /products/:id/media (upload/ordering/isPrimary/isHover)
	•	PATCH /variants/:id/stock (điều chỉnh tồn)
	•	POST /price-rules (tạo rule) → worker cập nhật priceFinal

Logic tối ưu quan trọng
	1.	priceFinal = priceOriginal - discount (hoặc %). Lưu sẵn vào product_variants.priceFinal (denormalize – giảm tính toán runtime).
	2.	Stock: tổng tồn hiển thị = stockOnHand - stockReserved. Khi đặt hàng, tạm giữ vào stockReserved (anti-oversell – chống bán quá số lượng).
	3.	Hover image:
	•	Trong product_media, đánh dấu isHover=true cho 1 ảnh; FE chỉ cần lấy primary + hover.
	•	Nếu hover theo biến thể: lưu variantId trong product_media và ưu tiên ảnh theo variant khi đã chọn option.
	4.	Matrix variant: sinh tự động từ cartesian product (tích Descartes – phép tổ hợp) của option values (VD: 3 màu × 4 size = 12 biến thể).
	5.	Cache (Redis):
	•	Cache GET /products/:slug (JSON).
	•	Bust cache khi cập nhật giá/stock/media.
	6.	Slug: tạo từ title, unique + số hậu tố nếu trùng.
	7.	i18n: nếu cần, tách bảng product_translations (title, description, locale).

Mẫu Entity (TypeORM – rút gọn)

// product.entity.ts
@Entity('products')
@Index(['status', 'updatedAt'])
export class Product {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) slug: string;
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ default: 'published' }) status: 'draft'|'published'|'archived';
  @Column({ type: 'uuid', nullable: true }) defaultVariantId: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

// product_option.entity.ts
@Entity('product_options')
export class ProductOption {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') productId: string;
  @ManyToOne(() => Product) @JoinColumn({ name: 'productId' }) product: Product;
  @Column() name: string; // Color, Size
  @Column({ default: 0 }) position: number;
}

// product_option_value.entity.ts
@Entity('product_option_values')
export class ProductOptionValue {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') productOptionId: string;
  @ManyToOne(() => ProductOption) @JoinColumn({ name: 'productOptionId' }) option: ProductOption;
  @Column() value: string; // Red, M
  @Column({ nullable: true }) hexCode: string;
  @Column({ type: 'jsonb', nullable: true }) meta: any;
}

// product_variant.entity.ts
@Entity('product_variants')
@Index(['productId'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') productId: string;
  @ManyToOne(() => Product) @JoinColumn({ name: 'productId' }) product: Product;

  @Column({ unique: true }) sku: string;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) priceOriginal: string;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) priceFinal: string; // đã tính giảm
  @Column({ default: 'VND' }) currency: string;

  @Column({ type: 'int', default: 0 }) stockOnHand: number;
  @Column({ type: 'int', default: 0 }) stockReserved: number;

  @Column({ nullable: true }) name: string; // “Red / M”
  @Column({ nullable: true }) thumbnailUrl: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

// pivot: variant <-> option values
@Entity('product_variant_option_values')
@Unique(['variantId', 'optionValueId'])
export class ProductVariantOptionValue {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') variantId: string;
  @Column('uuid') optionValueId: string;
}

// product_media.entity.ts
@Entity('product_media')
@Index(['productId', 'position'])
export class ProductMedia {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') productId: string;
  @ManyToOne(() => Product) @JoinColumn({ name: 'productId' }) product: Product;

  @Column() url: string;
  @Column({ default: 'image' }) type: 'image'|'video';
  @Column({ default: 0 }) position: number;
  @Column({ default: false }) isPrimary: boolean;
  @Column({ default: false }) isHover: boolean;

  @Column('uuid', { nullable: true }) variantId: string; // optional
  @Column({ nullable: true }) alt: string;
}

Flow tạo/ cập nhật (gợi ý)
	1.	Create Product → tạo product, options (Color/Size), option_values.
	2.	Generate Variants (bulk): từ các option_values → tạo product_variants + map variant_option_values.
	3.	Set Prices/Stock cho từng variant (bulk update).
	4.	Upload Media → đánh dấu isPrimary & isHover, set position.
	5.	Publish product (status → published), cập nhật defaultVariantId.

Endpoint mẫu (Admin)
	•	POST /admin/products
	•	POST /admin/products/:id/options & /options/:id/values
	•	POST /admin/products/:id/variants/generate (từ ma trận)
	•	PATCH /admin/variants/:id (giá/stock/thumbnail)
	•	POST /admin/products/:id/media (upload + đánh dấu isPrimary/isHover)
	•	POST /admin/price-rules (khuyến mãi theo thời gian)

Nếu bạn muốn, mình viết luôn DTO + Controller + Service (generate matrix variants) để thả thẳng vào dự án NestJS.