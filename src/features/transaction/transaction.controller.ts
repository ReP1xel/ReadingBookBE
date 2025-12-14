import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/jwt-auth.guard';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import { CreateChapterPurchaseDto } from './dto/book-puchase.dto';
import { AdminGuard } from '@core/auth/admin.guard';
import { GetAdminTransactionsDto } from './dto/admin-transaction.dto';
import { UserResponseDto } from '@features/user/dto/get-user-response.dto';
import {
  GetAdminChapterPurchasesDto,
  GetUserChapterPurchasesDto,
} from './dto/admin-book-purchase.dto';
import { TimeRangeDto } from '@features/activities/dto/time-range.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('/momo')
  @ApiOperation({
    summary: 'Tạo đơn hàng MoMo',
    description: 'Gọi API MoMo để tạo đơn hàng và nhận URL thanh toán.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          example: 10000,
          description: 'Số tiền nạp vào (VND)',
        },
      },
      required: ['amount'],
    },
  })
  @UseGuards(JwtAuthGuard)
  async createOrderMomo(@Req() req, @Body() body: { amount: number }) {
    const user = req.user;
    return await this.transactionService.createOrderMomo(user, body.amount);
  }

  @Post('/momo/webhook')
  @ApiOperation({
    summary: 'Webhook MoMo',
    description: 'MoMo gọi vào đây sau khi giao dịch hoàn tất.',
  })
  async momoWebhook(@Req() req) {
    const payload = req.body;
    return await this.transactionService.handleMoMoWebhook(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/check-status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái giao dịch MoMo' })
  @ApiQuery({
    name: 'orderId',
    required: true,
    type: String,
    description: 'Mã đơn hàng',
  })
  @ApiQuery({
    name: 'requestId',
    required: true,
    type: String,
    description: 'Mã yêu cầu',
  })
  async checkTransactionStatus(
    @Query() { orderId, requestId }: { orderId: string; requestId: string },
  ) {
    try {
      const response = await this.transactionService.checkTransactionStatus(
        orderId,
        requestId,
      );
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lịch sử giao dịch (nạp tiền vào hệ thống)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    description: 'Trạng thái giao dịch',
  })
  @ApiQuery({
    name: 'id',
    required: false,
    type: String,
    description: 'ID giao dịch',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Từ ngày (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Đến ngày (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng bản ghi mỗi trang',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang hiện tại',
  })
  @Get('/momo')
  async getTransaction(
    @Req() req,
    @Query() pagination: PaginationRequestDto,
    @Query('id') id?: string,
    @Query('status') status?: 'PENDING' | 'SUCCESS' | 'FAILED',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = req.user as UserResponseDto;
    const filter = { id, status, startDate, endDate };
    return this.transactionService.getTransaction(user, pagination, filter);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mua chapter bằng điểm' })
  @Post('/chapter')
  async purchaseChapter(@Req() req, @Body() dto: CreateChapterPurchaseDto) {
    const user = req.user;
    return this.transactionService.purchaseChapter(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lịch sử giao dịch chapter',
  })
  @Get('/chapter')
  async getPurchaseChapter(
    @Req() req,
    @Query() pagination: PaginationRequestDto,
    @Query() filter: GetUserChapterPurchasesDto,
  ) {
    const user = req.user;
    return this.transactionService.getPurchaseChapter(user, pagination, filter);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/admin/momo')
  @ApiOperation({ summary: 'Lịch sử giao dịch (nạp tiền) cho admin' })
  async getAdminTransactions(@Query() query: GetAdminTransactionsDto) {
    const { id, email, userId, startDate, endDate, page, limit } = query;

    return this.transactionService.getAdminTransactions(
      { page, limit },
      { id, email, userId, startDate, endDate },
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/admin/chapter')
  @ApiOperation({ summary: 'Lịch sử giao dịch chapter của admin' })
  async getAdminChapterPurchases(@Query() query: GetAdminChapterPurchasesDto) {
    const {
      id,
      email,
      userId,
      startDate,
      endDate,
      page,
      limit,
      bookId,
      chapterId,
    } = query;

    return this.transactionService.getAdminChapterPurchases({
      id,
      email,
      userId,
      startDate,
      endDate,
      page,
      limit,
      bookId,
      chapterId,
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get transaction statistics' })
  @Get('statistics')
  async getTransactionStatistics(@Query() query: TimeRangeDto) {
    return this.transactionService.getTransactionStatisticsWithChart(
      query.period,
      query.startDate,
      query.endDate
    );
  }
}
