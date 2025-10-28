# 💳 PayPal Sandbox Integration (Local Development Guide)

## 🧭 Mục tiêu
Tài liệu này hướng dẫn cách **tích hợp PayPal thanh toán và webhook** vào hệ thống backend (ví dụ NestJS) và **test toàn bộ flow ở local** thông qua PayPal Sandbox.

---

## ⚙️ 1️⃣ Chuẩn bị môi trường

### 📋 Tạo ứng dụng Sandbox
1. Truy cập [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications)
2. Chọn tab **Sandbox → Create App**
3. Đặt tên app (ví dụ `Lume Ecom Dev`)
4. Ghi lại:
   - **Client ID**
   - **Secret**

---

### 📦 Cài đặt package

```bash
npm install @paypal/checkout-server-sdk body-parser
```

---

### ⚙️ Cấu hình biến môi trường (`.env.local`)

```bash
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-secret
PAYPAL_WEBHOOK_ID=will_add_later
PAYPAL_MODE=sandbox
```

---

## 🧱 2️⃣ Cấu trúc thư mục đề xuất

```
src/
 ├── paypal/
 │    ├── paypal.module.ts
 │    ├── paypal.service.ts
 │    └── paypal.controller.ts
 └── main.ts
.env.local
```

---

## 🧩 3️⃣ Cấu hình PayPal SDK

**`src/paypal/paypal.service.ts`**
```ts
import { Injectable } from '@nestjs/common';
import paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaypalService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    const env =
      process.env.PAYPAL_MODE === 'live'
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET,
          )
        : new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET,
          );

    this.client = new paypal.core.PayPalHttpClient(env);
  }

  getClient() {
    return this.client;
  }
}
```

---

## 🌐 4️⃣ Tạo Webhook Endpoint

**`src/paypal/paypal.controller.ts`**
```ts
import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import paypal from '@paypal/checkout-server-sdk';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req, @Res() res) {
    const headers = req.headers;
    const event = req.body;
    const client = this.paypalService.getClient();

    try {
      const verify = await paypal.notification.webhookEvent.verify(
        headers['paypal-transmission-id'],
        headers['paypal-transmission-time'],
        event,
        headers['paypal-transmission-sig'],
        headers['paypal-cert-url'],
        headers['paypal-auth-algo'],
        process.env.PAYPAL_WEBHOOK_ID,
        client,
      );

      if (verify.verification_status === 'SUCCESS') {
        console.log(`✅ Verified: ${event.event_type}`);
        switch (event.event_type) {
          case 'PAYMENT.CAPTURE.COMPLETED':
            console.log('💰 Payment success:', event.resource);
            break;
          case 'CHECKOUT.ORDER.APPROVED':
            console.log('🟢 Order approved:', event.resource);
            break;
        }
      } else {
        console.warn('⚠️ Webhook verification failed');
      }

      res.status(200).send('OK');
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
      res.status(400).send('Error');
    }
  }
}
```

---

## 🧩 5️⃣ Module Setup

**`src/paypal/paypal.module.ts`**
```ts
import { Module } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';

@Module({
  controllers: [PaypalController],
  providers: [PaypalService],
})
export class PaypalModule {}
```

**`src/app.module.ts`**
```ts
import { Module } from '@nestjs/common';
import { PaypalModule } from './paypal/paypal.module';

@Module({
  imports: [PaypalModule],
})
export class AppModule {}
```

---

## 🚀 6️⃣ Expose Localhost qua ngrok

### Chạy server
```bash
npm run start:dev
```

### Mở tunnel với ngrok
```bash
# macOS / Linux
brew install ngrok
ngrok http 3000

# Windows PowerShell
choco install ngrok
ngrok http 3000
```

Ngrok sẽ tạo 1 URL như:
```
https://abc123.ngrok.io
```

---

## 🔗 7️⃣ Tạo Webhook trên PayPal Sandbox

1. Truy cập **Developer Dashboard → My Apps → Webhooks**
2. Nhấn **Add Webhook**
3. Dán URL:
   ```
   https://abc123.ngrok.io/paypal/webhook
   ```
4. Chọn event:
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`
5. Lưu lại → Lấy **Webhook ID**
6. Dán vào `.env.local`

---

## 💳 8️⃣ Test Sandbox Payment

### A. Tạo đơn hàng bằng API
```bash
curl -v -X POST https://api-m.sandbox.paypal.com/v2/checkout/orders -u "YOUR_CLIENT_ID:YOUR_SECRET" -H "Content-Type: application/json" -d '{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "amount": {
        "currency_code": "USD",
        "value": "5.00"
      }
    }
  ]
}'
```

Kết quả trả về có `approve_url`.  
Mở URL đó trong trình duyệt sandbox → đăng nhập bằng tài khoản buyer test để thanh toán.

---

### B. Kiểm tra webhook callback

Khi thanh toán xong, PayPal sẽ tự động gửi webhook đến:
```
https://abc123.ngrok.io/paypal/webhook
```

Xem log trong terminal:
```
✅ Verified: PAYMENT.CAPTURE.COMPLETED
💰 Payment success: { ... }
```

---

## 🧪 9️⃣ Debug & Kiểm tra sự kiện

- Truy cập `http://127.0.0.1:4040` để xem log request của ngrok  
- Xem lại event tại PayPal Dashboard → **Webhook events**
- Nếu không có event:
  - Kiểm tra ngrok có đang hoạt động
  - Kiểm tra đúng Webhook URL
  - Kiểm tra header signature có bị mất không

---

## 🌍 🔁 10️⃣ Deploy lên Production

1. Cập nhật `.env.production`:
   ```bash
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=your-live-client-id
   PAYPAL_CLIENT_SECRET=your-live-secret
   PAYPAL_WEBHOOK_ID=your-live-webhook-id
   ```
2. Cập nhật webhook URL trên PayPal Dashboard:
   ```
   https://api.yourdomain.com/paypal/webhook
   ```
3. Deploy backend lên server → test real transaction.

---

## ✅ Kết quả mong đợi

| Bước | Kết quả |
|------|----------|
| Tạo order sandbox | Thành công (status: CREATED) |
| Thanh toán bằng sandbox buyer | Thành công (status: COMPLETED) |
| Webhook callback | Nhận được event `PAYMENT.CAPTURE.COMPLETED` |
| Verify chữ ký | `verification_status = SUCCESS` |

---

## 🧠 Gợi ý mở rộng
- Thêm API `/paypal/create-order` và `/paypal/capture-order` để tích hợp frontend dễ hơn  
- Log webhook ra DB để tracking transaction  
- Bổ sung retry logic nếu webhook thất bại  
- Kiểm tra kỹ signature trước khi xử lý để tránh spoofing  

---

**Author:** Dev Team — *Ecom_Project / PayPal Integration*
