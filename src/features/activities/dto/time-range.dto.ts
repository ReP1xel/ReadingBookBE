import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum TimePeriod {
  TODAY = 'today',
  THIS_WEEK = 'this_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

export class TimeRangeDto {
  @IsEnum(TimePeriod)
  period: TimePeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
} 