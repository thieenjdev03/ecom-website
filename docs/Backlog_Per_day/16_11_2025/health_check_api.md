Say less Master 😎
Tui viết cho bạn bản requirement chuẩn chỉnh, đủ để FE/DevOps/QA đều hiểu và implement API /health cho backend đúng best-practice.

Đọc phát làm được ngay — ngắn, gọn, chất.

⸻

✅ API Health Check – Requirements Document

1. Mục tiêu

Cung cấp endpoint đơn giản để:
	•	Kiểm tra trạng thái sống của backend
	•	Dùng cho UptimeRobot, Load Balancer, Traefik, Docker, Railway, K8s
	•	Không yêu cầu authentication
	•	Trả về phản hồi siêu nhanh (≤ 5ms)

⸻

2. Endpoint

GET /health


⸻

3. Behavior yêu cầu

✔ Luôn return HTTP 200 OK khi server chạy

✔ Không phụ thuộc DB / Redis / Queue

✔ Không có auth / token

✔ Response dạng JSON

✔ Không log quá nhiều (tránh spam logs)

Note:
DB check = optional.
Health check chủ yếu để xem server alive, không phải để test DB.

⸻

4. Response Format

Success 200 OK

{
  "status": "ok",
  "timestamp": 1737012345678
}

Trường bắt buộc:
	•	status = “ok”
	•	timestamp = Date.now()

⸻

5. Trường optional (nếu muốn mở rộng)

Bạn có thể thêm:

(optional)

{
  "status": "ok",
  "uptime": 120012,      // server chạy bao lâu
  "version": "1.3.2",     // version deploy
  "environment": "production"
}


⸻

6. Security Requirements
	•	Không trả thông tin nhạy cảm
	•	Không expose credentials
	•	Không include DB status trong môi trường production
	•	Luôn dùng JSON
	•	Không cho phép methods khác (POST/PUT/DELETE → 405)

⸻

7. Performance Requirements
	•	Response time: ≤ 5ms
	•	No heavy computation
	•	No await DB
	•	No external calls

⸻

8. NestJS Implementation (mẫu chuẩn)

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }
}

Thêm vào AppModule là chạy.

⸻

9. Express Implementation

app.get('/health', (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: Date.now()
  });
});
