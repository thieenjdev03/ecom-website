import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private configService: ConfigService) {
    // Configure Cloudinary - temporarily disabled due to Node.js version issues
    // cloudinary.config({
    //   cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
    //   api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
    //   api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    // });
  }

  /**
   * Generate Cloudinary signature for client-side uploads
   * @param folder - Optional folder path
   * @param publicId - Optional public ID
   */
  async generateCloudinarySignature(
    folder?: string,
    publicId?: string,
  ): Promise<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder?: string;
    publicId?: string;
  }> {
    try {
      // Temporarily return mock data due to Cloudinary package issues
      this.logger.warn('Cloudinary integration temporarily disabled');
      return {
        signature: 'mock-signature',
        timestamp: Math.round(new Date().getTime() / 1000),
        cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'mock-cloud',
        apiKey: this.configService.get<string>('CLOUDINARY_API_KEY') || 'mock-key',
        ...(folder && { folder }),
        ...(publicId && { publicId }),
      };
    } catch (error) {
      this.logger.error('Failed to generate Cloudinary signature:', error);
      throw error;
    }
  }

  /**
   * Upload file to Cloudinary
   * @param file - File to upload
   * @param options - Upload options
   */
  async uploadFile(
    file: Express.Multer.File,
    options?: {
      folder?: string;
      publicId?: string;
      transformation?: any;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
    },
  ): Promise<{
    url: string;
    publicId: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
  }> {
    try {
      this.logger.log(`Uploading file: ${file.originalname}`);
      this.logger.warn('Cloudinary integration temporarily disabled - returning mock data');

      // Return mock data for now
      return {
        url: 'https://mock-cloudinary-url.com/image.jpg',
        publicId: `mock_${Date.now()}`,
        format: file.mimetype.split('/')[1] || 'jpg',
        width: 800,
        height: 600,
        bytes: file.size,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param files - Array of files to upload
   * @param options - Upload options
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options?: {
      folder?: string;
      transformation?: any;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
    },
  ): Promise<Array<{
    url: string;
    publicId: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
  }>> {
    try {
      this.logger.log(`Uploading ${files.length} files`);

      const uploadPromises = files.map((file, index) =>
        this.uploadFile(file, {
          ...options,
          publicId: `${options?.folder || 'uploads'}/${Date.now()}_${index}`,
        }),
      );

      const results = await Promise.all(uploadPromises);
      this.logger.log(`Successfully uploaded ${results.length} files`);

      return results;
    } catch (error) {
      this.logger.error('Failed to upload multiple files:', error);
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @param resourceType - Resource type (image, video, raw)
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<{ result: string }> {
    try {
      this.logger.log(`Deleting file: ${publicId}`);
      this.logger.warn('Cloudinary integration temporarily disabled');

      // Return mock result
      return { result: 'ok' };
    } catch (error) {
      this.logger.error(`Failed to delete file ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple files from Cloudinary
   * @param publicIds - Array of public IDs to delete
   * @param resourceType - Resource type (image, video, raw)
   */
  async deleteMultipleFiles(
    publicIds: string[],
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<{ result: string }> {
    try {
      this.logger.log(`Deleting ${publicIds.length} files`);
      this.logger.warn('Cloudinary integration temporarily disabled');

      // Return mock result
      return { result: 'ok' };
    } catch (error) {
      this.logger.error('Failed to delete multiple files:', error);
      throw error;
    }
  }

  /**
   * Get file information from Cloudinary
   * @param publicId - Public ID of the file
   * @param resourceType - Resource type (image, video, raw)
   */
  async getFileInfo(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<any> {
    try {
      this.logger.log(`Getting file info: ${publicId}`);
      this.logger.warn('Cloudinary integration temporarily disabled');

      // Return mock result
      return {
        public_id: publicId,
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 1024000,
        url: 'https://mock-cloudinary-url.com/image.jpg',
      };
    } catch (error) {
      this.logger.error(`Failed to get file info ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Generate optimized image URL with transformations
   * @param publicId - Public ID of the image
   * @param transformations - Cloudinary transformations
   */
  generateOptimizedUrl(
    publicId: string,
    transformations?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
      gravity?: string;
    },
  ): string {
    try {
      this.logger.warn('Cloudinary integration temporarily disabled');
      
      // Return mock URL
      return `https://mock-cloudinary-url.com/${publicId}`;
    } catch (error) {
      this.logger.error(`Failed to generate optimized URL for ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Create image transformation for product thumbnails
   * @param publicId - Public ID of the image
   * @param size - Size for the thumbnail
   */
  generateThumbnailUrl(publicId: string, size: number = 300): string {
    return this.generateOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      gravity: 'auto',
    });
  }

  /**
   * Create image transformation for product gallery
   * @param publicId - Public ID of the image
   * @param width - Width for the image
   * @param height - Height for the image
   */
  generateGalleryUrl(
    publicId: string,
    width: number = 800,
    height: number = 600,
  ): string {
    return this.generateOptimizedUrl(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      gravity: 'auto',
    });
  }
}
