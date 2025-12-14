import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryEnity } from './cloudinary.entity';
import { LoggerService } from '@core/logger/logger.service';
import { cloudinaryConfig } from '@core/config/global';
import { Request } from 'express';

@Injectable()
export class CloudinaryService {
  private readonly limitImageSize = cloudinaryConfig.limitImageSize;
  private readonly limitWordSize = cloudinaryConfig.limitWordSize;

  constructor(private readonly loggerService: LoggerService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    req: Request,
    file: CloudinaryEnity,
    folder?: string,
  ): Promise<any> {
    try {
      if (!file) {
        throw new BadRequestException('Không tìm thấy file upload');
      }

      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('File không phải là ảnh');
      }

      if (file.size > this.limitImageSize) {
        throw new BadRequestException('Kích thước ảnh vượt quá 1MB');
      }

      return new Promise((resolve, reject) => {
        const userId = (req as any).user?.id;

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder || 'default',
            public_id: `${folder}_${userId}_${Date.now()}`,
            unique_filename: false,
            overwrite: true,
          },
          (error, result) => {
            if (error || !result) {
              return reject(new BadRequestException('Upload thất bại'));
            }
            resolve(result.secure_url);
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.loggerService.err(error, 'CloudinaryService.uploadImage');
      throw error;
    }
  }

  async uploadWordFile(
    req: Request,
    file: CloudinaryEnity,
    folder?: string,
  ): Promise<string> {
    try {
      if (!file) {
        throw new BadRequestException('Không tìm thấy file upload');
      }

      if (
        !file.mimetype.includes(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
      ) {
        throw new BadRequestException('File không phải là Word (.docx)');
      }

      if (file.size > this.limitWordSize) {
        throw new BadRequestException('Kích thước file vượt quá 5MB');
      }

      return new Promise((resolve, reject) => {
        const userId = (req as any).user?.id;

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder || 'documents',
            resource_type: 'raw',
            public_id: `${folder}_${userId}_${Date.now()}`,
            unique_filename: false,
            overwrite: true,
            format: 'docx',
          },
          (error, result) => {
            if (error || !result) {
              return reject(new BadRequestException('Upload thất bại'));
            }
            resolve(result.secure_url);
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.loggerService.err(error, 'CloudinaryService.uploadWordFile');
      throw error;
    }
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          this.loggerService.info(
            'Deleting image',
            'CloudinaryService.deleteImage',
          );

          if (error) return reject(error);
          resolve(result);
        });
      });
    } catch (error) {
      this.loggerService.err(error, 'CloudinaryService.deleteImage');
    }
  }
}
