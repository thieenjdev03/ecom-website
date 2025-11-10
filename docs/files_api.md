## Files API — Frontend Integration Guide

This document explains how the frontend can interact with the `files` module to upload images to Cloudinary, delete them, retrieve info, and generate optimized URLs.

Base path: `/files`

**Important Notes:**
- ✅ Cloudinary integration is fully enabled
- ⚠️ **File restrictions**: Only image files are allowed, maximum file size is **5MB**
- 📁 Default folder: If not specified, files are uploaded to `CLOUDINARY_UPLOAD_FOLDER` (default: `lume_ecom_uploads`)
- All examples assume the API base URL is available in the frontend (e.g., `API_URL`)

### Endpoints at a glance
- `GET /files/signature` — Generate Cloudinary upload signature (optional `folder`, `publicId`).
- `POST /files/upload` — Upload a single file (multipart/form-data).
- `POST /files/upload-multiple` — Upload multiple files (multipart/form-data).
- `DELETE /files/:publicId` — Delete a file by public ID (optional body `resourceType`).
- `GET /files/:publicId` — Get file information (optional body `resourceType`).
- `POST /files/generate-url` — Generate an optimized image URL.
- `GET /files/thumbnail/:publicId` — Generate a thumbnail URL.
- `GET /files/gallery/:publicId` — Generate a gallery-sized URL.

### Types (request body fields)
- `folder` (string, optional): Cloudinary folder path, e.g., `products`.
- `publicId` (string, optional): Desired public ID for the asset, e.g., `product_123_image`.
- `resourceType` (string, optional): One of `image | video | raw | auto` (delete/info accepts `image | video | raw`).
- Optimize fields for URL generation:
  - `width` (number, optional)
  - `height` (number, optional)
  - `crop` (string, optional)
  - `quality` (string, optional)
  - `format` (string, optional)

---

### 1) Generate signature (optional for client uploads)
Endpoint: `GET /files/signature`

Use this endpoint if you want to upload directly from frontend to Cloudinary.

Request body (JSON, optional):
```json
{
  "folder": "products",
  "publicId": "product_123_image"
}
```

Response (200):
```json
{
  "signature": "abc123def456ghi789",
  "timestamp": 1704067200,
  "cloudName": "your-cloud-name",
  "apiKey": "your-api-key",
  "folder": "lume_ecom_uploads"
}
```

**Note**: If `folder` is not provided in request, it defaults to `CLOUDINARY_UPLOAD_FOLDER` (usually `lume_ecom_uploads`).

Curl example:
```bash
curl -X GET "$API_URL/files/signature" \
  -H "Content-Type: application/json" \
  -d '{"folder":"products","publicId":"product_123_image"}'
```

Axios example (frontend):
```ts
const { data } = await axios.get(`${API_URL}/files/signature`, {
  data: { folder: 'products', publicId: 'product_123_image' },
  headers: { 'Content-Type': 'application/json' },
});
```

Note: Some environments/browsers do not send a body with GET. If that is an issue, omit `data` or pass no body and rely on defaults; or coordinate a POST change with the backend.

---

### 2) Upload a single file
Endpoint: `POST /files/upload`

Content type: `multipart/form-data`

**File Restrictions:**
- ✅ Only image files allowed (`image/*` mimetype)
- ✅ Maximum file size: **5MB**
- ❌ Other file types will be rejected

Form fields:
- `file` (binary, **required**) - Image file to upload
- `folder` (string, optional) - Cloudinary folder path (defaults to `lume_ecom_uploads`)
- `publicId` (string, optional) - Custom public ID for the file
- `resourceType` (string, optional: `image|video|raw|auto`) - Default: `image`

Response (201):
```json
{
  "success": true,
  "public_id": "lume_ecom_uploads/products/abc123",
  "url": "https://res.cloudinary.com/lume/image/upload/v1729990123/lume_ecom_uploads/products/abc123.webp",
  "format": "webp",
  "bytes": 245231,
  "width": 800,
  "height": 600
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Only image files are allowed"
}
```
hoặc
```json
{
  "success": false,
  "message": "File size exceeds 5MB limit"
}
```

Curl example:
```bash
curl -X POST "$API_URL/files/upload" \
  -H "Accept: application/json" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=products" \
  -F "publicId=product_123_image" \
  -F "resourceType=image"
```

Axios example (frontend):
```ts
const form = new FormData();
form.append('file', file); // File from <input type="file"/>
form.append('folder', 'products'); // Optional: defaults to lume_ecom_uploads
form.append('publicId', 'product_123_image'); // Optional
form.append('resourceType', 'image'); // Optional: defaults to 'image'

try {
  const { data } = await axios.post(`${API_URL}/files/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  console.log('Upload successful:', data);
  console.log('File URL:', data.url);
  console.log('Public ID:', data.public_id);
} catch (error) {
  if (error.response?.data?.message) {
    console.error('Upload failed:', error.response.data.message);
  }
}
```

**React example with file validation:**
```tsx
const handleFileUpload = async (file: File) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Chỉ cho phép upload file ảnh');
    return;
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File không được vượt quá 5MB');
    return;
  }
  
  const form = new FormData();
  form.append('file', file);
  form.append('folder', 'products');
  
  try {
    const { data } = await axios.post(`${API_URL}/files/upload`, form);
    // data.success === true
    // data.public_id, data.url, etc.
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

---

### 3) Upload multiple files
Endpoint: `POST /files/upload-multiple`

Content type: `multipart/form-data`

**File Restrictions:**
- ✅ Only image files allowed
- ✅ Maximum file size: **5MB per file**
- ✅ Maximum **10 files** per request

Form fields:
- `files` (array of binary, **required**) - Multiple image files (max 10)
- `folder` (string, optional) - Cloudinary folder path (defaults to `lume_ecom_uploads`)

Response (201):
```json
{
  "success": true,
  "files": [
    {
      "success": true,
      "public_id": "lume_ecom_uploads/products/file1",
      "url": "https://res.cloudinary.com/lume/image/upload/v1729990123/lume_ecom_uploads/products/file1.webp",
      "format": "webp",
      "bytes": 245231,
      "width": 800,
      "height": 600
    },
    {
      "success": true,
      "public_id": "lume_ecom_uploads/products/file2",
      "url": "https://res.cloudinary.com/lume/image/upload/v1729990124/lume_ecom_uploads/products/file2.webp",
      "format": "webp",
      "bytes": 198765,
      "width": 800,
      "height": 600
    }
  ]
}
```

Curl example:
```bash
curl -X POST "$API_URL/files/upload-multiple" \
  -H "Accept: application/json" \
  -F "files=@/path/img1.jpg" \
  -F "files=@/path/img2.jpg" \
  -F "folder=products"
```

Axios example (frontend):
```ts
const form = new FormData();
files.forEach(f => form.append('files', f)); // Array of File objects
form.append('folder', 'products'); // Optional

try {
  const { data } = await axios.post(`${API_URL}/files/upload-multiple`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  // data.success === true
  // data.files is an array of uploaded file results
  data.files.forEach((file: any) => {
    console.log('Uploaded:', file.public_id, file.url);
  });
} catch (error) {
  console.error('Upload error:', error);
}
```

**React example:**
```tsx
const handleMultipleUpload = async (files: FileList) => {
  // Validate file count
  if (files.length > 10) {
    alert('Tối đa 10 file mỗi lần upload');
    return;
  }
  
  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) {
      alert(`File ${i + 1} không phải là ảnh`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(`File ${i + 1} vượt quá 5MB`);
      return;
    }
  }
  
  const form = new FormData();
  Array.from(files).forEach(f => form.append('files', f));
  form.append('folder', 'products');
  
  const { data } = await axios.post(`${API_URL}/files/upload-multiple`, form);
  return data.files; // Array of uploaded files
};
```

---

### 4) Delete a file
Endpoint: `DELETE /files/:publicId`

Optional body (JSON):
```json
{ "resourceType": "image" }
```

Response (200):
```json
{
  "success": true,
  "result": "ok"
}
```

**Note**: `result` can be `"ok"` (success) or `"not found"` (file doesn't exist).

Curl example:
```bash
curl -X DELETE "$API_URL/files/products/product_123_image" \
  -H "Content-Type: application/json" \
  -d '{"resourceType":"image"}'
```

---

### 5) Get file info
Endpoint: `GET /files/:publicId`

Optional body (JSON):
```json
{ "resourceType": "image" }
```

Response (200): Cloudinary-like resource info.

Curl example:
```bash
curl -X GET "$API_URL/files/products/product_123_image" \
  -H "Content-Type: application/json" \
  -d '{"resourceType":"image"}'
```

---

### 6) Generate optimized image URL
Endpoint: `POST /files/generate-url`

Generate an optimized URL with transformations. Perfect for displaying images with specific dimensions and formats.

**Default values** (if not provided):
- `width`: 600
- `height`: 600
- `crop`: `fill`
- `format`: `auto` (Cloudinary will automatically choose best format: WebP/AVIF based on browser)
- `quality`: `auto`

Body (JSON):
```json
{
  "publicId": "lume_ecom_uploads/products/product_123_image",
  "width": 800,
  "height": 600,
  "crop": "fill",
  "quality": "auto",
  "format": "auto"
}
```

Response (200):
```json
{
  "optimizedUrl": "https://res.cloudinary.com/lume/image/upload/w_600,h_600,c_fill,q_auto,f_auto/lume_ecom_uploads/products/product_123_image.webp"
}
```

**Note**: Response field is `optimizedUrl` (not `url`).

Axios example (frontend):
```ts
// With custom dimensions
const { data } = await axios.post(`${API_URL}/files/generate-url`, {
  publicId: 'lume_ecom_uploads/products/product_123_image',
  width: 800,
  height: 600,
  crop: 'fill',
  quality: 'auto',
  format: 'auto',
});
console.log('Optimized URL:', data.optimizedUrl);

// With defaults (600x600, fill, auto format)
const { data: defaultData } = await axios.post(`${API_URL}/files/generate-url`, {
  publicId: 'lume_ecom_uploads/products/product_123_image',
});
console.log('Default optimized URL:', defaultData.optimizedUrl);
```

**Usage in React:**
```tsx
<img 
  src={optimizedUrl} 
  alt="Product"
  loading="lazy"
/>
```

---

### 7) Thumbnail URL
Endpoint: `GET /files/thumbnail/:publicId`

Response (200): `{ "url": "..." }`

Example:
```bash
curl -X GET "$API_URL/files/thumbnail/products/product_123_image"
```

---

### 8) Gallery URL
Endpoint: `GET /files/gallery/:publicId`

Response (200): `{ "url": "..." }`

Example:
```bash
curl -X GET "$API_URL/files/gallery/products/product_123_image"
```

---

---

## Frontend Usage Tips & Best Practices

### ✅ Recommended Approach: Upload via Backend
For most cases, use `POST /files/upload` or `POST /files/upload-multiple`. This is more secure and easier to handle:
- ✅ Backend validates files (type, size)
- ✅ Backend controls folder structure
- ✅ No need to expose Cloudinary credentials

### 📤 Alternative: Direct Cloudinary Upload
If you need direct upload from frontend to Cloudinary:
1. Call `GET /files/signature` to get upload credentials
2. Upload directly to Cloudinary API: `https://api.cloudinary.com/v1_1/{cloudName}/image/upload`
3. Use the signature, timestamp, and apiKey from step 1

### 🖼️ Image Optimization
Always use optimized URLs for displaying images:
- Use `POST /files/generate-url` for custom dimensions
- Use `GET /files/thumbnail/:publicId` for thumbnails (300x300)
- Use `GET /files/gallery/:publicId` for gallery images (800x600)
- Cloudinary automatically serves WebP/AVIF for supported browsers

### ⚠️ Important Restrictions
- **File type**: Only `image/*` files allowed
- **File size**: Maximum **5MB** per file
- **Multiple upload**: Maximum **10 files** per request
- Files exceeding these limits will be rejected with error response

### 📝 Response Format Summary
All successful responses include `success: true`:
```json
// Upload single
{ "success": true, "public_id": "...", "url": "...", "format": "...", "bytes": ... }

// Upload multiple
{ "success": true, "files": [...] }

// Delete
{ "success": true, "result": "ok" }

// Generate URL
{ "optimizedUrl": "..." }
```

### 🔄 Error Handling
Always handle errors appropriately:
```ts
try {
  const { data } = await axios.post(`${API_URL}/files/upload`, form);
  if (data.success) {
    // Handle success
  }
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error (file type/size)
    console.error(error.response.data.message);
  } else {
    // Other errors
    console.error('Upload failed:', error);
  }
}
```

---

## Complete React Example

```tsx
import { useState } from 'react';
import axios from 'axios';

const FileUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert(`File ${i + 1} không phải là ảnh`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${i + 1} vượt quá 5MB`);
        return;
      }
    }

    setUploading(true);
    try {
      const form = new FormData();
      if (files.length === 1) {
        // Single upload
        form.append('file', files[0]);
        form.append('folder', 'products');
        const { data } = await axios.post(`${API_URL}/files/upload`, form);
        setUploadedFiles([data]);
      } else {
        // Multiple upload
        Array.from(files).forEach(f => form.append('files', f));
        form.append('folder', 'products');
        const { data } = await axios.post(`${API_URL}/files/upload-multiple`, form);
        setUploadedFiles(data.files);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Đang upload...</p>}
      {uploadedFiles.map((file, idx) => (
        <div key={idx}>
          <img src={file.url} alt={`Uploaded ${idx + 1}`} />
          <p>Public ID: {file.public_id}</p>
        </div>
      ))}
    </div>
  );
};
```


