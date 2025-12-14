import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, [
    'name',
    'avatar',
    'gender',
    'birthDate',
    'bio',
    'facebook',
    'twitter',
    'instagram',
    'preferences',
  ] as const),
) {}

export class UpdateUserStatusDto {
  @ApiProperty({ example: 2, description: 'ID của trạng thái mới' })
  @IsNotEmpty()
  @IsNumber()
  statusId: number;
}
