import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserInTransactionDto {
  @ApiProperty({
    example: 1,
    description: 'ID người dùng',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email người dùng',
  })
  @Expose()
  email: string;
}

export class TransactionResponseDto {
  @ApiProperty({
    example: 'BOT_00001',
    description: 'Transaction ID',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 10000,
    description: 'Số tiền người dùng đã nạp (VND)',
  })
  @Expose()
  amount: number;

  @ApiProperty({
    example: 10000,
    description: 'Số điểm tương ứng với số tiền đã nạp',
  })
  @Expose()
  points: number;

  @ApiProperty({
    example: 'SUCCESS',
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    description: 'Trạng thái giao dịch',
  })
  @Expose()
  status: string;

  @ApiProperty({
    example: '2025-04-04T12:00:00.000Z',
    description: 'Thời gian tạo giao dịch',
    type: String,
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    example: '2025-04-04T12:05:00.000Z',
    description: 'Thời gian cập nhật giao dịch gần nhất',
    type: String,
    format: 'date-time',
  })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty({
    description: 'Thông tin người dùng thực hiện giao dịch',
    type: UserInTransactionDto,
  })
  @Expose()
  @Type(() => UserInTransactionDto)
  user: UserInTransactionDto;
}
