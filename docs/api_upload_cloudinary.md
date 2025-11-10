Rất chuẩn — dưới đây là tài liệu hướng dẫn backend triển khai tính năng upload ảnh lên Cloudinary, được viết dạng developer integration document, phù hợp để team backend đọc và implement trực tiếp (NestJS/Express hoặc bất kỳ Node backend nào).

File này có thể đặt trong repo tại:
📁 docs/backend/cloudinary_upload_integration.md

⸻


# ☁️ Cloudinary Upload Integration — Lumé E-Commerce Backend

## 🎯 Objective
Tích hợp Cloudinary để quản lý và lưu trữ ảnh sản phẩm, banner, avatar, v.v…  
API backend sẽ:
- Sinh chữ ký bảo mật (`signature`) cho frontend upload trực tiếp lên Cloudinary.  
- Hoặc thực hiện upload từ backend (nếu frontend chỉ gửi file).  
- Hỗ trợ xóa, truy vấn, và tạo URL tối ưu (resize, crop, format webp,...).

---

## 🧱 1️⃣ Chuẩn bị tài khoản Cloudinary

### Đăng ký tài khoản
- Truy cập: [https://cloudinary.com/](https://cloudinary.com/)  
- Sau khi đăng ký → vào **Dashboard** để lấy thông tin sau:

| Biến | Ý nghĩa |
|------|----------|
| `CLOUDINARY_CLOUD_NAME` | Tên Cloud (dùng trong URL upload) |
| `CLOUDINARY_API_KEY` | API key để ký yêu cầu |
| `CLOUDINARY_API_SECRET` | API secret để tạo chữ ký (chỉ dùng ở backend!) |

---

## ⚙️ 2️⃣ Cấu hình biến môi trường `.env`

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDINARY_UPLOAD_FOLDER=lume_ecom_uploads

Lưu ý:
	•	Không commit .env lên git.
	•	CLOUDINARY_UPLOAD_FOLDER là thư mục mặc định lưu ảnh trên Cloudinary (có thể chia theo module như products/, banners/).

⸻

🧩 3️⃣ Cài đặt thư viện Cloudinary

Option 1: NestJS Backend

Cài package:

# macOS / Linux (zsh)
npm install cloudinary multer-storage-cloudinary multer

# Windows PowerShell
npm install cloudinary multer-storage-cloudinary multer

Cấu hình module cloudinary.provider.ts

import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'Cloudinary',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
    });
    return cloudinary;
  },
};


⸻

🧠 4️⃣ API Design

Base Path: /files

Method	Endpoint	Mô tả
GET	/files/signature	Sinh signature để frontend upload trực tiếp
POST	/files/upload	Upload 1 file từ backend lên Cloudinary
POST	/files/upload-multiple	Upload nhiều file (multipart)
DELETE	/files/:publicId	Xóa file theo publicId
POST	/files/generate-url	Tạo URL ảnh tối ưu (resize, webp,…)


⸻

🧾 5️⃣ API Implementation

🧩 5.1. Generate Signature (Frontend direct upload)

Frontend có thể upload trực tiếp lên Cloudinary nếu có signature hợp lệ.

import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Controller('files')
export class FilesController {
  constructor(private config: ConfigService) {}

  @Get('signature')
  async generateSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = this.config.get('CLOUDINARY_UPLOAD_FOLDER');
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      this.config.get('CLOUDINARY_API_SECRET'),
    );

    return {
      timestamp,
      folder,
      apiKey: this.config.get('CLOUDINARY_API_KEY'),
      cloudName: this.config.get('CLOUDINARY_CLOUD_NAME'),
      signature,
    };
  }
}

Frontend flow:
	1.	Gọi GET /files/signature
	2.	Nhận signature, timestamp, apiKey, cloudName, folder
	3.	Upload trực tiếp đến Cloudinary API endpoint:
https://api.cloudinary.com/v1_1/{cloudName}/image/upload

⸻

🧩 5.2. Upload qua backend (multipart form)

import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'lume_ecom_uploads' },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            success: true,
            public_id: result.public_id,
            url: result.secure_url,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}

✅ Ưu điểm:
	•	Bảo mật hơn (frontend không thấy api_secret)
	•	Dễ xử lý validate / rename file / kiểm soát folder

⸻

🧩 5.3. Delete File

import { Controller, Delete, Param } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Controller('files')
export class FilesController {
  @Delete(':publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: true, result };
  }
}


⸻

🧩 5.4. Generate Optimized URL

@Post('generate-url')
generateUrl(@Body() { publicId, width, height, crop }: any) {
  const url = cloudinary.url(publicId, {
    width: width ?? 600,
    height: height ?? 600,
    crop: crop ?? 'fill',
    format: 'webp',
    secure: true,
  });
  return { optimizedUrl: url };
}


⸻

🔒 6️⃣ Security & Performance Notes

Vấn đề	Giải pháp
Lộ API Secret	Không bao giờ gửi CLOUDINARY_API_SECRET ra frontend
Giới hạn kích thước ảnh	Dùng multer config fileSize ≤ 5MB
Giới hạn loại file	Kiểm tra file.mimetype (chỉ cho phép image/*)
Cache CDN	Bật CDN caching trong Cloudinary dashboard
WebP / AVIF	Luôn tạo URL dạng format: 'auto' để Cloudinary tự chọn định dạng tối ưu
Resize thumbnails	Sử dụng preset width/height khi render danh sách (tối ưu tốc độ FE)


⸻

📦 7️⃣ Response Example

Upload thành công:

{
  "success": true,
  "public_id": "lume_ecom_uploads/products/abc123",
  "url": "https://res.cloudinary.com/lume/image/upload/v1729990123/lume_ecom_uploads/products/abc123.webp",
  "format": "webp",
  "bytes": 245231
}

Xóa ảnh:

{
  "success": true,
  "result": "ok"
}


⸻

📌 8️⃣ Optional — Multiple file upload

@Post('upload-multiple')
@UseInterceptors(FilesInterceptor('files', 10))
async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
  const results = await Promise.all(files.map((file) => this.uploadFile(file)));
  return { success: true, files: results };
}


⸻

✅ Summary

Endpoint	Mục đích
GET /files/signature	Generate Cloudinary upload signature
POST /files/upload	Upload 1 file từ backend
POST /files/upload-multiple	Upload nhiều file
DELETE /files/:publicId	Xóa file
POST /files/generate-url	Tạo URL tối ưu (resize/webp)
