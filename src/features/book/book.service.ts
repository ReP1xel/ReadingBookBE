import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { In, IsNull, Repository, Between } from 'typeorm';
import { Book } from '@features/book/entities/book.entity';
import { DatabaseService } from '@core/database/database.service';
import {
  GetBookRequestDto,
  GetBookResponseDto,
  SortByOptions,
  SortTypeOptions,
} from './dto/get-book-request.dto';
import { LoggerService } from '@core/logger/logger.service';
import { CacheService } from '@core/cache/cache.service';
import {
  GetBookCategoryDetailDto,
  GetBookCategoryDto,
} from './dto/get-book-category.dto';
import { BookCategory } from './entities/book-category.entity';
import { bookConfig, openAIConfig } from '@core/config/global';
import { GetBookDetail, GetListBookDto } from './dto/get-book.dto';
import { GetProgressStatusDto } from './dto/get-book-progess-status.dto';
import { BookProgressStatus } from './entities/book-progess-status.entity';
import { BookAccessStatus } from './entities/book-access-status.entity';
import { GetAccessStatusDto } from './dto/get-book-access-status.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { BookCategoryRelation } from './entities/book-category-relation.entity';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateMultipleBookChaptersDto } from './dto/create-book-chapter.dto';
import { BookChapter } from './entities/book-chapter.entity';
import { UpdateBookChapterDto } from './dto/update-book-chapter.dto';
import { User } from '@features/user/entities/user.entity';
import {
  CreateBookReviewDto,
  UpdateBookReviewDto,
} from './dto/book-review.dto';
import { BookReview } from './entities/book-review.entity';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import {
  PaginationResponseDto,
} from '@shared/dto/common/pagnination/pagination-response.dto';
import {
  BookChapterCommentResponseDto,
  CreateBookChapterCommentDto,
  UpdateBookChapterCommentDto,
} from './dto/book-chapter-comment.dto';
import { BookChapterComment } from './entities/book-chapter-comment.entity';
import { BookReviewResponseDto } from './dto/get-book-review.dto';
import { BookFollow } from './entities/book-follow.entity';
import { BookFollowDto } from './dto/book-follow.dto';
import { BookReportDto, BookReportResponseDto } from './dto/book-report.dto';
import { BookReport } from './entities/book-report.entity';
import { GetBookTypeDto } from './dto/book-type.dto';
import { BookType } from './entities/book-type.entity';
import {
  BookReadingSummaryDto,
  ChapterReadDto,
  CreateBookReadingHistoryDto,
} from './dto/create-book-reading-history.dto';
import { BookReadingHistory } from './entities/book-reading-history.entity';
import { GetBookChapterDto } from './dto/get-book-chapter.dto';
import { format, parseISO } from 'date-fns';
import { UserResponseDto } from '@features/user/dto/get-user-response.dto';
import { ChapterPurchase } from '@features/transaction/entities/chapter-purchase.entity';
import { GetTrendingBooksDto } from './dto/book-trending.dto';
import { GetRecommendedBooksDto } from './dto/book-recommend.dto';
import { UserFavorite } from '@features/user/entities/user-favorite.entity';
import { GetRelatedBooksDto } from './dto/book-related.dto';
import OpenAI from 'openai';
import { NotificationGateway } from '@core/gateway/notification.gateway';
import { PatchBookDto } from './dto/update-book.dto';
import { PatchBookChapterDto } from './dto/update-book-chapter.dto';
import { ChapterAccessStatus } from './entities/book-chapter.entity';
import { ModerationResult } from './entities/moderation-result.entity';
import {ModerationResultResponseDto, UpdateModerationResultDto } from './dto/moderation-result.dto';
import { TimePeriod } from '@features/activities/dto/time-range.dto';

@Injectable()
export class BookService {
  private readonly openAIKey = openAIConfig.openAIKey;
  private readonly redisBookTtl = bookConfig.redisBookTtl;
  private readonly adminMail = 'iiiimanhiiii007@gmail.com';

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookCategory)
    private readonly bookCategoryRepository: Repository<BookCategory>,
    @InjectRepository(BookType)
    private readonly bookTypeRepository: Repository<BookType>,
    @InjectRepository(BookProgressStatus)
    private readonly bookProgressStatusRepository: Repository<BookProgressStatus>,
    @InjectRepository(BookAccessStatus)
    private readonly bookAccessStatusRepository: Repository<BookAccessStatus>,
    @InjectRepository(BookChapter)
    private readonly bookChapterRepository: Repository<BookChapter>,
    @InjectRepository(BookCategoryRelation)
    private readonly bookCategoryRelationRepository: Repository<BookCategoryRelation>,
    @InjectRepository(BookReview)
    private readonly bookReviewRepository: Repository<BookReview>,
    @InjectRepository(BookChapterComment)
    private readonly bookChapterCommentRepository: Repository<BookChapterComment>,
    @InjectRepository(BookReport)
    private readonly bookReportRepository: Repository<BookReport>,
    @InjectRepository(BookFollow)
    private readonly bookFollowRepository: Repository<BookFollow>,
    @InjectRepository(BookReadingHistory)
    private readonly bookReadingHistoryRepository: Repository<BookReadingHistory>,
    @InjectRepository(ChapterPurchase)
    private readonly chapterPurchaseRepository: Repository<ChapterPurchase>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
    @InjectRepository(ModerationResult)
    private readonly moderationResultRepository: Repository<ModerationResult>,
    private readonly cacheService: CacheService,
    private readonly databaseService: DatabaseService,
    private readonly loggerService: LoggerService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private async getQueryEmbedding(query: string) {
    try {
      const openai = new OpenAI({ apiKey: this.openAIKey });
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getQueryEmbedding');
      throw error;
    }
  }

  private getStatusMessage(title: string, accessStatusId: number, authorName: string): string {
    if (accessStatusId === 3) {
      return `${title} has been blocked due to community standards violations. To appeal, please contact via email: ${this.adminMail}`;
    } else if (accessStatusId === 4) {
      return `${title} from ${authorName} has been submitted for review. Please check and approve or reject it.`;
    } else if (accessStatusId === 1) {
      return `"${title}" has successfully passed the review and has been restored. Thank you for your patience.`;
    }

    return '';
  }

  async migrateAddEmbeddingColumn(): Promise<Boolean> {
    try {
      await this.databaseService.executeRawQuery(
        `CREATE EXTENSION IF NOT EXISTS vector`,
      );

      await this.databaseService.executeRawQuery(
        `ALTER TABLE "book"  ADD COLUMN IF NOT EXISTS "embedding" vector(1536)`,
      );

      await this.databaseService.executeRawQuery(
        `CREATE INDEX IF NOT EXISTS idx_book_embedding ON "book" USING ivfflat ("embedding" vector_l2_ops) WITH (lists = 100)`,
      );

      console.log(
        '✅ Migration completed: embedding column added with ivfflat index',
      );

      return true;
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookService.migrateAddEmbeddingColumn',
      );
      throw error;
    }
  }

  async migrateBookEmbedding(id: number): Promise<Boolean> {
    try {
      const books = await this.databaseService.findAll(this.bookRepository, {
        where: { id },
        select: ['id', 'description', 'title'],
      });

      for (const book of books) {
        try {
          const combinedText = `${book.title} ${book.description}`;
          const queryEmbedding = await this.getQueryEmbedding(combinedText);
          const embeddingStr = `[${queryEmbedding.join(',')}]`;

          await this.databaseService.executeRawQuery(
            `UPDATE "book" SET "embedding" = $1::vector WHERE id = $2`,
            [embeddingStr, book.id],
          );

          console.log(`✅ Book ID ${book.id} embedding updated`);
        } catch (error) {
          console.error(`❌ Failed embedding for book ID ${book.id}:`, error);
        }
      }

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.migrateBookEmbedding');
      throw error;
    }
  }

  async getAllBooks(
    user: UserResponseDto,
    params: GetBookRequestDto,
  ): Promise<GetBookResponseDto> {
    try {
      let {
        page = 1,
        limit = 10,
        userId,
        search,
        bookTypeId,
        accessStatusId,
        progressStatusId,
        categoryId,
        sortBy = 'updatedAt',
        sortType = 'DESC',
        hasChapters = false,
      } = params;

      const cachedKey = `books:${userId || 'all'}:${search || 'all'}:${bookTypeId || 'all'}:${accessStatusId || 'all'}:${progressStatusId || 'all'}:${categoryId || 'all'}:sortBy${sortBy}:sortType${sortType}:p${page}:l${limit}`;
      const cachedPage = await this.cacheService.get(cachedKey);
      if (cachedPage) {
        return JSON.parse(cachedPage);
      }

      const qb = this.databaseService
        .queryBuilder(this.bookRepository, 'book')
        .leftJoinAndSelect('book.author', 'author')
        .leftJoinAndSelect('book.bookType', 'bookType')
        .leftJoinAndSelect('book.accessStatus', 'accessStatus')
        .leftJoinAndSelect('book.progressStatus', 'progressStatus')
        .leftJoinAndSelect('book.bookCategoryRelations', 'bcr')
        .leftJoinAndSelect('bcr.category', 'category')
        .leftJoinAndSelect('book.chapters', 'chapters', 'chapters.chapterAccessStatus = :chapterAccessStatus', { chapterAccessStatus: ChapterAccessStatus.PUBLISHED })
        .leftJoinAndSelect('book.reviews', 'reviews');

      if (userId) {
        qb.andWhere('author.id = :userId', { userId });
      }
      if (bookTypeId) {
        qb.andWhere('bookType.id = :bookTypeId', { bookTypeId });
      }
      if (accessStatusId && accessStatusId.length > 0) {
        qb.andWhere('accessStatus.id IN (:...accessStatusId)', {
          accessStatusId,
        });
      }
      if (progressStatusId) {
        qb.andWhere('progressStatus.id = :progressStatusId', {
          progressStatusId,
        });
      }
      if (categoryId && categoryId.length > 0) {
        qb.andWhere(
          `book.id IN (
            SELECT bcr.book_id
            FROM book_category_relation bcr
            WHERE bcr.category_id IN (:...categoryId)
            GROUP BY bcr.book_id
            HAVING COUNT(DISTINCT bcr.category_id) = :categoryCount
          )`,
          { categoryId, categoryCount: categoryId.length },
        );
      }
      if (search) {
        qb.andWhere(
          `(to_tsvector('simple', unaccent(lower(book.title))) @@ websearch_to_tsquery(unaccent(lower(:search))) 
             OR to_tsvector('simple', unaccent(lower(author.name))) @@ websearch_to_tsquery(unaccent(lower(:search)))
             OR unaccent(lower(book.title)) ILIKE :prefixSearch 
             OR unaccent(lower(author.name)) ILIKE :prefixSearch)`,
          {
            search: search.replace(/\s+/g, ' & '),
            prefixSearch: `%${search}%`,
          },
        );
      }
      if (hasChapters) {
        qb.andWhere('chapters.id IS NOT NULL');
      }

      if (sortBy === SortByOptions.VIEWS) {
        qb.orderBy('book.views', sortType as SortTypeOptions);
      } else if (sortBy === SortByOptions.TITLE) {
        qb.orderBy('book.title', sortType as SortTypeOptions);
      } else if (sortBy === SortByOptions.CREATED_AT) {
        qb.orderBy('book.createdAt', sortType as SortTypeOptions);
      } else if (sortBy === SortByOptions.UPDATED_AT) {
        qb.orderBy('book.updatedAt', sortType as SortTypeOptions);
      }

      qb.skip((page - 1) * limit).take(limit);

      const [books, total] = await qb.getManyAndCount();

      let readingHistoriesMap: Map<
        number,
        {
          lastReadChapterId: number;
          lastReadChapterNumber: number;
          totalReadChapters: number;
        }
      > = new Map();
      if (!user) {
        const booksWithChapters = books.filter(
          (book) => book.chapters && book.chapters.length > 0,
        );
        const bookIds = booksWithChapters.map((book) => book.id);

        if (bookIds.length > 0) {
          const firstChapters = await this.bookChapterRepository
            .createQueryBuilder('chapter')
            .select([
              'chapter.id AS id',
              'chapter.chapter AS chapter',
              'chapter.book_id AS bookId',
            ])
            .where('chapter.book_id IN (:...bookIds)', { bookIds })
            .orderBy('chapter.book_id')
            .addOrderBy('chapter.chapter', 'ASC')
            .distinctOn(['chapter.book_id'])
            .getRawMany();

          firstChapters.forEach((chapter) => {
            readingHistoriesMap.set(Number(chapter.bookid), {
              lastReadChapterId: Number(chapter.id),
              lastReadChapterNumber: Number(chapter.chapter),
              totalReadChapters: 0,
            });
          });
        }

        books.forEach((book) => {
          if (!readingHistoriesMap.has(book.id)) {
            readingHistoriesMap.set(book.id, {
              lastReadChapterId: 0,
              lastReadChapterNumber: 0,
              totalReadChapters: 0,
            });
          }
        });
      } else if (user && user.id && books.length > 0) {
        const bookIds = books.map((book) => book.id);

        const subQuery = this.bookReadingHistoryRepository
          .createQueryBuilder('sub_history')
          .select([
            'MAX(sub_history.created_at) AS max_created_at',
            'sub_history.user_id AS user_id',
            'sub_history.book_id AS book_id',
          ])
          .where('sub_history.user_id = :userId', { userId: user.id })
          .andWhere('sub_history.book_id IN (:...bookIds)', { bookIds })
          .groupBy('sub_history.user_id, sub_history.book_id');

        const rawHistories = await this.bookReadingHistoryRepository
          .createQueryBuilder('history')
          .select([
            'history.chapter_id AS lastReadChapterId',
            'history.book_id AS bookId',
            'history.created_at AS createdAt',
          ])
          .innerJoin(
            `(${subQuery.getQuery()})`,
            'latest',
            'history.user_id = latest.user_id AND history.book_id = latest.book_id AND history.created_at = latest.max_created_at',
          )
          .setParameters(subQuery.getParameters())
          .getRawMany();

        const totalChaptersRead = await this.bookReadingHistoryRepository
          .createQueryBuilder('history')
          .select([
            'history.book_id AS bookid',
            'COUNT(DISTINCT history.chapter_id) AS totalreadchapters',
          ])
          .where('history.user_id = :userId', { userId: user.id })
          .andWhere('history.book_id IN (:...bookIds)', { bookIds })
          .groupBy('history.book_id')
          .getRawMany();

        const totalChaptersMap = new Map<number, number>();
        totalChaptersRead.forEach((item) => {
          totalChaptersMap.set(
            Number(item.bookid),
            Number(item.totalreadchapters),
          );
        });

        const chapterMap = new Map<number, number>();
        if (rawHistories.length > 0) {
          const chapterIds = rawHistories.map((h) =>
            Number(h.lastreadchapterid),
          );
          const chapters = await this.bookChapterRepository.find({
            where: { id: In(chapterIds) },
          });

          chapters.forEach((chapter) => {
            chapterMap.set(chapter.id, chapter.chapter);
          });

          rawHistories.forEach((history) => {
            const bookId = Number(history.bookid);
            readingHistoriesMap.set(bookId, {
              lastReadChapterId: Number(history.lastreadchapterid) || 0,
              lastReadChapterNumber:
                chapterMap.get(Number(history.lastreadchapterid)) || 0,
              totalReadChapters: totalChaptersMap.get(bookId) || 0,
            });
          });
        }

        const booksWithoutHistory = books.filter(
          (book) => !readingHistoriesMap.has(book.id),
        );

        if (booksWithoutHistory.length > 0) {
          const firstChapters = await this.bookChapterRepository
            .createQueryBuilder('chapter')
            .select([
              'chapter.id AS id',
              'chapter.chapter AS chapter',
              'chapter.book_id AS bookId',
            ])
            .where('chapter.book_id IN (:...bookIds)', {
              bookIds: booksWithoutHistory.map((b) => b.id),
            })
            .orderBy('chapter.book_id')
            .addOrderBy('chapter.chapter', 'ASC')
            .distinctOn(['chapter.book_id'])
            .getRawMany();

          firstChapters.forEach((chapter) => {
            readingHistoriesMap.set(Number(chapter.bookid), {
              lastReadChapterId: Number(chapter.id),
              lastReadChapterNumber: Number(chapter.chapter),
              totalReadChapters: 0,
            });
          });

          booksWithoutHistory.forEach((book) => {
            if (!readingHistoriesMap.has(book.id)) {
              readingHistoriesMap.set(book.id, {
                lastReadChapterId: 0,
                lastReadChapterNumber: 0,
                totalReadChapters: 0,
              });
            }
          });
        }
      }

      let followedBookIds = new Set<number>();
      if (user && user.id) {
        const follows = await this.bookFollowRepository.find({
          where: { user: { id: user.id } },
          relations: ['book'],
        });
        followedBookIds = new Set(follows.map((f) => f.book.id));
      }

      // Fetch moderation results for books with access status id 4 (pending review)
      const booksWithPendingReview = books.filter(book => book.accessStatus.id === 4);
      const moderationResultsMap = new Map<number, any[]>();
      
      if (booksWithPendingReview.length > 0) {
        const bookIds = booksWithPendingReview.map(book => book.id);
        const moderationResults = await this.moderationResultRepository.find({
          where: { book: { id: In(bookIds) } },
          relations: ['book'],
          order: { createdAt: 'DESC' },
        });

        // Group moderation results by book id
        moderationResults.forEach(result => {
          const bookId = result.book.id;
          if (!moderationResultsMap.has(bookId)) {
            moderationResultsMap.set(bookId, []);
          }
          moderationResultsMap.get(bookId)!.push({
            id: result.id,
            title: result.title,
            description: result.description,
            coverImage: result.coverImage,
            chapters: result.chapters,
            model: result.model,
            createdAt: result.createdAt,
          });
        });
      }

      books.forEach((book) => {
        book['isFollowed'] = followedBookIds.has(book.id);

        const chapters = book.chapters || [];
        book['totalChapters'] = chapters.length;

        book['totalPrice'] = chapters.reduce(
          (sum, chapter) => sum + Number(chapter.price || 0),
          0,
        );

        const reviews = book.reviews || [];
        const totalRating = reviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0,
        );
        book['rating'] =
          reviews.length > 0 ? +(totalRating / reviews.length).toFixed(2) : 0;

        const readingProgress = readingHistoriesMap.get(book.id);
        if (readingProgress) {
          book['readingProgress'] = readingProgress;
        }

        // Add moderation results if book has access status id 4
        if (book.accessStatus.id === 4) {
          book['moderation'] = moderationResultsMap.get(book.id) || [];
        }
      });

      const response: GetBookResponseDto = {
        totalItems: total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 1,
        data: books.map((book) =>
          plainToInstance(GetListBookDto, book, {
            excludeExtraneousValues: true,
          }),
        ),
      };

      // await this.cacheService.set(
      //   cachedKey,
      //   JSON.stringify(response),
      //   this.redisBookTtl,
      // );

      return response;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getAllBooks');
      throw error;
    }
  }

  async getBookDetail(
    user: UserResponseDto,
    bookId: number,
  ): Promise<GetBookResponseDto> {
    try {
      const cachedKey = `book:detail:${bookId}`;
      const cachedBook = await this.cacheService.get(cachedKey);
      if (cachedBook) {
        return JSON.parse(cachedBook);
      }

      const qb = this.databaseService
        .queryBuilder(this.bookRepository, 'book')
        .leftJoinAndSelect('book.author', 'author')
        .leftJoinAndSelect('book.bookType', 'bookType')
        .leftJoinAndSelect('book.accessStatus', 'accessStatus')
        .leftJoinAndSelect('book.progressStatus', 'progressStatus')
        .leftJoinAndSelect('book.bookCategoryRelations', 'bcr')
        .leftJoinAndSelect('bcr.category', 'category')
        .leftJoinAndSelect('book.chapters', 'chapters', 'chapters.chapterAccessStatus = :chapterAccessStatus', { chapterAccessStatus: ChapterAccessStatus.PUBLISHED })
        .where('book.id = :bookId', { bookId });

      const book = await qb.getOne();

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      if (!user || book.author.id !== user.id) {
        await this.databaseService
          .queryBuilder(this.bookRepository, 'book')
          .update(Book)
          .set({
            views: () => 'views + 1',
            updatedAt: () => 'updated_at',
          })
          .where('id = :bookId', { bookId })
          .execute();
      }

      const ratingResult = await this.databaseService
        .queryBuilder(this.bookReviewRepository, 'review')
        .select('ROUND(AVG(review.rating)::numeric, 1)', 'avgRating')
        .where('review.book_id = :bookId', { bookId })
        .getRawOne();
      const avgRating = Number(ratingResult.avgRating) || 0;

      const totalReads = await this.databaseService
        .queryBuilder(this.bookReadingHistoryRepository, 'readingHistory')
        .where('readingHistory.book_id = :bookId', { bookId })
        .getCount();

      const totalPurchases = await this.databaseService
        .queryBuilder(this.chapterPurchaseRepository, 'purchase')
        .leftJoin('purchase.chapter', 'chapter')
        .where('chapter.book_id = :bookId', { bookId })
        .groupBy('purchase.user_id')
        .getCount();

      let isFollowed = false;
      if (user?.id) {
        const follow = await this.bookFollowRepository.findOne({
          where: {
            user: { id: user.id },
            book: { id: bookId },
          },
        });
        isFollowed = !!follow;
      }

      const bookDto = plainToInstance(GetBookDetail, book, {
        excludeExtraneousValues: true,
      });

      bookDto.totalChapters = book.chapters?.length || 0;
      bookDto.totalPrice = book.chapters?.reduce(
        (sum, chapter) => sum + Number(chapter.price || 0),
        0,
      );
      bookDto.rating = avgRating;
      bookDto.isFollowed = isFollowed;
      bookDto.totalReads = totalReads;
      bookDto.totalPurchases = totalPurchases;

      const response: GetBookResponseDto = {
        totalItems: 1,
        totalPages: 1,
        data: [bookDto],
      };

      // await this.cacheService.set(
      //   cachedKey,
      //   JSON.stringify(response),
      //   this.redisBookTtl,
      // );

      return response;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getBookDetail');
      throw error;
    }
  }

  async getBookChapters(
    user: UserResponseDto,
    bookId: number,
    chapterAccessStatus?: string,
  ): Promise<BookChapter[]> {
    try {
      const book = await this.bookRepository
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.author', 'author')
        .leftJoinAndSelect('book.chapters', 'chapters')
        .where('book.id = :bookId', { bookId })
        .orderBy('chapters.chapter', 'ASC')
        .getOne();
      if (!book) {
        throw new NotFoundException('Book not found');
      }

      const purchasedChapterIds = new Set<number>();
      if (user?.id) {
        const purchases = await this.chapterPurchaseRepository.find({
          where: { user: { id: user.id } },
          relations: ['chapter'],
        });
        purchases.forEach((p) => purchasedChapterIds.add(p.chapter.id));
      }

      const filteredChapters = chapterAccessStatus ? book.chapters.filter((chapter) => chapter.chapterAccessStatus === chapterAccessStatus) : book.chapters;

      const chapters = filteredChapters
        .sort((a, b) => a.chapter - b.chapter)
        .map((chapter) => {
          if (user?.id && book.author.id === user.id || user?.role?.id === 1 || user?.role?.id === 2) {
            return { ...chapter, isLocked: false };
          } else if (chapter.isLocked && !purchasedChapterIds.has(chapter.id)) {
            return {
              id: chapter.id,
              title: chapter.title,
              chapter: chapter.chapter,
              cover: chapter.cover,
              isLocked: true,
              price: Number(chapter.price),
              createdAt: chapter.createdAt,
              updatedAt: chapter.updatedAt,
              chapterAccessStatus: chapter.chapterAccessStatus,
            } as BookChapter;
          } else {
            return { ...chapter, isLocked: false };
          }
        });

      return chapters;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getBookChapters');
      throw error;
    }
  }

  async getBookCategory(params: GetBookCategoryDetailDto) {
    try {
      let {
        userId,
        search,
        bookTypeId,
        accessStatusId,
        progressStatusId,
        categoryId,
        hasChapters = false,
      } = params;

      const cachedKey = `books:category:list:${userId || 'all'}:${search || 'all'}:${bookTypeId || 'all'}:${accessStatusId || 'all'}:${progressStatusId || 'all'}:${categoryId || 'all'}`;
      const cachedPage = await this.cacheService.get(cachedKey);
      if (cachedPage) {
        return JSON.parse(cachedPage);
      }

      const qb = this.databaseService
        .queryBuilder(this.bookCategoryRepository, 'category')
        .leftJoinAndSelect('category.bookCategoryRelations', 'bcr')
        .leftJoinAndSelect('bcr.book', 'book')
        .leftJoinAndSelect('book.author', 'author')
        .leftJoinAndSelect('book.bookType', 'bookType')
        .leftJoinAndSelect('book.accessStatus', 'accessStatus')
        .leftJoinAndSelect('book.progressStatus', 'progressStatus')
        .leftJoinAndSelect('book.chapters', 'chapters')
        .leftJoinAndSelect('book.reviews', 'reviews');

      if (userId) {
        qb.andWhere('author.id = :userId', { userId });
      }
      if (bookTypeId) {
        qb.andWhere('bookType.id = :bookTypeId', { bookTypeId });
      }
      if (accessStatusId) {
        qb.andWhere('accessStatus.id IN (:...accessStatusId)', {
          accessStatusId,
        });
      }
      if (progressStatusId) {
        qb.andWhere('progressStatus.id = :progressStatusId', {
          progressStatusId,
        });
      }
      if (categoryId && Array.isArray(categoryId)) {
        qb.andWhere('bcr.category_id IN (:...categoryId)', { categoryId });
      }
      if (search) {
        qb.andWhere(
          `(to_tsvector('simple', unaccent(lower(book.title))) @@ websearch_to_tsquery(unaccent(lower(:search))) 
               OR to_tsvector('simple', unaccent(lower(author.name))) @@ websearch_to_tsquery(unaccent(lower(:search)))
               OR unaccent(lower(book.title)) ILIKE :prefixSearch 
               OR unaccent(lower(author.name)) ILIKE :prefixSearch)`,
          {
            search: search.replace(/\s+/g, ' & '),
            prefixSearch: `%${search}%`,
          },
        );
      }
      if (hasChapters) {
        qb.andWhere('chapters.id IS NOT NULL');
      }

      const categories = await qb.getMany();

      const allCategories = await this.bookCategoryRepository.find();
      const categoryMap = new Map<number, any>();

      categories.forEach((category) => {
        const dto = plainToInstance(GetBookCategoryDto, category, {
          excludeExtraneousValues: true,
        });
        const booksInCategory = category.bookCategoryRelations.map(
          (relation) => relation.book,
        );
        dto.totalBooks = booksInCategory.length || 0;
        categoryMap.set(category.id, dto);
      });

      allCategories.forEach((category) => {
        if (!categoryMap.has(category.id)) {
          const dto = plainToInstance(GetBookCategoryDto, category, {
            excludeExtraneousValues: true,
          });
          dto.totalBooks = 0;
          categoryMap.set(category.id, dto);
        }
      });

      const response = Array.from(categoryMap.values()).sort(
        (a, b) => a.id - b.id,
      );

      // await this.cacheService.set(
      //   cachedKey,
      //   JSON.stringify(response),
      //   this.redisBookTtl,
      // );

      return response;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getBookCategory');
      throw error;
    }
  }

  async getBookType(): Promise<GetBookTypeDto[]> {
    try {
      const types = await this.databaseService.findAll(
        this.bookTypeRepository,
        { order: { id: 'ASC' } },
      );
      if (!types || types.length === 0) {
        throw new NotFoundException('Không tìm thấy loại sách nào');
      }
      return plainToInstance(GetBookTypeDto, types, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getBookType');
      throw error;
    }
  }

  async getProgressStatus(user): Promise<GetProgressStatusDto[]> {
    try {
      const roleId = user.role.id;
      const filter = roleId === 3 ? { id: In([1, 2, 3]) } : {};

      const statuses = await this.databaseService.findAll(
        this.bookProgressStatusRepository,
        { where: filter, order: { id: 'ASC' } },
      );

      const dtos = plainToInstance(GetProgressStatusDto, statuses, {
        excludeExtraneousValues: true,
      });

      return Array.isArray(dtos) ? dtos : [dtos];
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getProgressStatus');
      throw error;
    }
  }

  async getAccessStatus(user): Promise<GetAccessStatusDto[]> {
    try {
      const roleId = user.role.id;
      const filter = roleId === 3 ? { id: In([1, 2]) } : {};

      const statuses = await this.databaseService.findAll(
        this.bookAccessStatusRepository,
        { where: filter, order: { id: 'ASC' } },
      );

      const dtos = plainToInstance(GetAccessStatusDto, statuses, {
        excludeExtraneousValues: true,
      });

      return Array.isArray(dtos) ? dtos : [dtos];
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getAccessStatus');
      throw error;
    }
  }

  async createBook(
    dto: CreateBookDto,
    author: Book['author'],
  ): Promise<number> {
    try {
      const book = await this.databaseService.create(this.bookRepository, {
        title: dto.title,
        description: dto.description,
        cover: dto.cover,
        ageRating: dto.ageRating,
        bookType: { id: dto.bookTypeId },
        accessStatus: { id: dto.accessStatusId },
        progressStatus: { id: dto.progressStatusId },
        author: { id: author.id },
      });

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        dto.categoryIds.map((categoryId) =>
          this.databaseService.create(this.bookCategoryRelationRepository, {
            book: book,
            category: { id: categoryId },
          }),
        );
      }

      if (dto.accessStatusId === 4) {
        this.notificationGateway.sendNewPendingReviewToAdmin(
          book.id,
          book.title,
          this.getStatusMessage(book.title, book.accessStatus.id, book.author.name),
          book.author.id
        );
      }

      await this.cacheService.deletePattern('books:*');

      return book.id;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.createBook');
      throw error;
    }
  }

  async updateBook(
    bookId: number,
    dto: UpdateBookDto,
    author: Book['author'],
  ): Promise<boolean> {
    try {
      const book = await this.databaseService.findOne(this.bookRepository, {
        where: { id: bookId },
        relations: ['author'],
      });
      if (!book) {
        throw new NotFoundException('Không tìm thấy sách');
      }

      if (book.author.id !== author.id) {
        throw new ForbiddenException('Bạn không có quyền cập nhật sách này');
      }

      await this.databaseService.update(this.bookRepository, bookId, {
        title: dto.title,
        description: dto.description,
        cover: dto.cover,
        ageRating: dto.ageRating,
        progressStatus: { id: dto.progressStatusId },
        moderated: dto.moderated,
        bookType: { id: dto.bookTypeId },
        accessStatus: { id: dto.accessStatusId },
      });

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        await this.bookCategoryRelationRepository.delete({
          book: { id: bookId },
        });

        for (const categoryId of dto.categoryIds) {
          await this.databaseService.create(
            this.bookCategoryRelationRepository,
            {
              book: { id: bookId },
              category: { id: categoryId },
            },
          );
        }
      }

      // Send notification to admin if book is pending review
     if (dto.accessStatusId === 4) {
      this.notificationGateway.sendNewPendingReviewToAdmin(
        book.id,
        book.title,
        this.getStatusMessage(book.title, dto.accessStatusId, book.author.name),
        book.author.id
      );
     }

      await this.cacheService.deletePattern('books:*');

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.updateBook');
      throw error;
    }
  }

  async patchBook(
    bookId: number,
    dto: PatchBookDto,
    author: Book['author'],
  ): Promise<boolean> {
    try {
      const book = await this.databaseService.findOne(this.bookRepository, {
        where: { id: bookId },
        relations: ['author', 'accessStatus'],
      });
      if (!book) {
        throw new NotFoundException('Không tìm thấy sách');
      }

      if (book.author.id !== author.id) {
        throw new ForbiddenException('Bạn không có quyền cập nhật sách này');
      }

      // Create an update object with only the provided fields
      const updateData: any = {};
      
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.cover !== undefined) updateData.cover = dto.cover;
      if (dto.ageRating !== undefined) updateData.ageRating = dto.ageRating;
      if (dto.progressStatusId !== undefined) {
        updateData.progressStatus = { id: dto.progressStatusId };
      }
      if (dto.accessStatusId !== undefined) {
        updateData.accessStatus = { id: dto.accessStatusId };
      }
      if (dto.moderated !== undefined) {
        updateData.moderated = dto.moderated;
      }
      
      // Only update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        await this.databaseService.update(this.bookRepository, bookId, updateData);
      }

      // Handle category IDs if provided
      if (dto.categoryIds && dto.categoryIds.length > 0) {
        await this.bookCategoryRelationRepository.delete({
          book: { id: bookId },
        });

        for (const categoryId of dto.categoryIds) {
          await this.databaseService.create(
            this.bookCategoryRelationRepository,
            {
              book: { id: bookId },
              category: { id: categoryId },
            },
          );
        }
      }

      await this.cacheService.deletePattern('books:*');

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.patchBook');
      throw error;
    }
  }

  async deleteBook(bookId: number, author: Book['author']): Promise<boolean> {
    try {
      const book = await this.databaseService.findOne(this.bookRepository, {
        where: { id: bookId },
        relations: ['author'],
      });
      if (!book) {
        throw new NotFoundException('Không tìm thấy sách');
      }

      if (book.author.id !== author.id) {
        throw new ForbiddenException('Bạn không có quyền xóa sách này');
      }

      await this.databaseService.delete(this.bookRepository, bookId);
      this.loggerService.info(
        `Book with id ${bookId} deleted`,
        'BookService.deleteBook',
      );

      await this.cacheService.deletePattern('books:*');

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.deleteBook');
      throw error;
    }
  }

  async createChapters(
    dto: CreateMultipleBookChaptersDto,
    bookId: number,
    author: Book['author'],
  ): Promise<boolean> {
    try {
      const book = await this.databaseService.findOne(this.bookRepository, {
        where: { id: bookId },
        relations: ['author'],
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      if (book.author.id !== author.id) {
        throw new ForbiddenException(
          'You do not have permission to add chapters to this book',
        );
      }

      const chapterNumbers = dto.chapters.map((chapter) => chapter.chapter);
      const uniqueChapterNumbers = [...new Set(chapterNumbers)];
      if (chapterNumbers.length !== uniqueChapterNumbers.length) {
        throw new BadRequestException('Chapters in the request are duplicated');
      }

      const existingChapters = await this.databaseService.findAll(
        this.bookChapterRepository,
        {
          where: { book: { id: bookId }, chapter: In(chapterNumbers) },
          select: ['chapter'],
        },
      );

      if (existingChapters.length > 0) {
        const existingChapterNumbers = existingChapters.map(
          (chapter) => chapter.chapter,
        );
        throw new BadRequestException(
          `Chapter ${existingChapterNumbers.join(', ')} already exists`,
        );
      }

      const chaptersToInsert = dto.chapters.map((chapterDto, index) => {
        if (chapterDto.chapter > 3) {
          chapterDto.isLocked = true;
          chapterDto.price = 20;
        } else {
          chapterDto.isLocked = false;
          chapterDto.price = 0;
        }

        return {
          title: chapterDto.title,
          chapter: chapterDto.chapter,
          content: chapterDto.content,
          cover: chapterDto.cover,
          isLocked: chapterDto.isLocked,
          price: chapterDto.price,
          moderated: chapterDto.moderated || null,
          book: { id: book.id },
          chapterAccessStatus: chapterDto.chapterAccessStatus,
        };
      });

      await this.bookChapterRepository.save(chaptersToInsert as any);

      await this.databaseService.update(this.bookRepository, book.id, {
        updatedAt: new Date(),
      });

      await this.cacheService.deletePattern('books:*');

      const followers = await this.databaseService.findAll(
        this.bookFollowRepository,
        {
          where: { book: { id: book.id } },
          relations: ['user'],
        },
      );

      // Send notification to followers
      if (followers.length > 0) {
        this.notificationGateway.sendNewChapterNotification(
          book.id,
          book.title,
          chaptersToInsert.map((chapter) => chapter.title),
          followers.map((follower) => follower.user.id),
          author.id,
        );
      }

      return true;
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookChapterService.createChapters',
      );
      throw error;
    }
  }

  async updateChapter(
    chapterId: number,
    dto: UpdateBookChapterDto,
    author: Book['author'],
  ): Promise<boolean> {
    try {
      const chapter = await this.databaseService.findOne(
        this.bookChapterRepository,
        {
          where: { id: chapterId },
          relations: ['book', 'book.author'],
        },
      );

      if (!chapter) {
        throw new NotFoundException('Không tìm thấy chương sách');
      }

      if (chapter.book.author.id !== author.id) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật chương sách này',
        );
      }

      await this.databaseService.update(this.bookChapterRepository, chapterId, {
        title: dto.title,
        chapter: dto.chapter,
        content: dto.content,
        cover: dto.cover,
        isLocked: dto.isLocked,
        price: dto.price,
        chapterAccessStatus: dto.chapterAccessStatus,
      });

      await this.cacheService.deletePattern('books:*');

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.updateChapter');
      throw error;
    }
  }

  async patchChapter(
    chapterId: number,
    dto: PatchBookChapterDto,
    author: Book['author'],
  ): Promise<boolean> {
    try {
      const chapter = await this.databaseService.findOne(
        this.bookChapterRepository,
        {
          where: { id: chapterId },
          relations: ['book', 'book.author'],
        },
      );

      if (!chapter) {
        throw new NotFoundException('Không tìm thấy chương sách');
      }

      if (chapter.book.author.id !== author.id) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật chương sách này',
        );
      }

      // Create an update object with only the provided fields
      const updateData: any = {};
      
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.chapter !== undefined) updateData.chapter = dto.chapter;
      if (dto.content !== undefined) updateData.content = dto.content;
      if (dto.cover !== undefined) updateData.cover = dto.cover;
      if (dto.isLocked !== undefined) updateData.isLocked = dto.isLocked;
      if (dto.price !== undefined) updateData.price = dto.price;
      if (dto.moderated !== undefined) updateData.moderated = dto.moderated;
      
      // Only update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        await this.databaseService.update(this.bookChapterRepository, chapterId, updateData);
      }

      await this.cacheService.deletePattern('books:*');

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.patchChapter');
      throw error;
    }
  }

  async deleteChapter(
    chapterId: number,
    author: Book['author'],
  ): Promise<boolean> {
    try {
      const chapter = await this.databaseService.findOne(
        this.bookChapterRepository,
        {
          where: { id: chapterId },
          relations: ['book', 'book.author'],
        },
      );

      if (!chapter) {
        throw new NotFoundException('Không tìm thấy chương sách');
      }

      if (chapter.book.author.id !== author.id) {
        throw new ForbiddenException('Bạn không có quyền xóa chương này');
      }

      await this.databaseService.delete(this.bookChapterRepository, chapterId);
      this.loggerService.info(
        `Chapter with id ${chapterId} deleted`,
        'BookChapterService.deleteChapter',
      );

      await this.databaseService.update(this.bookRepository, chapter.book.id, {
        updatedAt: new Date(),
      });

      await this.cacheService.deletePattern('books:*');

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookChapterService.deleteChapter');
      throw error;
    }
  }

  async getChapter(
    user: UserResponseDto,
    chapterId: number,
  ): Promise<GetBookChapterDto> {
    try {
      const chapter = await this.databaseService.findOne<BookChapter>(
        this.bookChapterRepository,
        {
          where: { id: chapterId },
          relations: [
            'book',
            'book.bookType',
            'book.author',
            'book.accessStatus',
            'book.bookCategoryRelations',
            'book.bookCategoryRelations.category',
          ],
        },
      );

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      if (
        user &&
        user.id &&
        chapter.book &&
        ((chapter.book.author &&
        chapter.book.author.id === user.id) ||
        user?.role?.id === 1 || user?.role?.id === 2)
      ) {
        chapter.isLocked = false;
      } else if (chapter.isLocked) {
        let isPurchased = false;
        if (user && user.id) {
          const purchase = await this.chapterPurchaseRepository.findOne({
            where: { user: { id: user.id }, chapter: { id: chapter.id } },
          });
          isPurchased = Boolean(purchase);
        }

        if (isPurchased) {
          chapter.isLocked = false;
        } else {
          const summaryChapter = {
            id: chapter.id,
            title: chapter.title,
            chapter: chapter.chapter,
            isLocked: true,
            content: undefined,
            cover: undefined,
            price: chapter.price,
            book: undefined,
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
            moderated: chapter.moderated || null,
            chapterAccessStatus: chapter.chapterAccessStatus,
          } as unknown as BookChapter;

          return plainToInstance(GetBookChapterDto, summaryChapter, {
            excludeExtraneousValues: true,
          });
        }
      }

      return plainToInstance(GetBookChapterDto, chapter, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'BookChapterService.getChapter');
      throw error;
    }
  }

  async createReview(
    bookId: number,
    user: User,
    dto: CreateBookReviewDto,
  ): Promise<BookReview> {
    try {
      // Get the book with author information
      const book = await this.bookRepository.findOne({
        where: { id: bookId },
        relations: ['author']
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      const review = this.bookReviewRepository.create({
        book: { id: bookId },
        user: { id: user.id },
        rating: dto.rating,
        comment: dto.comment,
      });

      const savedReview = await this.bookReviewRepository.save(review);

      // Send rating notification to book author (if the reviewer is not the author)
      if (book.author.id !== user.id) {
        this.notificationGateway.sendBookRatingNotification(
          book.id,
          book.title,
          book.author.id,
          user.name,
          dto.rating
        );
      }

      return savedReview;
    } catch (error) {
      this.loggerService.err(error.message, 'BookReviewService.createReview');
      throw error;
    }
  }

  async updateReview(
    reviewId: number,
    user: User,
    dto: UpdateBookReviewDto,
  ): Promise<BookReview> {
    try {
      const review = await this.bookReviewRepository.findOne({
        where: { id: reviewId },
        relations: ['user'],
      });

      if (!review) throw new NotFoundException('Không tìm thấy đánh giá');

      if (review.user.id !== user.id)
        throw new ForbiddenException(
          'Bạn không thể sửa đánh giá của người khác',
        );

      Object.assign(review, dto);

      return await this.bookReviewRepository.save(review);
    } catch (error) {
      this.loggerService.err(error.message, 'BookReviewService.updateReview');
      throw error;
    }
  }

  async deleteReview(reviewId: number, user: User): Promise<void> {
    try {
      const review = await this.bookReviewRepository.findOne({
        where: { id: reviewId },
        relations: ['user'],
      });

      if (!review) throw new NotFoundException('Không tìm thấy đánh giá');

      if (review.user.id !== user.id)
        throw new ForbiddenException(
          'Bạn không thể xóa đánh giá của người khác',
        );

      await this.bookReviewRepository.remove(review);
    } catch (error) {
      this.loggerService.err(error.message, 'BookReviewService.deleteReview');
      throw error;
    }
  }

  async getReviews(
    bookId: number,
    pagination: PaginationRequestDto,
  ): Promise<PaginationResponseDto<BookReviewResponseDto>> {
    try {
      const { limit = 10, page = 1 } = pagination;
      const [data, totalItems] = await this.bookReviewRepository.findAndCount({
        where: { book: { id: bookId } },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: (page - 1) * limit,
        relations: ['user'],
      });

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: plainToInstance(BookReviewResponseDto, data, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      this.loggerService.err(error.message, 'BookReviewService.getReviews');
      throw error;
    }
  }

  async createComment(
    chapterId: number,
    user: User,
    dto: CreateBookChapterCommentDto,
  ): Promise<Boolean> {
    try {
      dto.chapterId = chapterId;

      if (dto.parentId) {
        const parent = await this.databaseService.findOne(
          this.bookChapterCommentRepository,
          {
            where: { id: dto.parentId },
            relations: ['user', 'chapter', 'chapter.book']
          },
        );
        if (!parent) {
          throw new NotFoundException('Bình luận gốc không tồn tại');
        }

        // This is a reply to another comment - send notification to parent comment owner
        const commentOwner = parent.user;
        if (commentOwner.id !== user.id) {
          // Only notify if the comment owner is not the same as the replier
          this.notificationGateway.sendCommentReplyNotification(
            parent.chapter.book.id,
            parent.chapter.book.title,
            parent.chapter.id,
            parent.chapter.title,
            commentOwner.id,
            user.name
          );
        }
      }

      // Get book chapter details for notification
      const chapter = await this.bookChapterRepository.findOne({
        where: { id: chapterId },
        relations: ['book', 'book.author']
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      await this.databaseService.create(this.bookChapterCommentRepository, {
        user,
        chapter: { id: chapterId },
        comment: dto.comment,
        parent: dto.parentId ? { id: dto.parentId } : undefined,
      });

      // Send notification to book author about the new comment (if it's not a reply and not the author's own comment)
      if (!dto.parentId && user.id !== chapter.book.author.id) {
        this.notificationGateway.sendChapterCommentNotification(
          chapter.book.id,
          chapter.book.title,
          chapter.id,
          chapter.title,
          chapter.book.author.id,
          user.name
        );
      }

      return true;
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookChapterCommentService.createComment',
      );
      throw error;
    }
  }

  async updateComment(
    commentId: number,
    user: User,
    dto: UpdateBookChapterCommentDto,
  ): Promise<BookChapterComment> {
    try {
      const comment = await this.bookChapterCommentRepository.findOne({
        where: { id: commentId },
        relations: ['user'],
      });

      if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

      if (comment.user.id !== user.id)
        throw new ForbiddenException(
          'Bạn không thể sửa bình luận của người khác',
        );

      Object.assign(comment, dto);
      return await this.bookChapterCommentRepository.save(comment);
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookChapterCommentService.updateComment',
      );
      throw error;
    }
  }

  async deleteComment(commentId: number, user: User): Promise<void> {
    try {
      const comment = await this.bookChapterCommentRepository.findOne({
        where: { id: commentId },
        relations: ['user'],
      });

      if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

      if (comment.user.id !== user.id)
        throw new ForbiddenException(
          'Bạn không thể xóa bình luận của người khác',
        );

      await this.bookChapterCommentRepository.remove(comment);
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookChapterCommentService.deleteComment',
      );
      throw error;
    }
  }

  async getComments(
    pagination: PaginationRequestDto,
    chapterId: number,
    commentId: number,
  ): Promise<PaginationResponseDto<BookChapterCommentResponseDto>> {
    try {
      const { limit = 10, page = 1 } = pagination;

      const whereClause = commentId
        ? { chapter: { id: chapterId }, parent: { id: commentId } }
        : { chapter: { id: chapterId }, parent: IsNull() };

      const [data, totalItems] =
        await this.bookChapterCommentRepository.findAndCount({
          where: whereClause,
          order: { createdAt: 'DESC' },
          take: limit,
          skip: (page - 1) * limit,
          relations: ['user'],
        });

      const dtos = plainToInstance(BookChapterCommentResponseDto, data, {
        excludeExtraneousValues: true,
      }) as BookChapterCommentResponseDto[];

      for (const dto of dtos) {
        dto.totalChildComments = await this.bookChapterCommentRepository.count({
          where: { parent: { id: dto.id } },
        });
      }

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: dtos,
      };
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookChapterCommentService.getComments',
      );
      throw error;
    }
  }

  async followBook(user: User, dto: BookFollowDto): Promise<Boolean> {
    try {
      const book = await this.bookRepository.findOne({
        where: { id: dto.bookId },
        relations: ['author']
      });
      
      if (!book) throw new NotFoundException('Book Not Found');

      const isFollowing = await this.bookFollowRepository.findOne({
        where: { user: { id: user.id }, book: { id: dto.bookId } },
      });

      if (isFollowing) throw new BadRequestException('Book already followed');

      await this.bookFollowRepository.save({
        user,
        book,
      });

      await this.bookRepository.increment({ id: book.id }, 'followsCount', 1);

      // Send notification to book author about new follower (if not the author following their own book)
      if (user.id !== book.author.id) {
        this.notificationGateway.sendBookFollowNotification(
          book.id,
          book.title,
          book.author.id,
          user.name
        );
      }

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.followBook');
      throw error;
    }
  }

  async unfollowBook(user: User, dto: BookFollowDto): Promise<Boolean> {
    try {
      const followRecord = await this.bookFollowRepository.findOne({
        where: { user: { id: user.id }, book: { id: dto.bookId } },
      });

      if (!followRecord)
        throw new NotFoundException('Bạn chưa theo dõi sách này');

      await this.bookFollowRepository.delete(followRecord.id);

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.unfollowBook');
      throw error;
    }
  }

  async getFollow(
    userId: number,
    pagination: PaginationRequestDto,
  ): Promise<PaginationResponseDto<GetListBookDto>> {
    try {
      const { limit = 10, page = 1 } = pagination;

      const [follows, totalItems] =
        await this.bookFollowRepository.findAndCount({
          where: { user: { id: userId } },
          order: { createdAt: 'DESC' },
          take: limit,
          skip: (page - 1) * limit,
          relations: [
            'book',
            'book.author',
            'book.bookType',
            'book.accessStatus',
            'book.progressStatus',
            'book.bookCategoryRelations',
            'book.bookCategoryRelations.category',
            'book.chapters',
            'book.reviews',
          ],
        });

      if (!follows?.length) {
        return {
          totalItems: 0,
          totalPages: 0,
          data: [],
        };
      }

      console.log('follows', follows);

      const books = follows.map((f) => f.book);
      const bookIds = books.map((book) => book.id);

      const subQuery = this.bookReadingHistoryRepository
        .createQueryBuilder('sub_history')
        .select([
          'MAX(sub_history.created_at) AS max_created_at',
          'sub_history.user_id AS user_id',
          'sub_history.book_id AS book_id',
        ])
        .where('sub_history.user_id = :userId', { userId })
        .andWhere('sub_history.book_id IN (:...bookIds)', { bookIds })
        .groupBy('sub_history.user_id, sub_history.book_id');

      const rawHistories = await this.bookReadingHistoryRepository
        .createQueryBuilder('history')
        .select([
          'history.chapter_id AS lastReadChapterId',
          'history.book_id AS bookId',
          'history.created_at AS createdAt',
        ])
        .innerJoin(
          `(${subQuery.getQuery()})`,
          'latest',
          'history.user_id = latest.user_id AND history.book_id = latest.book_id AND history.created_at = latest.max_created_at',
        )
        .setParameters(subQuery.getParameters())
        .getRawMany();

      const totalChaptersRead = await this.bookReadingHistoryRepository
        .createQueryBuilder('history')
        .select([
          'history.book_id AS bookid',
          'COUNT(DISTINCT history.chapter_id) AS totalreadchapters',
        ])
        .where('history.user_id = :userId', { userId })
        .andWhere('history.book_id IN (:...bookIds)', { bookIds })
        .groupBy('history.book_id')
        .getRawMany();

      const totalChaptersMap = new Map<number, number>();
      totalChaptersRead.forEach((item) => {
        totalChaptersMap.set(
          Number(item.bookid),
          Number(item.totalreadchapters),
        );
      });

      const chapterMap = new Map<number, number>();
      if (rawHistories.length > 0) {
        const chapterIds = rawHistories.map((h) =>
          Number(h.lastreadchapterid),
        );
        const chapters = await this.bookChapterRepository.find({
          where: { id: In(chapterIds) },
        });
        chapters.forEach((ch) => {
          chapterMap.set(ch.id, ch.chapter);
        });
      }

      const readingHistoriesMap = new Map<
        number,
        {
          lastReadChapterId: number;
          lastReadChapterNumber: number;
          totalReadChapters: number;
        }
      >();

      rawHistories.forEach((history) => {
        const bookId = Number(history.bookid);
        readingHistoriesMap.set(bookId, {
          lastReadChapterId: Number(history.lastreadchapterid),
          lastReadChapterNumber:
            chapterMap.get(Number(history.lastreadchapterid)) || 0,
          totalReadChapters: totalChaptersMap.get(bookId) || 0,
        });
      });

      const booksWithoutHistory = books.filter(
        (book) => !readingHistoriesMap.has(book.id),
      );
      if (booksWithoutHistory.length > 0) {
        const firstChapters = await this.bookChapterRepository
          .createQueryBuilder('chapter')
          .select([
            'chapter.id AS id',
            'chapter.chapter AS chapter',
            'chapter.book_id AS bookId',
          ])
          .where('chapter.book_id IN (:...bookIds)', {
            bookIds: booksWithoutHistory.map((b) => b.id),
          })
          .orderBy('chapter.book_id')
          .addOrderBy('chapter.chapter', 'ASC')
          .distinctOn(['chapter.book_id'])
          .getRawMany();

        firstChapters.forEach((ch) => {
          readingHistoriesMap.set(Number(ch.bookid), {
            lastReadChapterId: Number(ch.id),
            lastReadChapterNumber: Number(ch.chapter),
            totalReadChapters: 0,
          });
        });

        booksWithoutHistory.forEach((book) => {
          if (!readingHistoriesMap.has(book.id)) {
            readingHistoriesMap.set(book.id, {
              lastReadChapterId: 0,
              lastReadChapterNumber: 0,
              totalReadChapters: 0,
            });
          }
        });
      }

      const finalBooks = books.map((book) => {
        const chapters = book.chapters || [];
        const reviews = book.reviews || [];

        const totalChapters = chapters.length;
        const totalPrice = chapters.reduce(
          (sum, ch) => sum + Number(ch.price || 0),
          0,
        );
        const totalRating = reviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0,
        );
        const rating =
          reviews.length > 0 ? +(totalRating / reviews.length).toFixed(2) : 0;

        return {
          ...book,
          totalChapters,
          totalPrice,
          rating,
          isFollowed: true,
          readingProgress: readingHistoriesMap.get(book.id),
        };
      });

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: finalBooks.map((book) =>
          plainToInstance(GetListBookDto, book, {
            excludeExtraneousValues: true,
          }),
        ),
      };
    } catch (error) {
      this.loggerService.err(error.message, 'BookFollowService.getFollow');
      throw error;
    }
  }

  async createReport(
    user: User,
    createReportDto: BookReportDto,
  ): Promise<BookReportResponseDto> {
    try {
      const { bookId, reason } = createReportDto;

      const book = await this.bookRepository.findOne({ where: { id: bookId } });
      if (!book) {
        throw new Error('Sách không tồn tại');
      }

      const report = this.bookReportRepository.create({ user, book, reason });
      await this.bookReportRepository.save(report);

      return plainToInstance(BookReportResponseDto, report, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'BookReportService.createReport');
      throw error;
    }
  }

  async getReports(
    pagination: PaginationRequestDto,
  ): Promise<PaginationResponseDto<BookReportResponseDto>> {
    try {
      const { limit = 10, page = 1 } = pagination;

      const [data, totalItems] = await this.bookReportRepository.findAndCount({
        order: { createdAt: 'DESC' },
        take: limit,
        skip: (page - 1) * limit,
        relations: [
          'user',
          'book',
          'book.author',
          'book.bookType',
          'book.accessStatus',
          'book.progressStatus',
          'book.progressStatus',
          'book.bookCategoryRelations',
          'book.bookCategoryRelations.category',
        ],
      });

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: plainToInstance(BookReportResponseDto, data, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      this.loggerService.err(error.message, 'BookReportService.getReports');
      throw error;
    }
  }

  async createReadingHistory(
    user: User,
    dto: CreateBookReadingHistoryDto,
  ): Promise<boolean> {
    try {
      await this.databaseService.create(this.bookReadingHistoryRepository, {
        user: { id: user.id },
        book: { id: dto.bookId },
        chapter: { id: dto.chapterId },
      });

      return true;
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookReadingHistoryService.createReadingHistory',
      );
      throw error;
    }
  }

  async getReadingHistorySummary(
    user: User,
    pagination: PaginationRequestDto,
  ): Promise<PaginationResponseDto<BookReadingSummaryDto>> {
    try {
      const { page = 1, limit = 10 } = pagination;

      const readingHistories = await this.bookReadingHistoryRepository.find({
        where: { user: { id: user.id } },
        relations: [
          'book',
          'chapter',
          'book.author',
          'book.bookType',
          'book.accessStatus',
          'book.progressStatus',
          'book.bookCategoryRelations',
          'book.bookCategoryRelations.category',
        ],
        order: { createdAt: 'DESC' },
      });

      if (!readingHistories.length) {
        return {
          totalItems: 0,
          totalPages: 0,
          data: [],
        };
      }

      const chapterIds = Array.from(
        new Set(readingHistories.map((r) => r.chapter.id)),
      );

      const purchased = await this.chapterPurchaseRepository.find({
        where: {
          user: { id: user.id },
          chapter: { id: In(chapterIds) },
        },
        relations: ['chapter'],
      });

      const purchasedSet = new Set(purchased.map((p) => p.chapter.id));

      const bookMap = new Map<
        number,
        {
          bookDto: BookReadingSummaryDto;
          chapterMap: Map<number, ChapterReadDto>;
          latestTime: number;
        }
      >();

      const follows = await this.bookFollowRepository.find({
        where: { user: { id: user.id } },
        relations: ['book'],
      });

      const followedBookIds = new Set(follows.map((f) => f.book.id));

      for (const history of readingHistories) {
        const { book, chapter, createdAt } = history;

        if (!bookMap.has(book.id)) {
          const chapters = await this.bookChapterRepository.find({
            where: { book: { id: book.id }, chapterAccessStatus: ChapterAccessStatus.PUBLISHED },
          });
          const totalPrice = chapters.reduce(
            (sum, chapter) => sum + Number(chapter.price || 0),
            0,
          );

          const reviews = await this.bookReviewRepository.find({
            where: { book: { id: book.id } },
          });
          const totalRating = reviews.reduce(
            (sum, r) => sum + (r.rating || 0),
            0,
          );
          const rating =
            reviews.length > 0 ? +(totalRating / reviews.length).toFixed(2) : 0;

          bookMap.set(book.id, {
            bookDto: {
              id: book.id,
              title: book.title,
              description: book.description,
              cover: book.cover,
              views: book.views,
              rating: rating,
              totalChapters: chapters.length,
              totalPrice: totalPrice,
              followsCount: book.followsCount,
              isFollowed: followedBookIds.has(book.id),
              author: {
                id: book.author.id,
                email: book.author.email,
                name: book.author.name,
                avatar: book.author.avatar,
              },
              bookType: {
                id: book.bookType.id,
                name: book.bookType.name,
              },
              accessStatus: {
                id: book.accessStatus.id,
                name: book.accessStatus.name,
                description: book.accessStatus.description,
              },
              progressStatus: {
                id: book.progressStatus.id,
                name: book.progressStatus.name,
                description: book.progressStatus.description,
              },
              categories: book.bookCategoryRelations.map((bcr) => {
                return {
                  id: bcr.category.id,
                  name: bcr.category.name,
                };
              }),
              createdAt: book.createdAt,
              chaptersRead: [],
            },
            chapterMap: new Map<number, ChapterReadDto>(),
            latestTime: createdAt.getTime(),
          });
        }

        const entry = bookMap.get(book.id)!;
        entry.latestTime = Math.max(entry.latestTime, createdAt.getTime());

        const existing = entry.chapterMap.get(chapter.id);
        if (!existing || createdAt.getTime() > existing.lastReadAt.getTime()) {
          entry.chapterMap.set(chapter.id, {
            id: chapter.id,
            chapter: chapter.chapter,
            title: chapter.title,
            lastReadAt: createdAt,
            isLocked: chapter.isLocked,
          });
        }
      }

      const allBooks = Array.from(bookMap.values())
        .map(({ bookDto, chapterMap, latestTime }) => {
          const chapters = Array.from(chapterMap.values())
            .map((c) => ({
              ...c,
              isLocked: c.isLocked === false ? false : !purchasedSet.has(c.id),
            }))
            .sort((a, b) => b.lastReadAt.getTime() - a.lastReadAt.getTime());

          bookDto.chaptersRead = chapters;

          return {
            ...bookDto,
            _latestTime: latestTime,
          };
        })
        .sort((a, b) => b._latestTime - a._latestTime);

      const totalItems = allBooks.length;
      const totalPages = Math.ceil(totalItems / limit);
      const paginated = allBooks.slice((page - 1) * limit, page * limit);

      const data = paginated.map(({ _latestTime, ...dto }) =>
        plainToInstance(BookReadingSummaryDto, dto, {
          excludeExtraneousValues: true,
        }),
      );

      return {
        totalItems,
        totalPages,
        data,
      };
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookReadingHistoryService.getReadingHistorySummary',
      );
      throw error;
    }
  }

  async updateBookStatus(
    bookId: number,
    user: UserResponseDto,
    accessStatusId?: number,
    progressStatusId?: number,
  ): Promise<boolean> {
    try {
      const book = await this.bookRepository.findOne({
        where: { id: bookId },
        relations: ['author', 'accessStatus', 'progressStatus'],
      });

      if (!book) {
        throw new NotFoundException('Không tìm thấy sách này');
      }
      
      if (book.accessStatus.id === accessStatusId && book.progressStatus.id === progressStatusId) {
        return true;
      }

      if (progressStatusId) {
        const progressStatus = await this.bookProgressStatusRepository.findOne({
          where: { id: progressStatusId },
        });

        if (!progressStatus) {
          throw new NotFoundException('Không tìm thấy trạng thái tiến độ này');
        }

        book.progressStatus = progressStatus;
      }

      if (accessStatusId) {
        const accessStatus = await this.bookAccessStatusRepository.findOne({
          where: { id: accessStatusId },
        });

        if (!accessStatus) {
          throw new NotFoundException('Không tìm thấy trạng thái truy cập này');
        }

        book.accessStatus = accessStatus;
      }

      await this.bookRepository.save(book);

      if (accessStatusId) {
        // Update all chapters of the book
        const chapters = await this.bookChapterRepository.find({
          where: { book: { id: bookId } },
        });

        for (const chapter of chapters) {
          if (accessStatusId === 1 && chapter.chapterAccessStatus !== ChapterAccessStatus.PUBLISHED) {
            chapter.chapterAccessStatus = ChapterAccessStatus.PUBLISHED;
          } else if (accessStatusId === 3 && chapter.chapterAccessStatus !== ChapterAccessStatus.REJECTED) {
            chapter.chapterAccessStatus = ChapterAccessStatus.REJECTED;
          } else if (
            accessStatusId === 4 &&
            chapter.chapterAccessStatus !== ChapterAccessStatus.PENDING_REVIEW &&
            chapter.chapterAccessStatus !== ChapterAccessStatus.PUBLISHED
          ) {
            chapter.chapterAccessStatus = ChapterAccessStatus.PENDING_REVIEW;
          }

          await this.bookChapterRepository.save(chapter);
        }
      }

      // Create notification for book status change
      if (accessStatusId) {
        const statusMessage = this.getStatusMessage(book.title, book.accessStatus.id, book.author.name);

        this.loggerService.info(
          'Created book status notification',
          'BookService.updateBookStatuses',
        );

        // Use the new notification gateway for book status notifications
        if (accessStatusId === 1) {
          // Book was approved
          this.notificationGateway.sendBookApprovalNotification(
            book.id,
            book.title,
            book.author.id
          );
        } else if(accessStatusId === 2) {
          // Book was rejected
          this.notificationGateway.sendBookRejectionNotification(
            book.id,
            book.title,
            book.author.id,
            statusMessage
          );
        } else if (accessStatusId === 3) {
          // Book was blocked
          this.notificationGateway.sendBookBlockedNotification(
            book.id,
            book.title,
            book.author.id,
            statusMessage
          );
        } else if (accessStatusId === 4) {
          this.notificationGateway.sendNewPendingReviewToAdmin(
            book.id,
            book.title,
            statusMessage,
            book.author.id
          );
        }
      }

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.updateBookStatuses');
      throw error;
    }
  }

  async getReadingHistoryChart(
    timeRange: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<{ time: string; books: { title: string; count: number }[] }[]> {
    try {
      let dateFormat = 'YYYY-MM-DD';
      let whereClause = '';

      if (timeRange === 'daily') {
        dateFormat = 'YYYY-MM-DD';
        whereClause = `WHERE brh.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
      } else if (timeRange === 'weekly') {
        dateFormat = 'IYYY-IW';
        whereClause = `WHERE brh.created_at >= CURRENT_DATE - INTERVAL '14 weeks'`;
      } else if (timeRange === 'monthly') {
        dateFormat = 'YYYY-MM';
        whereClause = `WHERE brh.created_at >= CURRENT_DATE - INTERVAL '12 months'`;
      }

      const query = `
       SELECT 
        to_char(brh.created_at, $1) as time,
        b.title,
        COUNT(brh.id) AS count
      FROM book_reading_history brh
      JOIN book b ON brh.book_id = b.id
      ${whereClause}
      GROUP BY time, b.id
      ORDER BY time DESC, count DESC`;

      const rawResult: any[] = await this.databaseService.executeRawQuery(
        query,
        [dateFormat],
      );

      const groupedData = rawResult.reduce(
        (acc: Record<string, { title: string; count: number }[]>, row) => {
          const time = row.time;
          if (!acc[time]) {
            acc[time] = [];
          }
          acc[time].push({
            title: row.title,
            count: Number(row.count),
          });
          return acc;
        },
        {},
      );

      const chartData = Object.keys(groupedData).map((element) => {
        let formattedTime = element;
        if (timeRange === 'daily') {
          formattedTime = format(parseISO(element), 'dd-MM-yyyy');
        } else if (timeRange === 'weekly') {
          const [year, week] = element.split('-');
          formattedTime = `Tuần ${week}-${year}`;
        } else if (timeRange === 'monthly') {
          formattedTime = format(parseISO(element), 'MM-yyyy');
        }

        const sortedBooks = groupedData[element]
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        return { time: formattedTime, books: sortedBooks };
      });

      return chartData;
    } catch (error) {
      this.loggerService.err(
        error.message,
        'BookService.getReadingHistoryChart',
      );
      throw error;
    }
  }

  async getTrendingBooks(
    userId: number | null,
    params: GetTrendingBooksDto,
  ): Promise<PaginationResponseDto<GetListBookDto>> {
    try {
      const { page = 1, limit = 10 } = params;
      const offset = (page - 1) * limit;

      const rawTrending = await this.bookReadingHistoryRepository
        .createQueryBuilder('brh')
        .select('brh.book_id', 'bookId')
        .addSelect('COUNT(*)', 'view_count')
        .innerJoin(Book, 'b', 'b.id = brh.book_id AND b.accessStatus = 1')
        .where("brh.created_at >= NOW() - INTERVAL '30 days'")
        .groupBy('brh.book_id')
        .orderBy('view_count', 'DESC')
        .offset(offset)
        .limit(limit)
        .getRawMany();

      let books: Book[] = [];
      let totalItems = 0;
      let bookIds: number[] = [];

      if (rawTrending.length > 0) {
        bookIds = rawTrending.map((row) => Number(row.bookId));

        const countRows = await this.bookReadingHistoryRepository
          .createQueryBuilder('brh')
          .select('brh.book_id')
          .innerJoin(Book, 'b', 'b.id = brh.book_id AND b.accessStatus = 1')
          .where("brh.created_at >= NOW() - INTERVAL '30 days'")
          .groupBy('brh.book_id')
          .getRawMany();

        totalItems = countRows.length;

        const rawBooks = await this.bookRepository.find({
          where: { id: In(bookIds), accessStatus: { id: 1 } },
          relations: [
            'author',
            'bookType',
            'accessStatus',
            'progressStatus',
            'bookCategoryRelations',
            'bookCategoryRelations.category',
            'chapters',
            'reviews',
          ],
        });

        books = bookIds
          .map((id) => rawBooks.find((b) => b.id === id))
          .filter((book): book is Book => !!book);
      } else {
        totalItems = await this.bookRepository.count({
          where: { accessStatus: { id: 1 } },
        });

        books = await this.bookRepository.find({
          where: { accessStatus: { id: 1 } },
          take: limit,
          skip: offset,
          order: { createdAt: 'DESC' },
          relations: [
            'author',
            'bookType',
            'accessStatus',
            'progressStatus',
            'bookCategoryRelations',
            'bookCategoryRelations.category',
            'chapters',
            'reviews',
          ],
        });

        bookIds = books.map((b) => b.id);
      }

      let followedBookIds = new Set<number>();
      if (userId && bookIds.length > 0) {
        const followedBooks = await this.bookFollowRepository.find({
          where: {
            user: { id: userId },
            book: In(bookIds),
          },
          relations: ['book'],
        });
        followedBookIds = new Set(followedBooks.map((f) => f.book.id));
      }

      const readingHistoriesMap = new Map<
        number,
        {
          lastReadChapterId: number;
          lastReadChapterNumber: number;
          totalReadChapters: number;
        }
      >();

      if (!userId) {
        const booksWithChapters = books.filter(
          (book) => book.chapters && book.chapters.length > 0,
        );
        const bookIds = booksWithChapters.map((book) => book.id);

        if (bookIds.length > 0) {
          const firstChapters = await this.bookChapterRepository
            .createQueryBuilder('chapter')
            .select([
              'chapter.id AS id',
              'chapter.chapter AS chapter',
              'chapter.book_id AS bookId',
            ])
            .where('chapter.book_id IN (:...bookIds)', { bookIds })
            .orderBy('chapter.book_id')
            .addOrderBy('chapter.chapter', 'ASC')
            .distinctOn(['chapter.book_id'])
            .getRawMany();

          firstChapters.forEach((chapter) => {
            readingHistoriesMap.set(Number(chapter.bookid), {
              lastReadChapterId: Number(chapter.id),
              lastReadChapterNumber: Number(chapter.chapter),
              totalReadChapters: 0,
            });
          });
        }

        books.forEach((book) => {
          if (!readingHistoriesMap.has(book.id)) {
            readingHistoriesMap.set(book.id, {
              lastReadChapterId: 0,
              lastReadChapterNumber: 0,
              totalReadChapters: 0,
            });
          }
        });
      } else if (userId && bookIds.length > 0) {
        const subQuery = this.bookReadingHistoryRepository
          .createQueryBuilder('sub_history')
          .select([
            'MAX(sub_history.created_at) AS max_created_at',
            'sub_history.user_id AS user_id',
            'sub_history.book_id AS book_id',
          ])
          .where('sub_history.user_id = :userId', { userId })
          .andWhere('sub_history.book_id IN (:...bookIds)', { bookIds })
          .groupBy('sub_history.user_id, sub_history.book_id');

        const rawHistories = await this.bookReadingHistoryRepository
          .createQueryBuilder('history')
          .select([
            'history.chapter_id AS lastReadChapterId',
            'history.book_id AS bookId',
            'history.created_at AS createdAt',
          ])
          .innerJoin(
            `(${subQuery.getQuery()})`,
            'latest',
            'history.user_id = latest.user_id AND history.book_id = latest.book_id AND history.created_at = latest.max_created_at',
          )
          .setParameters(subQuery.getParameters())
          .getRawMany();

        const totalChaptersRead = await this.bookReadingHistoryRepository
          .createQueryBuilder('history')
          .select([
            'history.book_id AS bookid',
            'COUNT(DISTINCT history.chapter_id) AS totalreadchapters',
          ])
          .where('history.user_id = :userId', { userId })
          .andWhere('history.book_id IN (:...bookIds)', { bookIds })
          .groupBy('history.book_id')
          .getRawMany();

        const totalChaptersMap = new Map<number, number>();
        totalChaptersRead.forEach((item) => {
          totalChaptersMap.set(
            Number(item.bookid),
            Number(item.totalreadchapters),
          );
        });

        const chapterMap = new Map<number, number>();
        if (rawHistories.length > 0) {
          const chapterIds = rawHistories.map((h) =>
            Number(h.lastreadchapterid),
          );
          const chapters = await this.bookChapterRepository.find({
            where: { id: In(chapterIds) },
          });
          chapters.forEach((ch) => {
            chapterMap.set(ch.id, ch.chapter);
          });
        }

        rawHistories.forEach((history) => {
          const bookId = Number(history.bookid);
          readingHistoriesMap.set(bookId, {
            lastReadChapterId: Number(history.lastreadchapterid),
            lastReadChapterNumber:
              chapterMap.get(Number(history.lastreadchapterid)) || 0,
            totalReadChapters: totalChaptersMap.get(bookId) || 0,
          });
        });

        const booksWithoutHistory = books.filter(
          (book) => !readingHistoriesMap.has(book.id),
        );
        if (booksWithoutHistory.length > 0) {
          const firstChapters = await this.bookChapterRepository
            .createQueryBuilder('chapter')
            .select([
              'chapter.id AS id',
              'chapter.chapter AS chapter',
              'chapter.book_id AS bookId',
            ])
            .where('chapter.book_id IN (:...bookIds)', {
              bookIds: booksWithoutHistory.map((b) => b.id),
            })
            .orderBy('chapter.book_id')
            .addOrderBy('chapter.chapter', 'ASC')
            .distinctOn(['chapter.book_id'])
            .getRawMany();

          firstChapters.forEach((ch) => {
            readingHistoriesMap.set(Number(ch.bookid), {
              lastReadChapterId: Number(ch.id),
              lastReadChapterNumber: Number(ch.chapter),
              totalReadChapters: 0,
            });
          });

          booksWithoutHistory.forEach((book) => {
            if (!readingHistoriesMap.has(book.id)) {
              readingHistoriesMap.set(book.id, {
                lastReadChapterId: 0,
                lastReadChapterNumber: 0,
                totalReadChapters: 0,
              });
            }
          });
        }
      }

      const booksWithDetails = books.map((book) => {
        const chapters = book.chapters || [];
        const reviews = book.reviews || [];

        const totalChapters = chapters.length;
        const totalPrice = chapters.reduce(
          (sum, chapter) => sum + Number(chapter.price || 0),
          0,
        );

        const totalRating = reviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0,
        );
        const rating =
          reviews.length > 0 ? +(totalRating / reviews.length).toFixed(2) : 0;

        return {
          ...book,
          totalChapters,
          totalPrice,
          rating,
          isFollowed: followedBookIds.has(book.id),
          readingProgress: readingHistoriesMap.get(book.id),
        };
      });

      const response: PaginationResponseDto<GetListBookDto> = {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: plainToInstance(GetListBookDto, booksWithDetails, {
          excludeExtraneousValues: true,
        }),
      };

      return response;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getTrendingBooks');
      throw error;
    }
  }

  async getRecommendedBooks(
    userId: number | null,
    params: GetRecommendedBooksDto,
  ): Promise<GetListBookDto[]> {
    try {
      const limit = params.limit ?? 15;
      let books: Book[] = [];

      const buildBaseQuery = () => {
        return this.bookRepository
          .createQueryBuilder('book')
          .leftJoinAndSelect('book.author', 'author')
          .leftJoinAndSelect('book.bookType', 'bookType')
          .leftJoinAndSelect('book.accessStatus', 'accessStatus')
          .leftJoinAndSelect('book.progressStatus', 'progressStatus')
          .leftJoinAndSelect('book.bookCategoryRelations', 'relation')
          .leftJoinAndSelect('relation.category', 'category')
          .leftJoinAndSelect('book.chapters', 'chapters', 'chapters.chapterAccessStatus = :chapterAccessStatus', { chapterAccessStatus: ChapterAccessStatus.PUBLISHED })
          .leftJoinAndSelect('book.reviews', 'reviews')
          .addSelect(
            (subQuery) =>
              subQuery
                .select('COALESCE(AVG(review.rating), 0)', 'avgRating')
                .from(BookReview, 'review')
                .where('review.book = book.id'),
            'rating',
          )
          .where('book.accessStatus.id = 1');
      };

      if (userId) {
        const favoriteCategories = await this.userFavoriteRepository.find({
          where: { user: { id: userId } },
        });

        if (favoriteCategories.length > 0) {
          const categoryIds = favoriteCategories.map((fav) => fav.category.id);

          const rawBooks = await buildBaseQuery()
            .where('relation.category_id IN (:...categoryIds)', { categoryIds })
            .groupBy(
              'book.id, author.id, bookType.id, accessStatus.id, progressStatus.id, relation.id, category.id, chapters.id, reviews.id',
            )
            .orderBy('rating', 'DESC')
            .addOrderBy('book.createdAt', 'DESC')
            .take(limit)
            .getMany();

          books = rawBooks;
        }
      }

      if (books.length < limit) {
        const excludeIds = books.map((book) => book.id);
        const remaining = limit - books.length;

        let moreBooksQuery = buildBaseQuery()
          .groupBy(
            'book.id, author.id, bookType.id, accessStatus.id, progressStatus.id, relation.id, category.id, chapters.id, reviews.id',
          )
          .orderBy('rating', 'DESC')
          .addOrderBy('book.createdAt', 'DESC')
          .take(remaining);

        if (excludeIds.length > 0) {
          moreBooksQuery = moreBooksQuery.andWhere(
            'book.id NOT IN (:...excludeIds)',
            { excludeIds },
          );
        }

        const moreBooks = await moreBooksQuery.getMany();
        books = books.concat(moreBooks);
      }

      let followedBookIds = new Set<number>();
      if (userId && books.length > 0) {
        const followed = await this.bookFollowRepository.find({
          where: {
            user: { id: userId },
            book: In(books.map((b) => b.id)),
          },
          relations: ['book'],
        });
        followedBookIds = new Set(followed.map((f) => f.book.id));
      }

      let readingHistoriesMap: Map<
        number,
        {
          lastReadChapterId: number;
          lastReadChapterNumber: number;
          totalReadChapters: number;
        }
      > = new Map();

      if (!userId) {
        const booksWithChapters = books.filter(
          (book) => book.chapters && book.chapters.length > 0,
        );
        const bookIds = booksWithChapters.map((book) => book.id);


        if (bookIds.length > 0) {
          const firstChapters = await this.bookChapterRepository
            .createQueryBuilder('chapter')
            .select([
              'chapter.id AS id',
              'chapter.chapter AS chapter',
              'chapter.book_id AS bookId',
            ])
            .where('chapter.book_id IN (:...bookIds)', { bookIds })
            .orderBy('chapter.book_id')
            .addOrderBy('chapter.chapter', 'ASC')
            .distinctOn(['chapter.book_id'])
            .getRawMany();

          firstChapters.forEach((chapter) => {
            readingHistoriesMap.set(Number(chapter.bookid), {
              lastReadChapterId: Number(chapter.id),
              lastReadChapterNumber: Number(chapter.chapter),
              totalReadChapters: 0,
            });
          });
        }

        books.forEach((book) => {
          if (!readingHistoriesMap.has(book.id)) {
            readingHistoriesMap.set(book.id, {
              lastReadChapterId: 0,
              lastReadChapterNumber: 0,
              totalReadChapters: 0,
            });
          }
        });
      } else if (userId) {
        const bookIds = books.map((book) => book.id);

        const subQuery = this.bookReadingHistoryRepository
          .createQueryBuilder('sub_history')
          .select([
            'MAX(sub_history.created_at) AS max_created_at',
            'sub_history.user_id AS user_id',
            'sub_history.book_id AS book_id',
          ])
          .where('sub_history.user_id = :userId', { userId })
          .andWhere('sub_history.book_id IN (:...bookIds)', { bookIds })
          .groupBy('sub_history.user_id, sub_history.book_id');

        const rawHistories = await this.bookReadingHistoryRepository
          .createQueryBuilder('history')
          .select([
            'history.chapter_id AS lastReadChapterId',
            'history.book_id AS bookId',
            'history.created_at AS createdAt',
          ])
          .innerJoin(
            `(${subQuery.getQuery()})`,
            'latest',
            'history.user_id = latest.user_id AND history.book_id = latest.book_id AND history.created_at = latest.max_created_at',
          )
          .setParameters(subQuery.getParameters())
          .getRawMany();

        const totalChaptersRead = await this.bookReadingHistoryRepository
          .createQueryBuilder('history')
          .select([
            'history.book_id AS bookid',
            'COUNT(DISTINCT history.chapter_id) AS totalreadchapters',
          ])
          .where('history.user_id = :userId', { userId })
          .andWhere('history.book_id IN (:...bookIds)', { bookIds })
          .groupBy('history.book_id')
          .getRawMany();

        const totalChaptersMap = new Map<number, number>();
        totalChaptersRead.forEach((item) => {
          totalChaptersMap.set(
            Number(item.bookid),
            Number(item.totalreadchapters),
          );
        });

        const chapterMap = new Map<number, number>();
        if (rawHistories.length > 0) {
          const chapterIds = rawHistories.map((h) =>
            Number(h.lastreadchapterid),
          );
          const chapters = await this.bookChapterRepository.find({
            where: { id: In(chapterIds) },
          });

          chapters.forEach((chapter) => {
            chapterMap.set(chapter.id, chapter.chapter);
          });

          rawHistories.forEach((history) => {
            const bookId = Number(history.bookid);
            readingHistoriesMap.set(bookId, {
              lastReadChapterId: Number(history.lastreadchapterid) || 0,
              lastReadChapterNumber:
                chapterMap.get(Number(history.lastreadchapterid)) || 0,
              totalReadChapters: totalChaptersMap.get(bookId) || 0,
            });
          });
        }

        const booksWithoutHistory = books.filter(
          (book) => !readingHistoriesMap.has(book.id),
        );

        if (booksWithoutHistory.length > 0) {
          const firstChapters = await this.bookChapterRepository
            .createQueryBuilder('chapter')
            .select([
              'chapter.id AS id',
              'chapter.chapter AS chapter',
              'chapter.book_id AS bookId',
            ])
            .where('chapter.book_id IN (:...bookIds)', {
              bookIds: booksWithoutHistory.map((b) => b.id),
            })
            .orderBy('chapter.book_id')
            .addOrderBy('chapter.chapter', 'ASC')
            .distinctOn(['chapter.book_id'])
            .getRawMany();

          firstChapters.forEach((chapter) => {
            readingHistoriesMap.set(Number(chapter.bookid), {
              lastReadChapterId: Number(chapter.id),
              lastReadChapterNumber: Number(chapter.chapter),
              totalReadChapters: 0,
            });
          });

          booksWithoutHistory.forEach((book) => {
            if (!readingHistoriesMap.has(book.id)) {
              readingHistoriesMap.set(book.id, {
                lastReadChapterId: 0,
                lastReadChapterNumber: 0,
                totalReadChapters: 0,
              });
            }
          });
        }
      }

      const booksWithDetails = books.map((book) => {
        const chapters = book.chapters || [];
        const reviews = book.reviews || [];

        const totalChapters = chapters.length;
        const totalPrice = chapters.reduce(
          (sum, chapter) => sum + Number(chapter.price || 0),
          0,
        );

        const totalRating = reviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0,
        );
        const rating =
          reviews.length > 0 ? +(totalRating / reviews.length).toFixed(2) : 0;

        const readingHistory = readingHistoriesMap.get(book.id);

        return {
          ...book,
          totalChapters,
          totalPrice,
          rating,
          isFollowed: followedBookIds.has(book.id),
          readingProgress: readingHistory,
        };
      });

      return plainToInstance(GetListBookDto, booksWithDetails, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getRecommendedBooks');
      throw error;
    }
  }

  async getRelatedBooks(
    bookId: number,
    userId: number | null,
    params: GetRelatedBooksDto,
  ): Promise<PaginationResponseDto<GetListBookDto>> {
    try {
      const { page = 1, limit = 10 } = params;
      const offset = (page - 1) * limit;

      const originBookQuery = `
      SELECT 
        author.id AS "originAuthorId",
        ARRAY(
          SELECT category.id 
          FROM book_category_relation bcr
          JOIN book_category category ON category.id = bcr.category_id
          WHERE bcr.book_id = $1
        ) AS "originCategoryIds"
      FROM book book
      LEFT JOIN "user" author ON author.id = book.author_id
      WHERE book.id = $1`;

      const originBookResult = await this.bookRepository.query(
        originBookQuery,
        [bookId],
      );
      if (!originBookResult?.length)
        throw new NotFoundException('Book not found');

      const { originAuthorId, originCategoryIds } = originBookResult[0];

      const booksQuery = `
      SELECT 
        book.*, 
        author.id AS author_id,
        author.name AS author_name,
        author.avatar AS author_avatar,
        book_type.id AS book_type_id,
        book_type.name AS book_type_name,
        access_status.id AS access_status_id,
        access_status.name AS access_status_name,
        access_status.description AS access_status_description,
        progress_status.id AS progress_status_id,
        progress_status.name AS progress_status_name,
        progress_status.description AS progress_status_description,
        CASE
          WHEN author.id = $2 AND EXISTS (
            SELECT 1 FROM book_category_relation bcr 
            WHERE bcr.book_id = book.id 
            AND bcr.category_id = ANY($3)
          ) THEN 0
          WHEN author.id = $2 THEN 1
          WHEN EXISTS (
            SELECT 1 FROM book_category_relation bcr 
            WHERE bcr.book_id = book.id 
            AND bcr.category_id = ANY($3)
          ) THEN 2
          ELSE 3
        END AS priority,
        COALESCE((SELECT AVG(rating) FROM book_review WHERE book_id = book.id), 0) AS avg_rating
      FROM book book
      LEFT JOIN "user" author ON author.id = book.author_id
      LEFT JOIN book_type ON book_type.id = book.book_type_id
      LEFT JOIN book_access_status access_status ON access_status.id = book.access_status_id
      LEFT JOIN book_progress_status progress_status ON progress_status.id = book.progress_status_id
      WHERE book.id != $1 AND book.access_status_id = 1
      ORDER BY 
        priority ASC,
        avg_rating DESC,
        book.created_at DESC
      LIMIT $4 OFFSET $5`;

      const books: Book[] = await this.bookRepository.query(booksQuery, [
        bookId,
        originAuthorId,
        originCategoryIds,
        limit,
        offset,
      ]);

      
      const bookIds = books.map((b) => b.id);   

      const categoriesQuery = `
      SELECT
        bcr.book_id AS book_id,
        JSON_AGG(
          JSON_BUILD_OBJECT('id', category.id, 'name', category.name)
          ORDER BY category.id ASC
        ) AS categories
      FROM book_category_relation bcr
      LEFT JOIN book_category category ON category.id = bcr.category_id
      WHERE bcr.book_id = ANY($1::int[])
      GROUP BY bcr.book_id`;
      const categoriesRaw = await this.bookRepository.query(categoriesQuery, [
        bookIds,
      ]);
      const categoriesMap = new Map<number, any>();
      categoriesRaw.forEach((row) => {
        categoriesMap.set(row.book_id, row.categories);
      });

      const countQuery = `
      SELECT COUNT(DISTINCT book.id) AS total
      FROM book book
      LEFT JOIN "user" author ON author.id = book.author_id
      LEFT JOIN book_category_relation bcr ON bcr.book_id = book.id
      LEFT JOIN book_category category ON category.id = bcr.category_id
      WHERE book.id != $1 AND book.access_status_id = 1`;
      const countResult = await this.bookRepository.query(countQuery, [bookId]);
      const totalItems = +countResult[0].total;

      const chaptersRaw = await this.bookChapterRepository.find({
        where: { book: { id: In(bookIds) } },
        relations: ['book'],
      });
      const chaptersMap = new Map<number, BookChapter[]>();
      chaptersRaw.forEach((c) => {
        const list = chaptersMap.get(c.book.id) || [];
        list.push(c);
        chaptersMap.set(c.book.id, list);
      });

      const reviewsRaw = await this.bookReviewRepository.find({
        where: { book: { id: In(bookIds) } },
        relations: ['book'],
      });
      const reviewsMap = new Map<number, BookReview[]>();
      reviewsRaw.forEach((r) => {
        const list = reviewsMap.get(r.book.id) || [];
        list.push(r);
        reviewsMap.set(r.book.id, list);
      });

      let followedBookIds = new Set<number>();
      if (userId && bookIds.length) {
        const followedBooks = await this.bookFollowRepository.find({
          where: {
            user: { id: userId },
            book: { id: In(bookIds) },
          },
          relations: ['book'],
        });
        followedBookIds = new Set(followedBooks.map((f) => f.book.id));
      }

      const readingHistoriesMap = new Map<
        number,
        {
          lastReadChapterId: number;
          lastReadChapterNumber: number;
          totalReadChapters: number;
        }
      >();

      if (!userId) {
        const booksWithChapters = books.filter((b) => chaptersMap.has(b.id));

        if (booksWithChapters.length > 0) {
          const firstChapters = await this.bookChapterRepository
            .createQueryBuilder('chapter')
            .select([
              'chapter.id AS id',
              'chapter.chapter AS chapter',
              'chapter.book_id AS bookId',
            ])
            .where('chapter.book_id IN (:...bookIds)', {
              bookIds: booksWithChapters.map((b) => b.id),
            })
            .orderBy('chapter.book_id')
            .addOrderBy('chapter.chapter', 'ASC')
            .distinctOn(['chapter.book_id'])
            .getRawMany();

          firstChapters.forEach((chapter) => {
            readingHistoriesMap.set(Number(chapter.bookid), {
              lastReadChapterId: Number(chapter.id),
              lastReadChapterNumber: Number(chapter.chapter),
              totalReadChapters: 0,
            });
          });
        }

        books.forEach((book) => {
          if (!readingHistoriesMap.has(book.id)) {
            readingHistoriesMap.set(book.id, {
              lastReadChapterId: 0,
              lastReadChapterNumber: 0,
              totalReadChapters: 0,
            });
          }
        });
      } else {
        const subQuery = this.bookReadingHistoryRepository
          .createQueryBuilder('sub_history')
          .select([
            'MAX(sub_history.created_at) AS max_created_at',
            'sub_history.user_id AS user_id',
            'sub_history.book_id AS book_id',
          ])
          .where('sub_history.user_id = :userId', { userId })
          .andWhere('sub_history.book_id IN (:...bookIds)', { bookIds })
          .groupBy('sub_history.user_id, sub_history.book_id');

        const rawHistories = await this.bookReadingHistoryRepository
          .createQueryBuilder('history')
          .select([
            'history.chapter_id AS lastReadChapterId',
            'history.book_id AS bookId',
            'history.created_at AS createdAt',
          ])
          .innerJoin(
            `(${subQuery.getQuery()})`,
            'latest',
            'history.user_id = latest.user_id AND history.book_id = latest.book_id AND history.created_at = latest.max_created_at',
          )
          .setParameters(subQuery.getParameters())
          .getRawMany();

        const totalChaptersRead = await this.bookReadingHistoryRepository
          .createQueryBuilder('history')
          .select([
            'history.book_id AS bookid',
            'COUNT(DISTINCT history.chapter_id) AS totalreadchapters',
          ])
          .where('history.user_id = :userId', { userId })
          .andWhere('history.book_id IN (:...bookIds)', { bookIds })
          .groupBy('history.book_id')
          .getRawMany();

        const totalChaptersMap = new Map<number, number>();
        totalChaptersRead.forEach((item) => {
          totalChaptersMap.set(
            Number(item.bookid),
            Number(item.totalreadchapters),
          );
        });

        const chapterMap = new Map<number, number>();
        if (rawHistories.length > 0) {
          const chapterIds = rawHistories.map((h) =>
            Number(h.lastreadchapterid),
          );
          const chapters = await this.bookChapterRepository.find({
            where: { id: In(chapterIds) },
          });
          chapters.forEach((ch) => {
            chapterMap.set(ch.id, ch.chapter);
          });
        }

        rawHistories.forEach((history) => {
          const bookId = Number(history.bookid);
          readingHistoriesMap.set(bookId, {
            lastReadChapterId: Number(history.lastreadchapterid),
            lastReadChapterNumber:
              chapterMap.get(Number(history.lastreadchapterid)) || 0,
            totalReadChapters: totalChaptersMap.get(bookId) || 0,
          });
        });

        books.forEach((book) => {
          if (!readingHistoriesMap.has(book.id)) {
            const chapters = chaptersMap.get(book.id) || [];
            const firstChapter = chapters.sort(
              (a, b) => a.chapter - b.chapter,
            )[0];
            if (firstChapter) {
              readingHistoriesMap.set(book.id, {
                lastReadChapterId: firstChapter.id,
                lastReadChapterNumber: firstChapter.chapter,
                totalReadChapters: 0,
              });
            } else {
              readingHistoriesMap.set(book.id, {
                lastReadChapterId: 0,
                lastReadChapterNumber: 0,
                totalReadChapters: 0,
              });
            }
          }
        });
      }

      const booksWithDetails = books.map((book: any) => {
        const chapters = chaptersMap.get(book.id) || [];
        const reviews = reviewsMap.get(book.id) || [];
        const categories = categoriesMap.get(book.id) || [];
        const readingHistory = readingHistoriesMap.get(book.id);

        const totalChapters = chapters.length;

        const totalPrice = chapters.reduce(
          (sum, chapter) => sum + Number(chapter.price || 0),
          0,
        );

        const totalRating = reviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0,
        );
        const rating =
          reviews.length > 0 ? +(totalRating / reviews.length).toFixed(2) : 0;

        return {
          id: book.id,
          title: book.title,
          description: book.description,
          cover: book.cover,
          views: book.views,
          rating,
          totalChapters,
          totalPrice,
          followsCount: book.follows_count,
          isFollowed: followedBookIds.has(book.id),
          author: {
            id: book.author_id,
            name: book.author_name || null,
            avatar: book.author_avatar || null,
          },
          bookType: {
            id: book.book_type_id,
            name: book.book_type_name || null,
          },
          accessStatus: {
            id: book.access_status_id,
            name: book.access_status_name || null,
            description: book.access_status_description || null,
          },
          progressStatus: {
            id: book.progress_status_id,
            name: book.progress_status_name || null,
            description: book.progress_status_description || null,
          },
          categories: categories || [],
          createdAt: book.created_at,
          updatedAt: book.updated_at,
          readingHistory: {
            lastReadChapterId: readingHistory?.lastReadChapterId || 0,
            lastReadChapterNumber: readingHistory?.lastReadChapterNumber || 0,
            totalReadChapters: readingHistory?.totalReadChapters || 0,
          },
          moderated: book.moderated || null,
          ageRating: book.age_rating || null,
        };
      });

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: booksWithDetails,
      };
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getBooks');
      throw error;
    }
  }

  async clearAllChapters(bookId: number) {
    try {
      const book = await this.bookRepository.findOne({ where: { id: bookId } });
      if (!book) {
        throw new NotFoundException('Book Not Found');
      }

      await this.bookChapterRepository.delete({ book: { id: bookId } });

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.clearAllChapters');
      throw error;
    }
  }

  async createModerationResult(
    createDto
  ): Promise<ModerationResultResponseDto> {
    try {
      const book = await this.bookRepository.findOne({
        where: { id: createDto.bookId },
      });

      if (!book) {
        throw new NotFoundException(`Book with ID ${createDto.bookId} not found`);
      }

      const newModerationResult = this.moderationResultRepository.create({
        book,
        title: createDto.title,
        description: createDto.description,
        coverImage: createDto.coverImage,
        chapters: createDto.chapters,
        model: createDto.model,
      });

      const savedResult = await this.moderationResultRepository.save(newModerationResult);
      
      // Append new model to existing book.moderated value or set new value
      let updatedModeratedValue = createDto.model;
      if (book.moderated) {
        // Check if the model is already in the moderated value
        if (!book.moderated.includes(createDto.model)) {
          updatedModeratedValue = `${book.moderated}, ${createDto.model}`;
        } else {
          updatedModeratedValue = book.moderated;
        }
      }
      
      // Update the book's moderated field
      await this.bookRepository.update(createDto.bookId, { moderated: updatedModeratedValue });

      const resultWithBook = await this.moderationResultRepository.findOne({
        where: { id: savedResult.id },
        relations: ['book'],
      });

      return plainToInstance(ModerationResultResponseDto, resultWithBook, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.createModerationResult');
      throw error;
    }
  }

  async getModerationResultsByBook(
    bookId: number,
    model?: string,
  ): Promise<ModerationResultResponseDto[]> {
    try {
      // Build the where condition based on whether model is provided
      const whereCondition: any = { book: { id: bookId } };
      if (model) {
        whereCondition.model = model;
      }

      const results = await this.moderationResultRepository.find({
        where: whereCondition,
        relations: ['book'],
        order: { createdAt: 'DESC' },
      });

      return plainToInstance(ModerationResultResponseDto, results, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.getModerationResultsByBook');
      throw error;
    }
  }

  async updateModerationResult(
    updateDto: UpdateModerationResultDto,
  ): Promise<ModerationResultResponseDto> {
    try {
      // Find the moderation result by bookId and model
      const moderationResult = await this.moderationResultRepository.findOne({
        where: { 
          book: { id: updateDto.bookId },
          model: updateDto.model
        },
        relations: ['book'],
      });

      if (!moderationResult) {
        throw new NotFoundException(`Moderation result for book ID ${updateDto.bookId} with model ${updateDto.model} not found`);
      }
      
      // Update only the provided fields
      if (updateDto.title !== undefined) {
        moderationResult.title = updateDto.title;
      }
      if (updateDto.description !== undefined) {
        moderationResult.description = updateDto.description;
      }
      if (updateDto.coverImage !== undefined) {
        moderationResult.coverImage = updateDto.coverImage;
      }
      if (updateDto.chapters !== undefined) {
        moderationResult.chapters = updateDto.chapters;
      }

      const updatedResult = await this.moderationResultRepository.save(moderationResult);

      return plainToInstance(ModerationResultResponseDto, updatedResult, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.updateModerationResult');
      throw error;
    }
  }

  // Helper method to calculate date range based on period (same as activities service)
  private getDateRangeFromPeriod(period: TimePeriod, startDate?: string, endDate?: string): { startDate: Date, endDate: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    
    // Set end to end of current day
    end.setHours(23, 59, 59, 999);
    
    switch (period) {
      case TimePeriod.TODAY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.THIS_WEEK:
        start = new Date(now);
        // Get the first day of the current week (Sunday = 0)
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek;
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.THIS_MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.LAST_MONTH:
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
        
      case TimePeriod.LAST_3_MONTHS:
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.LAST_6_MONTHS:
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.THIS_YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.CUSTOM:
        if (!startDate || !endDate) {
          throw new BadRequestException('Start date and end date are required for custom period');
        }
        
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        break;
        
      default:
        throw new BadRequestException('Invalid time period');
    }
    
    return { startDate: start, endDate: end };
  }

  // Helper method to generate time intervals based on period
  private generateTimeIntervals(period: TimePeriod, startDate: Date, endDate: Date): Date[] {
    const intervals: Date[] = [];
    const current = new Date(startDate);
    
    switch (period) {
      case TimePeriod.TODAY:
        // Generate 24 hour intervals (every 2 hours for readability)
        for (let hour = 0; hour < 24; hour += 2) {
          const intervalStart = new Date(current);
          intervalStart.setHours(hour, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.THIS_WEEK:
        // Generate 7 daily intervals
        for (let day = 0; day < 7; day++) {
          const intervalStart = new Date(current);
          intervalStart.setDate(current.getDate() + day);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.THIS_MONTH:
      case TimePeriod.LAST_MONTH:
        // Generate daily intervals for the month
        while (current <= endDate) {
          const intervalStart = new Date(current);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
          current.setDate(current.getDate() + 1);
        }
        break;
        
      case TimePeriod.LAST_3_MONTHS:
        // Generate monthly intervals for 3 months
        for (let month = 0; month < 3; month++) {
          const intervalStart = new Date(startDate);
          intervalStart.setMonth(startDate.getMonth() + month);
          intervalStart.setDate(1);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.LAST_6_MONTHS:
        // Generate monthly intervals for 6 months
        for (let month = 0; month < 6; month++) {
          const intervalStart = new Date(startDate);
          intervalStart.setMonth(startDate.getMonth() + month);
          intervalStart.setDate(1);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.THIS_YEAR:
        // Generate monthly intervals for 12 months
        for (let month = 0; month < 12; month++) {
          const intervalStart = new Date(startDate);
          intervalStart.setMonth(startDate.getMonth() + month);
          intervalStart.setDate(1);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.CUSTOM:
        // Calculate the difference in days
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30) {
          // Generate daily intervals for periods <= 30 days
          while (current <= endDate) {
            const intervalStart = new Date(current);
            intervalStart.setHours(0, 0, 0, 0);
            intervals.push(intervalStart);
            current.setDate(current.getDate() + 1);
          }
        } else {
          // Generate monthly intervals for periods > 30 days
          const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          
          const currentMonth = new Date(startMonth);
          while (currentMonth <= endMonth) {
            intervals.push(new Date(currentMonth));
            currentMonth.setMonth(currentMonth.getMonth() + 1);
          }
        }
        break;
    }
    
    return intervals;
  }

  // Get book statistics with chart data and overview
  async getBookStatisticsWithChart(
    period: TimePeriod,
    startDate?: string,
    endDate?: string
  ): Promise<{
    chart: Array<{
      period: string;
      totalBooks: number;
      totalChapters: number;
      blockedBooks: number;
      totalViews: number;
    }>;
    overview: {
      totalBooks: number;
      totalChapters: number;
      blockedBooks: number;
      totalViews: number;
      statusBreakdown: {
        published: number;
        draft: number;
        pendingReview: number;
        rejected: number;
      };
      categoryBreakdown: Array<{
        categoryId: number;
        categoryName: string;
        count: number;
      }>;
      ageRatingBreakdown: Array<{
        ageRating: number;
        count: number;
      }>;
      bookTypeBreakdown: Array<{
        typeId: number;
        typeName: string;
        count: number;
      }>;
    };
  }> {
    const { startDate: start, endDate: end } = this.getDateRangeFromPeriod(period, startDate, endDate);
    
    // Generate time intervals based on period
    const intervals = this.generateTimeIntervals(period, start, end);
    
    // Calculate the difference in days for custom periods
    let isCustomDaily = false;
    if (period === TimePeriod.CUSTOM) {
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isCustomDaily = diffDays <= 30;
    }
    
    // Generate chart data for each interval
    const chartData = await Promise.all(intervals.map(async (intervalStart) => {
      let intervalEnd: Date;
      
      switch (period) {
        case TimePeriod.TODAY:
          intervalEnd = new Date(intervalStart);
          intervalEnd.setHours(intervalStart.getHours() + 2, 0, 0, 0);
          break;
          
        case TimePeriod.THIS_WEEK:
        case TimePeriod.THIS_MONTH:
        case TimePeriod.LAST_MONTH:
          intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalStart.getDate() + 1);
          intervalEnd.setMilliseconds(-1);
          break;
          
        case TimePeriod.LAST_3_MONTHS:
        case TimePeriod.LAST_6_MONTHS:
        case TimePeriod.THIS_YEAR:
          intervalEnd = new Date(intervalStart);
          intervalEnd.setMonth(intervalStart.getMonth() + 1);
          intervalEnd.setMilliseconds(-1);
          break;
          
        case TimePeriod.CUSTOM:
          if (isCustomDaily) {
            // Daily intervals
            intervalEnd = new Date(intervalStart);
            intervalEnd.setDate(intervalStart.getDate() + 1);
            intervalEnd.setMilliseconds(-1);
          } else {
            // Monthly intervals
            intervalEnd = new Date(intervalStart);
            intervalEnd.setMonth(intervalStart.getMonth() + 1);
            intervalEnd.setMilliseconds(-1);
          }
          break;
          
        default:
          intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalStart.getDate() + 1);
          intervalEnd.setMilliseconds(-1);
      }
      
      // Get books created in this interval
      const intervalBooks = await this.bookRepository.count({
        where: {
          createdAt: Between(intervalStart, intervalEnd)
        }
      });
      
      // Get chapters created in this interval
      const intervalChapters = await this.bookChapterRepository.count({
        where: {
          createdAt: Between(intervalStart, intervalEnd)
        }
      });
      
      // Get blocked books in this interval (assuming access status id 3 is blocked)
      const blockedBooks = await this.bookRepository.count({
        where: {
          createdAt: Between(intervalStart, intervalEnd),
          accessStatus: { id: 3 } // Blocked status
        },
        relations: ['accessStatus']
      });

      // Get total views for books created in this interval
      const intervalViewsResult = await this.bookRepository
        .createQueryBuilder('book')
        .select('SUM(book.views)', 'totalViews')
        .where('book.created_at BETWEEN :start AND :end', { 
          start: intervalStart, 
          end: intervalEnd 
        })
        .getRawOne();
      
      const intervalViews = intervalViewsResult?.totalViews ? parseInt(intervalViewsResult.totalViews) : 0;
      
      // Format period label
      let periodLabel: string;
      switch (period) {
        case TimePeriod.TODAY:
          periodLabel = `${intervalStart.getHours()}h`;
          break;
        case TimePeriod.THIS_WEEK:
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          periodLabel = dayNames[intervalStart.getDay()];
          break;
        case TimePeriod.THIS_MONTH:
        case TimePeriod.LAST_MONTH:
          periodLabel = intervalStart.getDate().toString();
          break;
        case TimePeriod.LAST_3_MONTHS:
        case TimePeriod.LAST_6_MONTHS:
        case TimePeriod.THIS_YEAR:
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          periodLabel = monthNames[intervalStart.getMonth()];
          break;
        case TimePeriod.CUSTOM:
          if (isCustomDaily) {
            // Show day number for daily intervals
            periodLabel = intervalStart.getDate().toString();
          } else {
            // Show month name for monthly intervals
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            periodLabel = monthNames[intervalStart.getMonth()];
          }
          break;
        default:
          periodLabel = intervalStart.toISOString().split('T')[0];
      }
      
      return {
        period: periodLabel,
        totalBooks: intervalBooks,
        totalChapters: intervalChapters,
        blockedBooks,
        totalViews: intervalViews,
      };
    }));
    
    // Calculate overview statistics for the entire period
    const totalBooks = await this.bookRepository.count({
      where: {
        createdAt: Between(start, end)
      }
    });
    
    const totalChapters = await this.bookChapterRepository.count({
      where: {
        createdAt: Between(start, end)
      }
    });
    
    const blockedBooks = await this.bookRepository.count({
      where: {
        createdAt: Between(start, end),
        accessStatus: { id: 3 } // Blocked status
      },
      relations: ['accessStatus']
    });

    // Calculate total views for books created in the period
    const viewsResult = await this.bookRepository
      .createQueryBuilder('book')
      .select('SUM(book.views)', 'totalViews')
      .where('book.created_at BETWEEN :start AND :end', { start, end })
      .getRawOne();
    
    const totalViews = viewsResult?.totalViews ? parseInt(viewsResult.totalViews) : 0;

    // Get status breakdown for books created in the period
    const publishedBooks = await this.bookRepository.count({
      where: {
        createdAt: Between(start, end),
        accessStatus: { id: 1 } // Published status
      },
      relations: ['accessStatus']
    });

    const draftBooks = await this.bookRepository.count({
      where: {
        createdAt: Between(start, end),
        accessStatus: { id: 2 } // Draft status
      },
      relations: ['accessStatus']
    });

    const pendingReviewBooks = await this.bookRepository.count({
      where: {
        createdAt: Between(start, end),
        accessStatus: { id: 4 } // Pending review status
      },
      relations: ['accessStatus']
    });

    const rejectedBooks = await this.bookRepository.count({
      where: {
        createdAt: Between(start, end),
        accessStatus: { id: 5 } // Rejected status (assuming id 5 is rejected)
      },
      relations: ['accessStatus']
    });

    // Get category breakdown for books created in the period
    const categoryBreakdown = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoin('book.bookCategoryRelations', 'relation')
      .leftJoin('relation.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(book.id)', 'count')
      .where('book.created_at BETWEEN :start AND :end', { start, end })
      .andWhere('category.id IS NOT NULL')
      .groupBy('category.id, category.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Get age rating breakdown for books created in the period
    const ageRatingBreakdown = await this.bookRepository
      .createQueryBuilder('book')
      .select('book.age_rating', 'ageRating')
      .addSelect('COUNT(book.id)', 'count')
      .where('book.created_at BETWEEN :start AND :end', { start, end })
      .groupBy('book.age_rating')
      .orderBy('book.age_rating', 'ASC')
      .getRawMany();

    // Get book type breakdown for books created in the period
    const bookTypeBreakdown = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoin('book.bookType', 'type')
      .select('type.id', 'typeId')
      .addSelect('type.name', 'typeName')
      .addSelect('COUNT(book.id)', 'count')
      .where('book.created_at BETWEEN :start AND :end', { start, end })
      .andWhere('type.id IS NOT NULL')
      .groupBy('type.id, type.name')
      .orderBy('count', 'DESC')
      .getRawMany();
    
    return {
      chart: chartData,
      overview: {
        totalBooks,
        totalChapters,
        blockedBooks,
        totalViews,
        statusBreakdown: {
          published: publishedBooks,
          draft: draftBooks,
          pendingReview: pendingReviewBooks,
          rejected: rejectedBooks,
        },
        categoryBreakdown: categoryBreakdown.map(item => ({
          categoryId: parseInt(item.categoryId),
          categoryName: item.categoryName,
          count: parseInt(item.count),
        })),
        ageRatingBreakdown: ageRatingBreakdown.map(item => ({
          ageRating: parseInt(item.ageRating),
          count: parseInt(item.count),
        })),
        bookTypeBreakdown: bookTypeBreakdown.map(item => ({
          typeId: parseInt(item.typeId),
          typeName: item.typeName,
          count: parseInt(item.count),
        })),
      }
    };
  }

  async rejectBook(
    bookId: number,
    reason: string,
  ): Promise<boolean> {
    try {
      const book = await this.bookRepository.findOne({
        where: { id: bookId },
        relations: ['author', 'accessStatus', 'chapters'],
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      // Check if book has any published chapters
      const publishedChapters = book.chapters.filter(
        chapter => chapter.chapterAccessStatus === ChapterAccessStatus.PUBLISHED
      );

      if (publishedChapters.length === 0) {
        // No published chapters - set book to private and all chapters to draft
        book.accessStatus = { id: 2 } as any;
        
        // Update all chapters to draft status
        for (const chapter of book.chapters) {
          chapter.chapterAccessStatus = ChapterAccessStatus.DRAFT;
          await this.bookChapterRepository.save(chapter);
        }
      } else {
        // Has published chapters - keep book published and change only pending chapters to draft
        book.accessStatus = { id: 1 } as any; // Published status
        
        // Update only pending review chapters to draft
        const pendingChapters = book.chapters.filter(
          chapter => chapter.chapterAccessStatus === ChapterAccessStatus.PENDING_REVIEW
        );
        
        for (const chapter of pendingChapters) {
          chapter.chapterAccessStatus = ChapterAccessStatus.DRAFT;
          await this.bookChapterRepository.save(chapter);
        }
      }

      // Save the book with updated access status
      await this.bookRepository.save(book);

      // Send notification to book author with the rejection reason
      this.notificationGateway.sendBookRejectionNotification(
        book.id,
        book.title,
        book.author.id,
        reason
      );

      // Clear cache
      await this.cacheService.deletePattern('books:*');

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'BookService.rejectBook');
      throw error;
    }
  }
}
