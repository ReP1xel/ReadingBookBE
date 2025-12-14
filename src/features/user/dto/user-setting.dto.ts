import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserSettingsDto {
  @Expose()
  @IsOptional()
  @IsEnum(['light', 'dark', 'system'], {
    message: 'Theme must be one of light, dark, or system',
  })
  theme?: 'light' | 'dark' | 'system';

  @Expose()
  @IsOptional()
  @IsEnum(['en', 'vn'], { message: 'Language must be either en or vn' })
  language?: 'en' | 'vn';

  @Expose()
  @IsOptional()
  @IsInt({ message: 'Volume must be an integer' })
  @Min(0, { message: 'Volume must be at least 0' })
  @Max(100, { message: 'Volume cannot exceed 100' })
  volume?: number;

  @Expose()
  @IsOptional()
  @IsEnum(['scroll', 'flip'], {
    message: 'Reading mode must be either scroll or flip',
  })
  readingMode?: 'scroll' | 'flip';
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'The theme of the user interface.',
    enum: ['light', 'dark', 'system'],
    default: 'system',
    example: 'light',
  })
  @IsOptional()
  @IsEnum(['light', 'dark', 'system'], {
    message: 'Theme must be one of light, dark, or system',
  })
  theme?: 'light' | 'dark' | 'system';

  @ApiPropertyOptional({
    description: 'The language of the user interface.',
    enum: ['en', 'vn'],
    default: 'en',
    example: 'vn',
  })
  @IsOptional()
  @IsEnum(['en', 'vn'], { message: 'Language must be either en or vn' })
  language?: 'en' | 'vn';

  @ApiPropertyOptional({
    description: 'The volume level of the app (0 to 100).',
    default: 50,
    example: 75,
  })
  @IsOptional()
  @IsInt({ message: 'Volume must be an integer' })
  @Min(0, { message: 'Volume must be at least 0' })
  @Max(100, { message: 'Volume cannot exceed 100' })
  volume?: number;

  @ApiPropertyOptional({
    description: 'The reading mode for the user interface.',
    enum: ['scroll', 'flip'],
    default: 'scroll',
    example: 'flip',
  })
  @IsOptional()
  @IsEnum(['scroll', 'flip'], {
    message: 'Reading mode must be either scroll or flip',
  })
  readingMode?: 'scroll' | 'flip';
}
