import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn('Cloudinary credentials are missing. Please check your .env file.');
      this.logger.warn('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    } else {
      cloudinary.config({
        cloud_name: cloudName.trim(),
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
      });
      this.logger.log(`Cloudinary configured with cloud_name: ${cloudName.trim()}`);
    }
  }

  /**
   * Generate Cloudinary signature for client-side uploads
   * @param folder - Optional folder path (defaults to CLOUDINARY_UPLOAD_FOLDER)
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
    folder: string;
    publicId?: string;
  }> {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '';
      const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY') || '';
      const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET') || '';
      const defaultFolder = this.configService.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'lume_ecom_uploads';
      const uploadFolder = folder || defaultFolder;

      const paramsToSign: Record<string, string | number> = { timestamp, folder: uploadFolder };
      if (publicId) paramsToSign.public_id = publicId;

      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      return {
        signature,
        timestamp,
        cloudName,
        apiKey,
        folder: uploadFolder,
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
    success: boolean;
    public_id: string;
    url: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
  }> {
    try {
      // Validate file type
      if (file.mimetype && !file.mimetype.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      this.logger.log(`Uploading file: ${file.originalname}`);
      const resourceType = options?.resourceType || 'image';
      const defaultFolder = this.configService.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'lume_ecom_uploads';
      const uploadFolder = options?.folder || defaultFolder;

      const result: any = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder: uploadFolder,
            public_id: options?.publicId,
            resource_type: resourceType,
            use_filename: !options?.publicId,
            unique_filename: !options?.publicId,
            overwrite: !!options?.publicId,
            transformation: options?.transformation,
          },
          (error, res) => {
            if (error) return reject(error);
            resolve(res);
          },
        );

        upload.end(file.buffer);
      });

      return {
        success: true,
        public_id: result.public_id,
        url: result.secure_url || result.url,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (error: any) {
      this.logger.error('Failed to upload file to Cloudinary:', error);
      
      // Provide more helpful error messages
      if (error.http_code === 401) {
        throw new Error(`Cloudinary authentication failed: ${error.message}. Please check your Cloudinary credentials in .env file.`);
      }
      
      if (error.message) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      throw new Error('Failed to upload file to Cloudinary. Please check your Cloudinary configuration.');
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
  ): Promise<{
    success: boolean;
    files: Array<{
      success: boolean;
      public_id: string;
      url: string;
      format: string;
      bytes: number;
      width?: number;
      height?: number;
    }>;
  }> {
    try {
      this.logger.log(`Uploading ${files.length} files`);

      const defaultFolder = this.configService.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'lume_ecom_uploads';
      const uploadFolder = options?.folder || defaultFolder;

      const uploadPromises = files.map((file, index) =>
        this.uploadFile(file, {
          ...options,
          folder: uploadFolder,
        }),
      );

      const results = await Promise.all(uploadPromises);
      this.logger.log(`Successfully uploaded ${results.length} files`);

      return {
        success: true,
        files: results,
      };
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
  ): Promise<{ success: boolean; result: string }> {
    try {
      this.logger.log(`Deleting file: ${publicId}`);
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return { success: true, result: res.result };
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
      const results = await Promise.all(
        publicIds.map((pid) => cloudinary.uploader.destroy(pid, { resource_type: resourceType }).then((r) => r.result)),
      );
      const hasError = results.some((r) => r !== 'ok');
      return { result: hasError ? 'partial' : 'ok' };
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
      const info = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return info;
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
      // Default values according to documentation
      const width = transformations?.width ?? 600;
      const height = transformations?.height ?? 600;
      const crop = transformations?.crop ?? 'fill';
      const format = transformations?.format ?? 'auto'; // Use 'auto' for optimal format (webp/avif)

      const url = cloudinary.url(publicId, {
        secure: true,
        resource_type: 'image',
        width,
        height,
        crop,
        format,
        quality: transformations?.quality ?? 'auto',
        gravity: transformations?.gravity,
      });
      return url;
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
