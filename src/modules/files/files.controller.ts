import { Controller, Post, Get, Delete, UploadedFile, UseInterceptors, Body, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
        folder: 'products',
        publicId: 'product_123_image'
      }
    }
  })
  getCloudinarySignature(@Body() options?: GenerateSignatureDto) {
    return this.filesService.generateCloudinarySignature(options?.folder, options?.publicId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
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
        url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/products/product_123_image.jpg',
        publicId: 'products/product_123_image',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 1024000
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
  @UseInterceptors(FileInterceptor('files'))
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
      example: [
        {
          url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/products/file1.jpg',
          publicId: 'products/1704067200_0',
          format: 'jpg',
          width: 800,
          height: 600,
          bytes: 1024000
        },
        {
          url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/products/file2.jpg',
          publicId: 'products/1704067200_1',
          format: 'jpg',
          width: 800,
          height: 600,
          bytes: 1024000
        }
      ]
    }
  })
  uploadMultipleFiles(@UploadedFile() files: Express.Multer.File[], @Body() options?: UploadFileDto) {
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
    description: 'Generates an optimized image URL with transformations for better performance.'
  })
  @ApiResponse({
    status: 200,
    description: 'Optimized URL generated successfully',
    schema: {
      example: {
        url: 'https://res.cloudinary.com/your-cloud/image/upload/w_800,h_600,c_fill,q_auto,f_auto/products/product_123_image.jpg'
      }
    }
  })
  generateOptimizedUrl(@Body() data: GenerateUrlDto) {
    return {
      url: this.filesService.generateOptimizedUrl(data.publicId, {
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
