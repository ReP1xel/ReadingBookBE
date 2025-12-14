import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { postgresConfig } from '@core/config/global';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...postgresConfig,
      autoLoadEntities: true,
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
