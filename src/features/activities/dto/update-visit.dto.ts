import { IsDateString } from 'class-validator';

export class UpdateVisitDto {
  @IsDateString()
  endedAt: string;
} 