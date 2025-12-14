import { Expose, Transform } from 'class-transformer';
import { SearchType } from '../entities/user-recent-search.entity';

export class RecentSearchResponseDto {
  @Expose()
  id: number;

  @Expose()
  searchType: SearchType;

  @Expose()
  searchValue: string;

  @Expose()
  relatedId: number;

  @Expose()
  @Transform(({ value }) => value && new Date(value).toISOString())
  createdAt: Date;
} 