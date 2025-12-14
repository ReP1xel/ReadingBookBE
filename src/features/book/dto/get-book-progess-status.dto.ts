import { Expose } from 'class-transformer';

export class GetProgressStatusDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description?: string;
}
