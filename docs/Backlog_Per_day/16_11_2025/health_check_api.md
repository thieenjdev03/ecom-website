Alright Master 😎
Tui viết lại DOCUMENT CHUẨN, tối ưu để backend đọc vào là implement được ngay — có hỗ trợ HEAD + GET, có tiêu chuẩn, có logic, có lưu ý quan trọng.

Đây là bản Health Check API Requirement v2 (HEAD Supported).

⸻

🧾 HEALTH CHECK API – REQUIREMENTS (HEAD SUPPORT EDITION)

1. Mục tiêu

Cung cấp endpoint kiểm tra trạng thái server dùng được cho:
	•	UptimeRobot (HEAD request)
	•	Railway keep-alive
	•	Load Balancer / API Gateway / Traefik
	•	CI/CD Smoke Test
	•	Docker / Kubernetes health probes

Backend phải hỗ trợ cả HEAD và GET.

⸻

2. Endpoint

GET  /health
HEAD /health


⸻

3. Yêu cầu hành vi (Behavior)

➤ GET /health
	•	Trả về JSON body
	•	HTTP status = 200 OK
	•	Không yêu cầu authentication
	•	Không cần check database hoặc external service

Response sample:

{
  "status": "ok",
  "timestamp": 1712345678901
}


⸻

➤ HEAD /health
	•	Must return: 200 OK
	•	Must NOT redirect
	•	Must NOT return body
	•	Must NOT throw exception
	•	Must NOT require authentication
	•	Must be extremely fast (0–2ms)

Response:

HTTP/1.1 200 OK
Content-Length: 0


⸻

4. Functional Requirements

✔ Không phụ thuộc database

Health check chỉ xác định server có đang chạy hay không, không phải test hệ thống.

✔ Không log HEAD request

HEAD gọi 288 lần/ngày (5 phút/lần). Logging HEAD sẽ spam log.

✔ Không cho phép method không hợp lệ
	•	OPTIONS → cho phép
	•	POST/PUT/DELETE → trả 405 Method Not Allowed

⸻

5. Security Requirements
	•	Không được expose dữ liệu nhạy cảm
	•	Không require JWT/Auth
	•	Không trả version nội bộ (nếu có → dùng GET optional fields)

⸻

6. Performance Requirements
	•	HEAD xử lý < 2ms
	•	GET xử lý < 5ms
	•	Không được thực hiện công việc async nặng (no await DB, no HTTP call)

⸻

7. Response Structure (GET)

Required fields

Field	Type	Description
status	string	luôn là "ok"
timestamp	number	Date.now()

Optional fields (đề xuất)

Ví dụ khi muốn mở rộng:

{
  "status": "ok",
  "timestamp": 1712345678901,
  "version": "1.4.2",
  "env": "production",
  "uptime": 1234567
}


⸻

8. Implementation Reference

✔ NestJS Example (chuẩn HEAD support)

import { Controller, Get, Head } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }

  @Head()
  headHealth() {
    return; // auto 200, no body
  }
}


⸻

✔ Express Example

app.head('/health', (req, res) => {
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
  });
});


⸻

9. Use Cases

System	Method Used	Works
UptimeRobot	HEAD	✔
Railway Sleep Prevent	HEAD	✔
Docker healthcheck	GET or CMD	✔
Kubernetes	GET or HEAD	✔
Traefik / Nginx LB	HEAD	✔


⸻

10. Acceptance Criteria (QA Check)

✓ GET /health
	•	200 OK
	•	JSON body hợp lệ
	•	status = "ok"
	•	timestamp là số

✓ HEAD /health
	•	200 OK
	•	Không chứa body
	•	Không redirect
	•	Không timeout