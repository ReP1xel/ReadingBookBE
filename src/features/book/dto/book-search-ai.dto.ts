import { ApiProperty } from '@nestjs/swagger';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class AiSearchDto extends PaginationRequestDto {
  @ApiProperty({
    description: 'Search query text',
    example: 'The best funny story',
  })
  @IsString()
  @IsNotEmpty()
  search: string;
}
