import { Injectable } from '@nestjs/common';
import { FindOptionsDto } from '@shared/dto/common/database/database.dto';
import {
  Repository,
  DataSource,
  ObjectLiteral,
  DeepPartial,
  SelectQueryBuilder,
  FindOneOptions,
  FindManyOptions,
} from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private readonly dataSource: DataSource) {}

  //1. Thêm dữ liệu vào bảng
  async create<T extends ObjectLiteral>(
    entity: Repository<T>,
    data: DeepPartial<T>,
  ): Promise<T> {
    const newData = entity.create(data as DeepPartial<T>); // Tạo đối tượng từ TypeORM
    return await entity.save(Array.isArray(newData) ? newData[0] : newData); // Kiểm tra nếu là mảng thì lấy phần tử đầu tiên
  }

  //2. Lấy một bản ghi theo ID
  async findOne<T extends ObjectLiteral>(
    entity: Repository<T>,
    options?: FindOptionsDto<T>,
  ): Promise<T | null> {
    const findOneOptions: FindOneOptions<T> = {
      where: options?.where,
      select: options?.select,
      relations: options?.relations,
      order: options?.order,
      withDeleted: options?.withDeleted,
    };

    return await entity.findOne(findOneOptions);
  }

  //3. Lấy tất cả bản ghi
  async findAll<T extends ObjectLiteral>(
    entity: Repository<T>,
    options?: FindOptionsDto<T>,
  ): Promise<T[]> {
    const findManyOptions: FindManyOptions<T> = {
      where: options?.where,
      select: options?.select,
      relations: options?.relations,
      order: options?.order,
      skip: options?.skip,
      take: options?.take,
      withDeleted: options?.withDeleted,
    };

    return await entity.find(findManyOptions);
  }

  //4. Cập nhật bản ghi theo ID
  async update<T extends ObjectLiteral>(
    entity: Repository<T>,
    id: number,
    data: DeepPartial<T>,
  ): Promise<void> {
    await entity.update(id, data as any);
  }

  //5. Xóa bản ghi theo ID
  async delete<T extends ObjectLiteral>(
    entity: Repository<T>,
    id: number,
  ): Promise<void> {
    await entity.delete(id);
  }

  //6. Thực hiện transaction
  async beginTransaction<T>(
    callback: (queryRunner: any) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //7. Query raw SQL
  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    return await this.dataSource.query(query, params);
  }

  /**
   * * Create timescaleDB
   *
   * @async
   * @returns {Promise<void>}
   */
  async createTimescaleDB(): Promise<void> {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "timescaledb"`);
    await this.dataSource.query(
      `SELECT create_hypertable('crypto', 'created_at', if_not_exists := true)`,
    );
  }

  /**
   * * Query builder helper function
   *
   * @template {ObjectLiteral} T
   * @param {Repository<T>} entity
   * @returns {SelectQueryBuilder<T>}
   */
  queryBuilder<T extends ObjectLiteral>(
    entity: Repository<T>,
    alias: string,
  ): SelectQueryBuilder<T> {
    return entity.createQueryBuilder(alias);
  }

  async count<T extends ObjectLiteral>(entity: Repository<T>): Promise<number> {
    return entity.count();
  }

  async findAndCount<T extends ObjectLiteral>(
    entity: Repository<T>,
    options?: FindOptionsDto<T>,
  ): Promise<{ data: T[]; total: number }> {
    const findManyOptions: FindManyOptions<T> = {
      where: options?.where,
      select: options?.select,
      relations: options?.relations,
      order: options?.order,
      skip: options?.skip,
      take: options?.take,
      withDeleted: options?.withDeleted,
    };

    const [data, total] = await entity.findAndCount(findManyOptions);

    return { data, total };
  }
}
