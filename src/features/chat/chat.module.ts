import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '@features/book/entities/book.entity';
import { BookCategory } from '@features/book/entities/book-category.entity';
import { BookCategoryRelation } from '@features/book/entities/book-category-relation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, BookCategory, BookCategoryRelation]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
