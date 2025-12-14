import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserProfileDto {
  @ApiProperty({ example: 'Nguyễn Minh Thuận', description: 'Tên người dùng' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Ảnh đại diện người dùng',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  avatar: string;

  @ApiProperty({
    example: 'Tôi là một lập trình viên thích đọc sách',
    description: 'Giới thiệu người dùng',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty({
    example: 'Tôi là một lập trình viên thích đọc sách',
    description: 'Giới thiệu người dùng',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  facebook: string;

  @ApiProperty({
    example: 'Tôi là một lập trình viên thích đọc sách',
    description: 'Giới thiệu người dùng',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  instagram: string;

  @ApiProperty({
    example: 'Tôi là một lập trình viên thích đọc sách',
    description: 'Giới thiệu người dùng',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  twitter: string;

  @ApiProperty({
    example: [
      {
        id: 1,
        title: 'Lập trình Node.js',
        description: 'Một cuốn sách về Node.js',
        cover: 'https://example.com/cover.jpg',
      },
    ],
    description: 'Danh sách sách đã tạo của người dùng',
  })
  @Expose()
  books: {
    id: number;
    title: string;
    description: string;
    cover: string;
    createdAt: Date;
  }[];
}
