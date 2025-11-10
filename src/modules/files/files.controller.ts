import { Controller, Post, Get, Delete, UploadedFile, UploadedFiles, UseInterceptors, Body, Param } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { 
  GenerateSignatureDto, 
  UploadFileDto, 
  DeleteFileDto, 
  GetFileInfoDto,
  GenerateUrlDto 
} from './dto/file-upload.dto';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('signature')
  @ApiOperation({ 
    summary: 'Generate Cloudinary signature',
    description: 'Generates a Cloudinary signature for client-side uploads with optional folder and public ID.'
  })
  @ApiResponse({
    status: 200,
    description: 'Cloudinary signature generated successfully',
    schema: {
      example: {
        signature: 'abc123def456ghi789',
        timestamp: 1704067200,
        cloudName: 'your-cloud-name',
        apiKey: 'your-api-key',
        folder: 'lume_ecom_uploads'
      }
    }
  })
  getCloudinarySignature(@Body() options?: GenerateSignatureDto) {
    return this.filesService.generateCloudinarySignature(options?.folder, options?.publicId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  }))
  @ApiOperation({ 
    summary: 'Upload file to Cloudinary',
    description: 'Uploads a single file to Cloudinary with optional transformations and folder organization.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with optional parameters',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload'
        },
        folder: {
          type: 'string',
          description: 'Cloudinary folder path',
          example: 'products'
        },
        publicId: {
          type: 'string',
          description: 'Public ID for the file',
          example: 'product_123_image'
        },
        resourceType: {
          type: 'string',
          enum: ['image', 'video', 'raw', 'auto'],
          description: 'Resource type',
          example: 'image'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      example: {
        success: true,
        public_id: 'lume_ecom_uploads/products/abc123',
        url: 'https://res.cloudinary.com/lume/image/upload/v1729990123/lume_ecom_uploads/products/abc123.webp',
        format: 'webp',
        bytes: 245231,
        width: 800,
        height: 600
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or upload parameters',
    schema: {
      example: {
        success: false,
        message: 'Invalid file format or size'
      }
    }
  })
  uploadFile(@UploadedFile() file: Express.Multer.File, @Body() options?: UploadFileDto) {
    return this.filesService.uploadFile(file, options);
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  }))
  @ApiOperation({ 
    summary: 'Upload multiple files to Cloudinary',
    description: 'Uploads multiple files to Cloudinary in batch with optional transformations.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple files upload',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          },
          description: 'Files to upload'
        },
        folder: {
          type: 'string',
          description: 'Cloudinary folder path',
          example: 'products'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    schema: {
      example: {
        success: true,
        files: [
          {
            success: true,
            public_id: 'lume_ecom_uploads/products/file1',
            url: 'https://res.cloudinary.com/lume/image/upload/v1729990123/lume_ecom_uploads/products/file1.webp',
            format: 'webp',
            bytes: 245231,
            width: 800,
            height: 600
          },
          {
            success: true,
            public_id: 'lume_ecom_uploads/products/file2',
            url: 'https://res.cloudinary.com/lume/image/upload/v1729990124/lume_ecom_uploads/products/file2.webp',
            format: 'webp',
            bytes: 198765,
            width: 800,
            height: 600
          }
        ]
      }
    }
  })
  uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[], @Body() options?: UploadFileDto) {
    return this.filesService.uploadMultipleFiles(files, options);
  }

  @Delete(':publicId')
  @ApiOperation({ 
    summary: 'Delete file from Cloudinary',
    description: 'Deletes a file from Cloudinary using its public ID.'
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      example: {
        success: true,
        result: 'ok'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
    schema: {
      example: {
        success: false,
        message: 'File not found'
      }
    }
  })
  deleteFile(@Param('publicId') publicId: string, @Body() options?: DeleteFileDto) {
    return this.filesService.deleteFile(publicId, options?.resourceType);
  }

  @Get(':publicId')
  @ApiOperation({ 
    summary: 'Get file information',
    description: 'Retrieves detailed information about a file stored in Cloudinary.'
  })
  @ApiResponse({
    status: 200,
    description: 'File information retrieved successfully',
    schema: {
      example: {
        public_id: 'products/product_123_image',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 1024000,
        url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/products/product_123_image.jpg',
        secure_url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/products/product_123_image.jpg',
        created_at: '2024-01-15T10:30:00Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
    schema: {
      example: {
        success: false,
        message: 'File not found'
      }
    }
  })
  getFileInfo(@Param('publicId') publicId: string, @Body() options?: GetFileInfoDto) {
    return this.filesService.getFileInfo(publicId, options?.resourceType);
  }

  @Post('generate-url')
  @ApiOperation({ 
    summary: 'Generate optimized image URL',
    description: 'Generates an optimized image URL with transformations for better performance (default: 600x600, fill crop, auto format/webp).'
  })
  @ApiResponse({
    status: 200,
    description: 'Optimized URL generated successfully',
    schema: {
      example: {
        optimizedUrl: 'https://res.cloudinary.com/your-cloud/image/upload/w_600,h_600,c_fill,q_auto,f_auto/products/product_123_image.webp'
      }
    }
  })
  generateOptimizedUrl(@Body() data: GenerateUrlDto) {
    return {
      optimizedUrl: this.filesService.generateOptimizedUrl(data.publicId, {
        width: data.width,
        height: data.height,
        crop: data.crop,
        quality: data.quality,
        format: data.format
      })
    };
  }

  @Get('thumbnail/:publicId')
  @ApiOperation({ 
    summary: 'Generate thumbnail URL',
    description: 'Generates a thumbnail URL for product images with optimal sizing.'
  })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail URL generated successfully',
    schema: {
      example: {
        url: 'https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300,c_fill,q_auto,f_auto/products/product_123_image.jpg'
      }
    }
  })
  generateThumbnailUrl(@Param('publicId') publicId: string) {
    return {
      url: this.filesService.generateThumbnailUrl(publicId)
    };
  }

  @Get('gallery/:publicId')
  @ApiOperation({ 
    summary: 'Generate gallery URL',
    description: 'Generates a gallery URL for product images with optimal sizing for galleries.'
  })
  @ApiResponse({
    status: 200,
    description: 'Gallery URL generated successfully',
    schema: {
      example: {
        url: 'https://res.cloudinary.com/your-cloud/image/upload/w_800,h_600,c_fill,q_auto,f_auto/products/product_123_image.jpg'
      }
    }
  })
  generateGalleryUrl(@Param('publicId') publicId: string) {
    return {
      url: this.filesService.generateGalleryUrl(publicId)
    };
  }
}
