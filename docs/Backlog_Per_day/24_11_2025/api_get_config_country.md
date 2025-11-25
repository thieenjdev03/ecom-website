Ok, làm cái “document cho backend dev” đàng hoàng nha. Coi như mày đưa cho team backend là code được luôn.

⸻

1. Mục tiêu & Phạm vi

Mục tiêu
Xây API backend để tính giá ship dựa trên bảng cấu hình lưu trong Google Sheet. Người không biết code (ops, sale, admin) có thể vào Sheet chỉnh giá, backend tự đọc & FE chỉ gọi API bình thường.

Phạm vi
	•	Đọc dữ liệu cấu hình shipping từ Google Sheet.
	•	Cache (lưu tạm trong RAM) để không spam Google API.
	•	Expose API cho FE:
	•	Tính giá ship dựa trên địa chỉ + cân nặng + phương thức ship.

Giả định backend dùng NestJS, nhưng doc này đủ generic cho Node backend khác.

⸻

2. Cấu trúc Google Sheet

2.1. Sheet structure

Tạo 1 Google Sheet với 1 tab tên shipping_config.

Row 1 là header:

A	B	C	D	E	F	G	H
country	province	district	shipping_method	min_weight	max_weight	price	active

Giải thích cột:
	•	country – mã quốc gia (VD: VN, US).
	•	province – tên / mã tỉnh thành.
	•	district – tên / mã quận/huyện.
	•	shipping_method – loại vận chuyển (VD: standard, express).
	•	min_weight – cân nặng nhỏ nhất (gram).
	•	max_weight – cân nặng lớn nhất (gram).
	•	price – giá ship (đơn vị tiền tệ do hệ thống quy ước, VD: VND).
	•	active – TRUE / FALSE, rule có được dùng không.

Ví dụ vài dòng:

country	province	district	shipping_method	min_weight	max_weight	price	active
VN	HCM	Quan 1	standard	0	1000	25000	TRUE
VN	HCM	Quan 1	express	0	1000	40000	TRUE
VN	HCM	Quan 3	standard	0	1000	28000	TRUE


⸻

3. Thiết kế tổng thể Backend

3.1. Luồng dữ liệu
	1.	Admin cập nhật Google Sheet.
	2.	Backend có ShippingConfigService:
	•	Đọc toàn bộ sheet qua Google Sheets API.
	•	Parse thành array các ShippingRule.
	•	Lưu trong cache (in-memory hoặc Redis).
	3.	FE khi cần giá ship:
	•	Gửi request: GET /shipping/price?country=VN&province=HCM&district=Quan%201&weight=750&method=standard
	•	Backend đọc từ cache → tìm rule phù hợp → trả về giá.

3.2. Thành phần chính
	•	ShippingConfigService
	•	Chịu trách nhiệm:
	•	Kết nối Google Sheets
	•	Load & parse data
	•	Cache dữ liệu
	•	Cung cấp hàm getPrice() cho các controller/service khác.
	•	ShippingController
	•	Expose endpoints cho FE:
	•	GET /shipping/price
	•	(tuỳ chọn) GET /shipping/config để debug.
	•	Config / Env
	•	GOOGLE_SHEETS_ID – ID của Google Sheet.
	•	GOOGLE_SHEETS_RANGE – Range đọc, ví dụ: shipping_config!A2:H1000.
	•	Thông tin service account (JSON) hoặc biến môi trường cho Google Auth.

⸻

4. Thiết kế API

4.1. Endpoint: Lấy giá ship

Method: GET
Path: /shipping/price

Query params:
	•	country (string, required)
	•	province (string, required)
	•	district (string, required)
	•	weight (number, required) – đơn vị gram
	•	method (string, optional, default standard) – tương ứng shipping_method

Response 200:

{
  "currency": "VND",
  "price": 25000,
  "matchedRule": {
    "country": "VN",
    "province": "HCM",
    "district": "Quan 1",
    "shipping_method": "standard",
    "min_weight": 0,
    "max_weight": 1000
  }
}

Response 404 (không tìm thấy rule phù hợp):

{
  "statusCode": 404,
  "message": "No shipping rule matched",
  "error": "Not Found"
}

Validation rules:
	•	weight > 0
	•	country/province/district không rỗng
	•	method thuộc danh sách support (VD: standard, express…)

⸻

5. Data Model & Type (TypeScript / NestJS)

5.1. ShippingRule interface

export interface ShippingRule {
  country: string;
  province: string;
  district: string;
  shipping_method: string;
  min_weight: number;
  max_weight: number;
  price: number;
  active: boolean;
}

5.2. DTO cho request

// GET /shipping/price
export class GetShippingPriceDto {
  @IsString()
  country: string;

  @IsString()
  province: string;

  @IsString()
  district: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  weight: number;

  @IsOptional()
  @IsString()
  method?: string; // default 'standard'
}


⸻

6. Triển khai ShippingConfigService

6.1. Trách nhiệm chính
	1.	Kết nối Google Sheets API
	•	Dùng service account (tài khoản dịch vụ) với quyền read.
	•	Share Google Sheet cho email của service account.
	2.	Đọc dữ liệu từ Sheet
	•	Gọi spreadsheets.values.get với range shipping_config!A2:H1000.
	•	Mỗi row map thành ShippingRule.
	3.	Cache & reload
	•	Lưu this.rules: ShippingRule[].
	•	Lưu this.lastLoadedAt: Date.
	•	Đặt TTL (Time-To-Live – thời gian sống của cache) ví dụ 10 phút.
	•	Nếu quá TTL → tự reload trước khi xử lý request mới.
	4.	Logic tìm rule
	•	Filter theo:
	•	active === true
	•	country/province/district/method match (so sánh lowercase/trim).
	•	min_weight <= weight <= max_weight.
	•	Nếu nhiều rule khớp → ưu tiên:
	•	range cân nặng khít nhất (ví dụ dùng max_weight - min_weight nhỏ nhất).
	•	hoặc ưu tiên rule có province/district cụ thể hơn (nếu mày có implement fallback kiểu “toàn quốc”).

6.2. Pseudo code service

@Injectable()
export class ShippingConfigService {
  private rules: ShippingRule[] = [];
  private lastLoadedAt: Date | null = null;
  private readonly ttlMs = 10 * 60 * 1000; // 10 phút

  constructor(
    // inject GoogleSheetsClient hoặc tự viết wrapper
  ) {}

  private isExpired(): boolean {
    if (!this.lastLoadedAt) return true;
    return Date.now() - this.lastLoadedAt.getTime() > this.ttlMs;
  }

  async ensureLoaded() {
    if (!this.isExpired()) return;
    await this.loadFromSheet();
  }

  async loadFromSheet() {
    // 1. Gọi Google Sheets API đọc values
    // 2. Map từng hàng -> ShippingRule
    // 3. Filter những dòng không hợp lệ (thiếu cột bắt buộc)
    // 4. Gán vào this.rules

    this.rules = mappedRules;
    this.lastLoadedAt = new Date();
  }

  async getPrice(params: {
    country: string;
    province: string;
    district: string;
    weight: number;
    method?: string;
  }): Promise<{ price: number; rule: ShippingRule } | null> {
    await this.ensureLoaded();

    const method = params.method || 'standard';
    const weight = params.weight;

    const normalized = (s: string) =>
      s?.trim().toLowerCase() || '';

    const candidates = this.rules.filter((r) => {
      return (
        r.active &&
        normalized(r.country) === normalized(params.country) &&
        normalized(r.province) === normalized(params.province) &&
        normalized(r.district) === normalized(params.district) &&
        normalized(r.shipping_method) === normalized(method) &&
        weight >= r.min_weight &&
        weight <= r.max_weight
      );
    });

    if (!candidates.length) {
      return null;
    }

    // simple: lấy rule đầu tiên
    const rule = candidates[0];
    return { price: rule.price, rule };
  }
}


⸻

7. ShippingController

Controller NestJS gọi service trên:

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingConfigService: ShippingConfigService) {}

  @Get('price')
  async getPrice(@Query() query: GetShippingPriceDto) {
    const method = query.method || 'standard';

    const result = await this.shippingConfigService.getPrice({
      country: query.country,
      province: query.province,
      district: query.district,
      weight: query.weight,
      method,
    });

    if (!result) {
      throw new NotFoundException('No shipping rule matched');
    }

    return {
      currency: 'VND', // hoặc đọc từ config
      price: result.price,
      matchedRule: {
        country: result.rule.country,
        province: result.rule.province,
        district: result.rule.district,
        shipping_method: result.rule.shipping_method,
        min_weight: result.rule.min_weight,
        max_weight: result.rule.max_weight,
      },
    };
  }

  // optional: endpoint reload config thủ công
  @Post('config/reload')
  @HttpCode(204)
  async reloadConfig() {
    await this.shippingConfigService.loadFromSheet();
  }
}


⸻

8. Kết nối Google Sheets API (tóm tắt)

8.1. Chuẩn bị trên Google Cloud
	1.	Tạo project trên Google Cloud Console.
	2.	Enable API: Google Sheets API.
	3.	Tạo Service Account.
	4.	Tạo key dạng JSON cho service account → lưu file google-service-account.json.
	5.	Lấy email của service account, share Google Sheet cho email đó với quyền Viewer.

8.2. Cấu hình trong backend
	•	Lưu file JSON trong server (hoặc biến môi trường).
	•	Biến môi trường:

GOOGLE_SHEETS_ID=xxxxxxx   # ID trong URL của sheet
GOOGLE_SHEETS_RANGE=shipping_config!A2:H1000
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-service-account.json

	•	Trong code Node/Nest, dùng lib googleapis để tạo auth client và gọi Sheets.