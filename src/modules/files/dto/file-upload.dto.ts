import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSignatureDto {
  @ApiProperty({
    description: 'Cloudinary folder path',
    example: 'products',
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiProperty({
    description: 'Public ID for the file',
    example: 'product_123_image',
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  publicId?: string;
}

export class UploadFileDto {
  @ApiProperty({
    description: 'Cloudinary folder path',
    example: 'products',
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiProperty({
    description: 'Public ID for the file',
    example: 'product_123_image',
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  publicId?: string;

  @ApiProperty({
    description: 'Resource type for the file',
    example: 'image',
    enum: ['image', 'video', 'raw', 'auto'],
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsEnum(['image', 'video', 'raw', 'auto'])
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export class DeleteFileDto {
  @ApiProperty({
    description: 'Public ID of the file to delete',
    example: 'products/product_123_image',
    type: 'string'
  })
  @IsString()
  publicId: string;

  @ApiProperty({
    description: 'Resource type of the file',
    example: 'image',
    enum: ['image', 'video', 'raw'],
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsEnum(['image', 'video', 'raw'])
  resourceType?: 'image' | 'video' | 'raw';
}

export class GetFileInfoDto {
  @ApiProperty({
    description: 'Public ID of the file',
    example: 'products/product_123_image',
    type: 'string'
  })
  @IsString()
  publicId: string;

  @ApiProperty({
    description: 'Resource type of the file',
    example: 'image',
    enum: ['image', 'video', 'raw'],
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsEnum(['image', 'video', 'raw'])
  resourceType?: 'image' | 'video' | 'raw';
}

export class GenerateUrlDto {
  @ApiProperty({
    description: 'Public ID of the image',
    example: 'products/product_123_image',
    type: 'string'
  })
  @IsString()
  publicId: string;

  @ApiProperty({
    description: 'Image width',
    example: 800,
    required: false,
    type: 'number'
  })
  @IsOptional()
  width?: number;

  @ApiProperty({
    description: 'Image height',
    example: 600,
    required: false,
    type: 'number'
  })
  @IsOptional()
  height?: number;

  @ApiProperty({
    description: 'Crop mode',
    example: 'fill',
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  crop?: string;

  @ApiProperty({
    description: 'Image quality',
    example: 'auto',
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  quality?: string;

  @ApiProperty({
    description: 'Image format',
    example: 'auto',
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  format?: string;
}
