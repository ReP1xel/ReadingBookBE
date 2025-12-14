import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryEnity } from './cloudinary.entity';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { cloudinaryConfig } from '@core/config/global';
import { JwtAuthGuard } from '@core/auth/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('upload')
@Controller('upload')
export class CloudinaryController {
  private readonly folderAvatar = cloudinaryConfig.folderAvatar;
  private readonly folderDocument = cloudinaryConfig.folderDocument;

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @UseGuards(JwtAuthGuard)
  @Post('image')
  @ApiOperation({ summary: 'Upload image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Req() req: Request,
    @UploadedFile() file: CloudinaryEnity,
  ) {
    return await this.cloudinaryService.uploadImage(
      req,
      file,
      this.folderAvatar,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('file')
  @ApiOperation({ summary: 'Upload file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadWordFile(
    @Req() req: Request,
    @UploadedFile() file: CloudinaryEnity,
  ) {
    return await this.cloudinaryService.uploadWordFile(
      req,
      file,
      this.folderDocument,
    );
  }
}
