import { PartialType } from '@nestjs/swagger';
import { CreateBookChapterDto } from './create-book-chapter.dto';

export class UpdateBookChapterDto extends PartialType(CreateBookChapterDto) {}

export class PatchBookChapterDto extends PartialType(CreateBookChapterDto) {}
