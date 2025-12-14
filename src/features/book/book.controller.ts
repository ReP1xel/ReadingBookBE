import {
  Controller,
  Get,
  Param,
  Request,
  Query,
  UseGuards,
  Post,
  Body,
  Put,
  ParseIntPipe,
  Delete,
  Req,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import { BookService } from './book.service';
import {
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  GetBookRequestDto,
  GetBookResponseDto,
} from './dto/get-book-request.dto';
import { GetProgressStatusDto } from './dto/get-book-progess-status.dto';
import { JwtAuthGuard } from '@core/auth/jwt-auth.guard';
import { GetAccessStatusDto } from './dto/get-book-access-status.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateMultipleBookChaptersDto } from './dto/create-book-chapter.dto';
import { UpdateBookChapterDto } from './dto/update-book-chapter.dto';
import {
  CreateBookReviewDto,
  UpdateBookReviewDto,
} from './dto/book-review.dto';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import {
  CreateBookChapterCommentDto,
  UpdateBookChapterCommentDto,
} from './dto/book-chapter-comment.dto';
import { BookFollowDto } from './dto/book-follow.dto';
import { BookReportDto, BookReportResponseDto } from './dto/book-report.dto';
import { PaginationResponseDto } from '@shared/dto/common/pagnination/pagination-response.dto';
import { AdminGuard } from '@core/auth/admin.guard';
import { GetBookTypeDto } from './dto/book-type.dto';
import { CreateBookReadingHistoryDto } from './dto/create-book-reading-history.dto';
import { UpdateBookStatusDto } from './dto/book-status.dto';
import { GetBookChapterDto } from './dto/get-book-chapter.dto';
import { OptionalAuthGuard } from '@core/auth/jwt-auth-optional.guard';
import { GetTrendingBooksDto } from './dto/book-trending.dto';
import { GetRecommendedBooksDto } from './dto/book-recommend.dto';
import { GetRelatedBooksDto } from './dto/book-related.dto';
import { GetListBookDto } from './dto/get-book.dto';
import { GetBookCategoryDetailDto } from './dto/get-book-category.dto';
import { PatchBookDto } from './dto/update-book.dto';
import { PatchBookChapterDto } from './dto/update-book-chapter.dto';
import { ChapterAccessStatus } from './entities/book-chapter.entity';
import { CreateModerationResultDto, GetModerationResultDto, ModerationResultResponseDto, UpdateModerationResultDto } from './dto/moderation-result.dto';
import { TimeRangeDto } from '@features/activities/dto/time-range.dto';
import { RejectBookDto } from './dto/reject-book.dto';

@ApiTags('book')
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách sách' })
  @Get()
  async getAllBooks(
    @Request() req: any,
    @Query() params: GetBookRequestDto,
  ): Promise<GetBookResponseDto> {
    const user = req.user;
    return await this.bookService.getAllBooks(user, params);
  }

  @ApiOperation({ summary: 'Lấy danh mục' })
  @Get('category')
  async getBookCategory(@Query() params: GetBookCategoryDetailDto) {
    return await this.bookService.getBookCategory(params);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy loại sách manga hay novel' })
  @Get('book-type')
  async getBookType(): Promise<GetBookTypeDto[]> {
    return await this.bookService.getBookType();
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy trạng thái tiến độ sách' })
  @Get('progress')
  async getProgressStatus(
    @Request() req: any,
  ): Promise<GetProgressStatusDto[]> {
    const user = req.user;
    return await this.bookService.getProgressStatus(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy trạng thái truy cập sách' })
  @Get('access')
  async getAccessStatus(@Request() req: any): Promise<GetAccessStatusDto[]> {
    const user = req.user;
    return await this.bookService.getAccessStatus(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo sách mới' })
  @Post()
  async create(@Body() dto: CreateBookDto, @Request() req): Promise<number> {
    const author = req.user;
    return await this.bookService.createBook(dto, author);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo chương sách mới' })
  @Post('/chapter/:bookId')
  async createChapters(
    @Param('bookId') bookId: number,
    @Body() dto: CreateMultipleBookChaptersDto,
    @Request() req,
  ): Promise<boolean> {
    const author = req.user;
    if (!author) throw new ForbiddenException('Bạn không có quyền');

    return this.bookService.createChapters(dto, bookId, author);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật chương sách' })
  @Put('/chapter/:chapterId')
  async updateChapter(
    @Param('chapterId') chapterId: number,
    @Body() dto: UpdateBookChapterDto,
    @Request() req,
  ): Promise<boolean> {
    const author = req.user;
    if (!author) throw new ForbiddenException('Bạn không có quyền');

    return this.bookService.updateChapter(chapterId, dto, author);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật một phần chương sách' })
  @Patch('/chapter/:chapterId')
  async patchChapter(
    @Param('chapterId') chapterId: number,
    @Body() dto: PatchBookChapterDto,
    @Request() req,
  ): Promise<boolean> {
    const author = req.user;
    if (!author) throw new ForbiddenException('Bạn không có quyền');

    return this.bookService.patchChapter(chapterId, dto, author);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa chương sách' })
  @Delete('/chapter/:chapterId')
  async deleteChapter(
    @Param('chapterId') chapterId: number,
    @Req() req,
  ): Promise<boolean> {
    const author = req.user;
    if (!author) throw new ForbiddenException('Bạn không có quyền');

    return this.bookService.deleteChapter(chapterId, author);
  }

  @UseGuards(OptionalAuthGuard)
  @Get('/chapter/:chapterId')
  @ApiOperation({ summary: 'Lấy thông tin chương theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chương',
    type: GetBookChapterDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chương' })
  async getChapter(
    @Req() req: any,
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ): Promise<GetBookChapterDto> {
    const user = req.user;
    return await this.bookService.getChapter(user, chapterId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo review' })
  @Post('book-review/:bookId')
  async createReview(
    @Param('bookId') bookId: number,
    @Req() req,
    @Body() dto: CreateBookReviewDto,
  ) {
    const author = req.user;
    return this.bookService.createReview(bookId, author, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật review' })
  @Put('book-review/:reviewId')
  async updateReview(
    @Param('reviewId') reviewId: number,
    @Req() req,
    @Body() dto: UpdateBookReviewDto,
  ) {
    const author = req.user;
    return this.bookService.updateReview(reviewId, author, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa review' })
  @Delete('book-review/:reviewId')
  async deleteReview(@Param('reviewId') reviewId: number, @Req() req) {
    const author = req.user;
    return this.bookService.deleteReview(reviewId, author);
  }

  @ApiOperation({ summary: 'Lấy danh sách review' })
  @Get('book-review')
  async getReviews(
    @Query('bookId') bookId: number,
    @Query() pagination: PaginationRequestDto,
  ) {
    return this.bookService.getReviews(bookId, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo chapter comment' })
  @Post('chapter-comment/:chapterId')
  async createComment(
    @Param('chapterId') chapterId: number,
    @Req() req,
    @Body() dto: CreateBookChapterCommentDto,
  ) {
    const auth = req.user;
    return this.bookService.createComment(chapterId, auth, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cap nhật chapter comment' })
  @Put('chapter-comment/:commentId')
  async updateComment(
    @Req() req,
    @Param('commentId') commentId: number,
    @Body() dto: UpdateBookChapterCommentDto,
  ) {
    const auth = req.user;
    return this.bookService.updateComment(commentId, auth, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa chapter comment' })
  @Delete('/chapter-comment/:commentId')
  async deleteComment(@Req() req, @Param('commentId') commentId: number) {
    const auth = req.user;
    return this.bookService.deleteComment(commentId, auth);
  }

  @ApiOperation({ summary: 'Lấy danh sách chapter comment' })
  @ApiQuery({
    name: 'commentId',
    type: Number,
    required: false,
    description:
      'ID của bình luận cha để lấy các bình luận con. Nếu không truyền, trả về bình luận cha',
  })
  @Get('chapter-comment')
  async getComments(
    @Query() pagination: PaginationRequestDto,
    @Query('chapterId') chapterId: number,
    @Query('commentId') commentId?,
  ) {
    return this.bookService.getComments(pagination, chapterId, commentId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Theo dõi sách' })
  @Post('follow')
  async followBook(@Req() req, @Body() dto: BookFollowDto) {
    return this.bookService.followBook(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Hủy theo dõi sách' })
  @Delete('follow')
  async unfollowBook(@Req() req, @Body() dto: BookFollowDto) {
    return this.bookService.unfollowBook(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách theo dõi sách' })
  @Get('follow')
  async getFollow(@Req() req, @Query() pagination: PaginationRequestDto) {
    const userId = req.user.id;
    return this.bookService.getFollow(userId, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Người dùng báo cáo sách' })
  @Post('report')
  async createReport(
    @Request() req,
    @Body() body: BookReportDto,
  ): Promise<BookReportResponseDto> {
    return this.bookService.createReport(req.user, body);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin lấy danh sách báo cáo' })
  @Get('report')
  async getReports(
    @Query() pagination: PaginationRequestDto,
  ): Promise<PaginationResponseDto<BookReportResponseDto>> {
    return this.bookService.getReports(pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo mới lịch sử đọc sách' })
  @Post('reading-history')
  async createReadingHistory(
    @Req() req,
    @Body() dto: CreateBookReadingHistoryDto,
  ): Promise<boolean> {
    const author = req.user;

    return this.bookService.createReadingHistory(author, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách lịch sử đọc sách của user (phân trang)',
  })
  @Get('reading-history')
  async getReadingHistorySummary(
    @Req() req,
    @Query() pagination: PaginationRequestDto,
  ) {
    const author = req.user;
    return this.bookService.getReadingHistorySummary(author, pagination);
  }

  // @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy thống kê lịch sử đọc sách (top 6 cuốn mỗi khoảng thời gian)',
  })
  @ApiQuery({
    name: 'timeRange',
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Khoảng thời gian thống kê',
    required: false,
  })
  @Get('reading-history/chart')
  async getReadingHistoryChart(
    @Query('timeRange') timeRange: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<any[]> {
    return await this.bookService.getReadingHistoryChart(timeRange);
  }

  @UseGuards(OptionalAuthGuard)
  @Get('trending')
  @ApiOperation({ summary: 'Lấy danh sách sách đọc nhiều nhất trong 30 ngày' })
  async getTrendingBooks(
    @Req() req,
    @Query() params: GetTrendingBooksDto,
  ): Promise<PaginationResponseDto<GetListBookDto>> {
    const userId = (req as any)?.user?.id ?? null;
    return this.bookService.getTrendingBooks(userId, params);
  }

  @UseGuards(OptionalAuthGuard)
  @Get('recommend')
  @ApiOperation({ summary: 'Lấy danh sách sách khuyến nghị cho người dùng' })
  async getRecommendedBooks(
    @Req() req,
    @Query() params: GetRecommendedBooksDto,
  ): Promise<GetListBookDto[]> {
    const userId = (req as any)?.user?.id ?? null;
    return this.bookService.getRecommendedBooks(userId, params);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get book creation statistics' })
  @Get('statistics')
  async getBookStatistics(@Query() query: TimeRangeDto) {
    return this.bookService.getBookStatisticsWithChart(
      query.period,
      query.startDate,
      query.endDate
    );
  }

  @Get('migrate-embedded-column-book')
  @ApiOperation({ summary: 'Migrate embedded column book' })
  async migrateAddEmbeddingColumn(): Promise<Boolean> {
    return this.bookService.migrateAddEmbeddingColumn();
  }

  @Get('migrate-embedded-book/:id')
  @ApiOperation({ summary: 'Migrate embedded book' })
  @ApiProperty({ example: 1 })
  async migrateBookEmbedding(@Param('id') id: number): Promise<Boolean> {
    return this.bookService.migrateBookEmbedding(id);
  }

  @UseGuards(OptionalAuthGuard)
  @Get('related/:bookId')
  @ApiOperation({
    summary:
      'Lấy danh sách sách liên quan tới danh mục + tác giả, sau đó tới khác danh mục cùng tác giả',
  })
  async getRelatedBooks(
    @Param('bookId') bookId: number,
    @Req() req,
    @Query() params: GetRelatedBooksDto,
  ): Promise<PaginationResponseDto<GetListBookDto>> {
    const userId = (req as any)?.user?.id ?? null;
    return this.bookService.getRelatedBooks(bookId, userId, params);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':id/chapters')
  @ApiOperation({ summary: 'Lấy danh sách chương của sách (theo ID)' })
  async getBookChapters(
    @Req() req: any,
    @Param('id') id: string,
    @Query() params: { chapterAccessStatus?: string },
  ) {
    const user = req.user ?? null;
    const bookId = parseInt(id, 10);
    return this.bookService.getBookChapters(user, bookId, params.chapterAccessStatus);
  }

  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết sách' })
  @Get(':id')
  async getDetailBook(
    @Req() req: any,
    @Param('id') bookId: number,
  ): Promise<any> {
    const user = req.user;
    return await this.bookService.getBookDetail(user, bookId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật sách' })
  @Put(':id')
  async updateBook(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookDto,
    @Request() req,
  ): Promise<boolean> {
    const author = req.user;
    return await this.bookService.updateBook(id, dto, author);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật một phần sách' })
  @Patch(':id')
  async patchBook(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchBookDto,
    @Request() req,
  ): Promise<boolean> {
    const author = req.user;
    return await this.bookService.patchBook(id, dto, author);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa sách' })
  @Delete(':id')
  async deleteBook(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<boolean> {
    const author = req.user;
    return await this.bookService.deleteBook(id, author);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Xóa hết tất cả chương trong sách',
  })
  @Delete(':bookId/chapters')
  async clearAllChapters(@Param('bookId') bookId: number) {
    return this.bookService.clearAllChapters(bookId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật trạng thái của sách' })
  @Patch(':id/status')
  async updateBookStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateBookStatusDto: UpdateBookStatusDto,
  ): Promise<Boolean> {
    const user = req.user;

    return await this.bookService.updateBookStatus(
      id,
      user,
      updateBookStatusDto.accessStatusId,
      updateBookStatusDto.progressStatusId,
    );
  }

  @Post(':id/moderation')
  @ApiOperation({
    summary: 'Create a moderation result',
    description: 'Creates a new moderation result for a book'
  })
  @ApiResponse({
    status: 201,
    description: 'The moderation result has been successfully created',
    type: ModerationResultResponseDto
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createModerationResult(
    @Body() createModerationResultDto: CreateModerationResultDto
  ): Promise<ModerationResultResponseDto> {
    return this.bookService.createModerationResult(createModerationResultDto);
  }

  @Get(':id/moderation')
  @ApiOperation({
    summary: 'Get moderation results for a book',
    description: 'Retrieves moderation results for a specific book, filtered by model if provided'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the moderation results',
    type: [ModerationResultResponseDto]
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getModerationResultsByBook(
    @Param('id') id: number,
    @Query('model') model?: string
  ): Promise<ModerationResultResponseDto[]> {
    return this.bookService.getModerationResultsByBook(id, model);
  }

  @Patch(':id/moderation')
  @ApiOperation({
    summary: 'Update a moderation result',
    description: 'Updates a specific moderation result by book ID and model'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated moderation result',
    type: ModerationResultResponseDto
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateModerationResult(
    @Body() updateModerationResultDto: UpdateModerationResultDto
  ): Promise<ModerationResultResponseDto> {
    return this.bookService.updateModerationResult(updateModerationResultDto);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject a book',
    description: 'Rejects a specific book'
  })
  @ApiResponse({
    status: 200,
    description: 'The book has been successfully rejected',
    type: Boolean
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async rejectBook(
    @Param('id') id: number,
    @Body() rejectBookDto: RejectBookDto
  ): Promise<boolean> {
    return this.bookService.rejectBook(id, rejectBookDto.reason);
  }
}
