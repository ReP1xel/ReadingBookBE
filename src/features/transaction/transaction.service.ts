import { parseISO, startOfDay, endOfDay, isAfter } from 'date-fns';
import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import axios from 'axios';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { LoggerService } from '@core/logger/logger.service';
import { MomoConfig } from './helper/momo.helper';
import { ChapterPurchase } from './entities/chapter-purchase.entity';
import { DatabaseService } from '@core/database/database.service';
import { UserResponseDto } from '@features/user/dto/get-user-response.dto';
import { User } from '@features/user/entities/user.entity';
import { TransactionResponseDto } from './dto/transaction.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationResponseDto } from '@shared/dto/common/pagnination/pagination-response.dto';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import {
  ChapterPurchaseResponseDto,
  CreateChapterPurchaseDto,
} from './dto/book-puchase.dto';
import { BookChapter } from '@features/book/entities/book-chapter.entity';
import { GetAdminChapterPurchasesDto } from './dto/admin-book-purchase.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { log } from 'console';
import { NotificationGateway } from '@core/gateway/notification.gateway';
import { NotificationType } from '@features/notification/entities/notification.entity';
import { TimePeriod } from '@features/activities/dto/time-range.dto';
@Injectable()
export class TransactionService {
  private readonly momoAccessKey = MomoConfig.accessKey;
  private readonly momoExtraData = MomoConfig.extraData;
  private readonly momoIpnUrl = MomoConfig.ipnUrl;
  private readonly momoPartnerCode = MomoConfig.partnerCode;
  private readonly momoRedirectUrl = MomoConfig.redirectUrl;
  private readonly momoRequestType = MomoConfig.requestType;
  private readonly momoSecretkey = MomoConfig.secretkey;
  private readonly momoLang = MomoConfig.lang;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ChapterPurchase)
    private readonly chapterPurchaseRepository: Repository<ChapterPurchase>,
    @InjectRepository(BookChapter)
    private readonly bookChapterRepository: Repository<BookChapter>,
    private readonly loggerService: LoggerService,
    private readonly dataBaseService: DatabaseService,
    private readonly mailerService: MailerService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createOrderMomo(user: UserResponseDto, amount: number): Promise<any> {
    try {
      const orderCount = await this.transactionRepository.count();
      console.log('Order count:', orderCount);
      const orderId = `BOT${(orderCount + 1).toString().padStart(6, '0')}`;
      const orderInfo = 'Nạp tiền cho giao dịch';
      const requestId = orderId;

      const signature = MomoConfig.getRawSignature(
        this.momoAccessKey,
        amount,
        this.momoExtraData,
        this.momoIpnUrl,
        orderId,
        orderInfo,
        this.momoPartnerCode,
        this.momoRedirectUrl,
        requestId,
        this.momoRequestType,
        this.momoSecretkey,
      );

      const payload = {
        partnerCode: this.momoPartnerCode,
        accessKey: this.momoAccessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl: this.momoRedirectUrl,
        ipnUrl: this.momoIpnUrl,
        extraData: this.momoExtraData,
        requestType: this.momoRequestType,
        signature,
        lang: this.momoLang,
      };

      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/create',
        payload,
      );
      const momoResponse = response.data;

      if (momoResponse.resultCode !== 0) {
        console.log('Momo response:', momoResponse);
        this.loggerService.err(
          momoResponse,
          'TransactionService.createOrderMomo',
        );

        return {
          status: false,
          code: 400,
          data: { momoResponse: { ...momoResponse } },
          msg: 'Fail',
        };
      }

      await this.dataBaseService.create(this.transactionRepository, {
        id: orderId,
        amount,
        tokens: Math.floor(amount / 1000) || 0,
        status: TransactionStatus.PENDING,
        user: { id: user.id },
      });

      return {
        url: momoResponse.payUrl,
        orderId,
        requestId,
        momoResponse: {
          resultCode: momoResponse.resultCode,
          message: momoResponse.message,
        },
      };
    } catch (error) {
      log('Error:', error);
      this.loggerService.err(
        error.message,
        'TransactionService.createOrderMomo',
      );
      throw error;
    }
  }

  async handleMoMoWebhook(payload: any): Promise<any> {
    try {
      const { orderId, resultCode, message } = payload;
      this.loggerService.info(
        `Received MoMo webhook for orderId: ${orderId} with resultCode: ${resultCode}`,
        'TransactionService.handleMoMoWebhook',
      );

      const transaction = await this.transactionRepository.findOne({
        where: { id: orderId },
        relations: ['user'],
      });
      if (!transaction) {
        this.loggerService.err(
          `Transaction not found for orderId: ${orderId}`,
          'TransactionService.handleMoMoWebhook',
        );
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (resultCode === 0) {
        if (transaction.status !== TransactionStatus.SUCCESS) {
          transaction.status = TransactionStatus.SUCCESS;
          await this.transactionRepository.save(transaction);

          let tokens = transaction.tokens;
          let bonusTokens = 0;
          let makeVip = false;
          
          // Apply bonus logic based on amount
          const amount = transaction.amount;
          if (amount === 100) {
            bonusTokens = Math.floor(tokens * 0.1); // 10% bonus
          } else if (amount === 200) {
            bonusTokens = 20; // 20 tokens bonus
          } else if (amount >= 500) {
            makeVip = true; // Set VIP status
          }
          
          const totalTokens = tokens + bonusTokens;

          await this.userRepository
            .createQueryBuilder()
            .update()
            .set({
              tokenBalance: () => `"token_balance" + ${totalTokens}`,
              tokenReceived: () => `"token_received" + ${totalTokens}`,
              tokenPurchased: () => `"token_purchased" + ${tokens}`,
              isVip: makeVip ? true : () => `"is_vip"`,
            })
            .where('id = :id', { id: transaction.user.id })
            .execute();

          await this.notificationGateway.sendDepositSuccessNotification(
            transaction.user.id,
            totalTokens,
            transaction.id,
          );

          let bonusMessage = '';
          if (bonusTokens > 0) {
            bonusMessage = `<p><strong>Thưởng thêm:</strong> ${bonusTokens} điểm</p>`;
          }
          
          let vipMessage = '';
          if (makeVip) {
            vipMessage = `<p><strong>Chúc mừng!</strong> Bạn đã được nâng cấp lên tài khoản VIP.</p>`;
          }

          await this.mailerService.sendMail({
            to: transaction.user.email,
            subject: 'Cảm ơn bạn đã giao dịch với chúng tôi!',
            text: `Xin chào ${transaction.user.name},\n\nCảm ơn bạn đã thực hiện giao dịch thành công!\nMã đơn hàng của bạn là: ${transaction.id}\nSố điểm của bạn đã được cập nhật.\n\nChúc bạn một ngày tốt lành!`,
            html: `
              <h3>Xin chào ${transaction.user.name},</h3>
              <p>Cảm ơn bạn đã thực hiện giao dịch thành công!</p>
              <p><strong>Mã đơn hàng:</strong> ${transaction.id}</p>
              <p><strong>Số điểm:</strong> ${tokens}</p>
              ${bonusMessage}
              ${vipMessage}
              <p>Số điểm của bạn đã được cập nhật thành công. Chúng tôi luôn sẵn sàng phục vụ bạn.</p>
              <p>Chúc bạn một ngày tuyệt vời!</p>
            `,
          });
        }

        return {
          status: true,
          code: 200,
          data: { momoResponse: { resultCode, message } },
          msg: 'Success',
        };
      } else {
        transaction.status = TransactionStatus.FAILED;
        await this.transactionRepository.save(transaction);

        await this.notificationGateway.sendDepositFailedNotification(
          transaction.user.id,
          transaction.tokens,
          transaction.id,
          message,
        );

        await this.mailerService.sendMail({
          to: transaction.user.email,
          subject: 'Giao dịch của bạn không thành công',
          text: `Xin chào ${transaction.user.name},\n\nChúng tôi rất tiếc thông báo rằng giao dịch của bạn không thành công.\nMã đơn hàng của bạn là: ${transaction.id}\nVui lòng kiểm tra lại và thử lại sau.\n\nChúc bạn may mắn!`,
          html: `
            <h3>Xin chào ${transaction.user.name},</h3>
            <p>Chúng tôi rất tiếc phải thông báo rằng giao dịch của bạn không thành công.</p>
            <p><strong>Mã đơn hàng:</strong> ${transaction.id}</p>
            <p>Vui lòng kiểm tra lại và thử lại sau. Nếu bạn cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi.</p>
            <p>Chúc bạn may mắn và hy vọng sẽ phục vụ bạn trong những lần giao dịch sau.</p>
          `,
        });
      }

      return {
        status: true,
        code: 200,
        data: { momoResponse: { resultCode, message } },
        msg: 'Success',
      };
    } catch (error) {
      this.loggerService.err(
        error.message,
        'TransactionService.handleMoMoWebhook',
      );
      throw error;
    }
  }

  async checkTransactionStatus(
    orderId: string,
    requestId: string,
  ): Promise<any> {
    try {
      const signature = MomoConfig.getRawcheckSignature(
        this.momoAccessKey,
        orderId,
        this.momoPartnerCode,
        requestId,
        this.momoSecretkey,
      );

      const payload = {
        partnerCode: this.momoPartnerCode,
        requestId,
        orderId,
        signature,
        lang: this.momoLang,
      };

      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/query',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const momoResponse = response.data;

      if (momoResponse.resultCode === 0) {
        const transaction = await this.transactionRepository.findOne({
          where: { id: orderId },
          relations: ['user'],
        });

        if (!transaction) {
          throw new HttpException(
            'Transaction not found',
            HttpStatus.NOT_FOUND,
          );
        }

        if (transaction.status === TransactionStatus.PENDING) {
          transaction.status = TransactionStatus.SUCCESS;

          await this.transactionRepository.save(transaction);

          let tokens = transaction.tokens;
          let bonusTokens = 0;
          let makeVip = false;
          
          // Apply bonus logic based on amount
          const amount = transaction.amount;
          if (amount >= 100000 && amount < 200000) {
            bonusTokens = 10;
          } else if (amount >= 200000 && amount < 500000) {
            bonusTokens = 20;
          } else if (amount >= 500000) {
            makeVip = true;
          }
          
          const totalTokens = tokens + bonusTokens;

          await this.userRepository
            .createQueryBuilder()
            .update()
            .set({
              tokenBalance: () => `"token_balance" + ${totalTokens}`,
              tokenReceived: () => `"token_received" + ${totalTokens}`,
              tokenPurchased: () => `"token_purchased" + ${tokens}`,
              isVip: makeVip ? true : () => `"is_vip"`,
            })
            .where('id = :id', { id: transaction.user.id })
            .execute();

          let bonusMessage = '';
          if (bonusTokens > 0) {
            bonusMessage = `<p><strong>Thưởng thêm:</strong> ${bonusTokens} điểm</p>`;
          }
          
          let vipMessage = '';
          if (makeVip) {
            vipMessage = `<p><strong>Chúc mừng!</strong> Bạn đã được nâng cấp lên tài khoản VIP.</p>`;
          }

          await this.mailerService.sendMail({
            to: transaction.user.email,
            subject: 'Cảm ơn bạn đã giao dịch với chúng tôi!',
            text: `Xin chào ${transaction.user.name},\n\nCảm ơn bạn đã thực hiện giao dịch thành công!\nMã đơn hàng của bạn là: ${transaction.id}\nSố điểm của bạn đã được cập nhật.\n\nChúc bạn một ngày tốt lành!`,
            html: `
              <h3>Xin chào ${transaction.user.name},</h3>
              <p>Cảm ơn bạn đã thực hiện giao dịch thành công!</p>
              <p><strong>Mã đơn hàng:</strong> ${transaction.id}</p>
              <p><strong>Số điểm:</strong> ${tokens}</p>
              ${bonusMessage}
              ${vipMessage}
              <p>Số điểm của bạn đã được cập nhật thành công. Chúng tôi luôn sẵn sàng phục vụ bạn.</p>
              <p>Chúc bạn một ngày tuyệt vời!</p>
            `,
          });

          return {
            status: true,
            code: 200,
            data: {
              momoResponse: {
                resultCode: momoResponse.resultCode,
                message: momoResponse.message,
              },
              orderId,
              transactionId: transaction.id,
            },
            msg: 'Success',
          };
        }
      } else {
        const transaction = await this.transactionRepository.findOne({
          where: { id: orderId },
          relations: ['user'],
        });

        if (!transaction) {
          throw new HttpException(
            'Transaction not found',
            HttpStatus.NOT_FOUND,
          );
        }

        if (transaction.status === TransactionStatus.PENDING) {
          transaction.status = TransactionStatus.FAILED;
          await this.transactionRepository.save(transaction);

          await this.mailerService.sendMail({
            to: transaction.user.email,
            subject: 'Giao dịch của bạn không thành công',
            text: `Xin chào ${transaction.user.name},\n\nChúng tôi rất tiếc thông báo rằng giao dịch của bạn không thành công.\nMã đơn hàng của bạn là: ${transaction.id}\nVui lòng kiểm tra lại và thử lại sau.\n\nChúc bạn may mắn!`,
            html: `
              <h3>Xin chào ${transaction.user.name},</h3>
              <p>Chúng tôi rất tiếc phải thông báo rằng giao dịch của bạn không thành công.</p>
              <p><strong>Mã đơn hàng:</strong> ${transaction.id}</p>
              <p>Vui lòng kiểm tra lại và thử lại sau. Nếu bạn cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi.</p>
              <p>Chúc bạn may mắn và hy vọng sẽ phục vụ bạn trong những lần giao dịch sau.</p>
            `,
          });
        }
      }

      return {
        status: true,
        code: 200,
        data: {
          momoResponse: {
            resultCode: momoResponse.resultCode,
            message: momoResponse.message,
          },
          orderId,
        },
        msg: 'Success',
      };
    } catch (error) {
      this.loggerService.err(
        error.message,
        'TransactionService.checkTransactionStatus',
      );
      throw error;
    }
  }

  async getTransaction(
    user: UserResponseDto,
    pagination: PaginationRequestDto,
    filter: {
      id?: string;
      startDate?: string;
      endDate?: string;
      status?: 'PENDING' | 'SUCCESS' | 'FAILED';
    },
  ): Promise<PaginationResponseDto<TransactionResponseDto>> {
    try {
      const { limit = 10, page = 1 } = pagination;
      const qb = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.user', 'user');

      if (filter.id) {
        qb.andWhere('transaction.id LIKE :id', { id: `%${filter.id}%` });
      }

      if (filter.status) {
        qb.andWhere('transaction.status = :status', { status: filter.status });
      }

      if (filter.startDate && filter.endDate) {
        const start = startOfDay(parseISO(filter.startDate));
        const end = endOfDay(parseISO(filter.endDate));

        if (isAfter(start, end)) {
          throw new BadRequestException('Start date must be before end date');
        }

        qb.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
          startDate: start,
          endDate: end,
        });
      } else if (filter.startDate) {
        const start = startOfDay(parseISO(filter.startDate));
        qb.andWhere('transaction.createdAt >= :startDate', {
          startDate: start,
        });
      } else if (filter.endDate) {
        const end = endOfDay(parseISO(filter.endDate));
        qb.andWhere('transaction.createdAt <= :endDate', { endDate: end });
      }

      qb.andWhere('transaction.user_id = :userId', { userId: user.id });

      qb.orderBy('transaction.createdAt', 'DESC');
      qb.take(limit);
      qb.skip((page - 1) * limit);

      const [data, totalItems] = await qb.getManyAndCount();

      const dtos = plainToInstance(TransactionResponseDto, data, {
        excludeExtraneousValues: true,
      });

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: dtos,
      };
    } catch (error) {
      throw error;
    }
  }

  async purchaseChapter(
    user: User,
    dto: CreateChapterPurchaseDto,
  ): Promise<ChapterPurchaseResponseDto> {
    try {
      const userInfo = await this.dataBaseService.findOne(this.userRepository, {
        where: { id: user.id },
      });
      if (!userInfo) {
        throw new NotFoundException('User not found');
      }

      const chapter = await this.dataBaseService.findOne(
        this.bookChapterRepository,
        {
          where: { id: dto.chapterId },
        },
      );
      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      const isAlreadyPurchased = await this.dataBaseService.findOne(
        this.chapterPurchaseRepository,
        {
          where: {
            user: { id: userInfo?.id },
            chapter: { id: chapter.id },
          },
        },
      );
      if (isAlreadyPurchased) {
        throw new BadRequestException('Chapter already purchased');
      }

      if (user.tokenBalance < chapter.price) {
        throw new BadRequestException('Not enough tokens. Please top up');
      }

      await this.userRepository.decrement(
        { id: user.id },
        'tokenBalance',
        chapter.price,
      );

      await this.userRepository.increment(
        { id: user.id },
        'tokenSpent',
        chapter.price,
      );

      const purchase = await this.dataBaseService.create(
        this.chapterPurchaseRepository,
        {
          user,
          chapter,
          price: chapter.price,
        },
      );

      const infoPurchase = await this.chapterPurchaseRepository.findOne({
        where: { id: purchase.id },
        relations: [
          'user',
          'chapter',
          'chapter.book',
          'chapter.book.bookCategoryRelations',
          'chapter.book.bookCategoryRelations.category',
        ],
      });

      return plainToInstance(ChapterPurchaseResponseDto, infoPurchase, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(
        error.message,
        'TransactionService.purchaseChapter',
      );
      throw error;
    }
  }

  async getPurchaseChapter(
    user: UserResponseDto,
    pagination: PaginationRequestDto,
    filter: {
      chapterId?: number;
      bookId?: number;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PaginationResponseDto<ChapterPurchaseResponseDto>> {
    try {
      const { limit = 10, page = 1 } = pagination;
      const qb = this.chapterPurchaseRepository
        .createQueryBuilder('chapterPurchase')
        .leftJoinAndSelect('chapterPurchase.user', 'user')
        .leftJoinAndSelect('chapterPurchase.chapter', 'chapter')
        .leftJoinAndSelect('chapter.book', 'book');

      if (filter.chapterId) {
        qb.andWhere('chapter.id = :chapterId', { chapterId: filter.chapterId });
      }

      if (filter.bookId) {
        qb.andWhere('book.id = :bookId', { bookId: filter.bookId });
      }

      if (filter.startDate && filter.endDate) {
        const start = startOfDay(parseISO(filter.startDate));
        const end = endOfDay(parseISO(filter.endDate));

        if (isAfter(start, end)) {
          throw new BadRequestException('Start date must be before end date');
        }

        qb.andWhere(
          'chapterPurchase.createdAt BETWEEN :startDate AND :endDate',
          {
            startDate: start,
            endDate: end,
          },
        );
      } else if (filter.startDate) {
        const start = startOfDay(parseISO(filter.startDate));
        qb.andWhere('chapterPurchase.createdAt >= :startDate', {
          startDate: start,
        });
      } else if (filter.endDate) {
        const end = endOfDay(parseISO(filter.endDate));
        qb.andWhere('chapterPurchase.createdAt <= :endDate', { endDate: end });
      }

      qb.orderBy('chapterPurchase.createdAt', 'DESC');
      qb.take(limit);
      qb.skip((page - 1) * limit);

      const [data, totalItems] = await qb.getManyAndCount();

      const dtos = plainToInstance(ChapterPurchaseResponseDto, data, {
        excludeExtraneousValues: true,
      });

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: dtos,
      };
    } catch (error) {
      this.loggerService.err(
        error.message,
        'TransactionService.getPurchaseChapter',
      );
      throw error;
    }
  }

  async getAdminTransactions(
    pagination: PaginationRequestDto,
    filter: {
      id?: string;
      email?: string;
      userId?: number;
      startDate?: string;
      endDate?: string;
      status?: 'PENDING' | 'SUCCESS' | 'FAILED';
    },
  ): Promise<PaginationResponseDto<TransactionResponseDto>> {
    try {
      const { limit = 10, page = 1 } = pagination;
      const qb = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.user', 'user');

      if (filter.id) {
        qb.andWhere('transaction.id LIKE :id', { id: `%${filter.id}%` });
      }
      if (filter.email) {
        qb.andWhere('user.email LIKE :email', { email: `%${filter.email}%` });
      }
      if (filter.userId) {
        qb.andWhere('transaction.user_id = :userId', { userId: filter.userId });
      }
      if (filter.status) {
        qb.andWhere('transaction.status = :status', { status: filter.status });
      }

      if (filter.startDate && filter.endDate) {
        const start = startOfDay(parseISO(filter.startDate));
        const end = endOfDay(parseISO(filter.endDate));

        if (isAfter(start, end)) {
          throw new BadRequestException('Start date must be before end date');
        }

        qb.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
          startDate: start,
          endDate: end,
        });
      } else if (filter.startDate) {
        const start = startOfDay(parseISO(filter.startDate));
        qb.andWhere('transaction.createdAt >= :startDate', {
          startDate: start,
        });
      } else if (filter.endDate) {
        const end = endOfDay(parseISO(filter.endDate));
        qb.andWhere('transaction.createdAt <= :endDate', { endDate: end });
      }

      qb.orderBy('transaction.createdAt', 'DESC');
      qb.take(limit);
      qb.skip((page - 1) * limit);

      const [data, totalItems] = await qb.getManyAndCount();

      const dtos = plainToInstance(TransactionResponseDto, data, {
        excludeExtraneousValues: true,
      });

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: dtos,
      };
    } catch (error) {
      this.loggerService.err(
        error.message,
        'TransactionService.getAdminTransactions',
      );
      throw error;
    }
  }

  async getAdminChapterPurchases(
    filter: GetAdminChapterPurchasesDto,
  ): Promise<PaginationResponseDto<ChapterPurchaseResponseDto>> {
    try {
      const { limit = 10, page = 1 } = filter;
      const qb = this.chapterPurchaseRepository
        .createQueryBuilder('chapterPurchase')
        .leftJoinAndSelect('chapterPurchase.user', 'user')
        .leftJoinAndSelect('chapterPurchase.chapter', 'chapter')
        .leftJoinAndSelect('chapter.book', 'book');

      if (filter.chapterId) {
        qb.andWhere('chapter.id = :chapterId', { chapterId: filter.chapterId });
      }
      if (filter.bookId) {
        qb.andWhere('book.id = :bookId', { bookId: filter.bookId });
      }
      if (filter.userId) {
        qb.andWhere('user.id = :userId', { userId: filter.userId });
      }
      if (filter.email) {
        qb.andWhere('user.email LIKE :email', { email: `%${filter.email}%` });
      }
      if (filter.id) {
        qb.andWhere('chapterPurchase.id = :id', { id: filter.id });
      }
      if (filter.startDate && filter.endDate) {
        const start = startOfDay(parseISO(filter.startDate));
        const end = endOfDay(parseISO(filter.endDate));

        if (isAfter(start, end)) {
          throw new BadRequestException('Start date must be before end date');
        }

        qb.andWhere(
          'chapterPurchase.createdAt BETWEEN :startDate AND :endDate',
          {
            startDate: start,
            endDate: end,
          },
        );
      } else if (filter.startDate) {
        const start = startOfDay(parseISO(filter.startDate));
        qb.andWhere('chapterPurchase.createdAt >= :startDate', {
          startDate: start,
        });
      } else if (filter.endDate) {
        const end = endOfDay(parseISO(filter.endDate));
        qb.andWhere('chapterPurchase.createdAt <= :endDate', { endDate: end });
      }

      qb.orderBy('chapterPurchase.createdAt', 'DESC');
      qb.take(limit);
      qb.skip((page - 1) * limit);

      const [data, totalItems] = await qb.getManyAndCount();

      const dtos = plainToInstance(ChapterPurchaseResponseDto, data, {
        excludeExtraneousValues: true,
      });

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: dtos,
      };
    } catch (error) {
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

  // Get transaction statistics with chart data and overview
  async getTransactionStatisticsWithChart(
    period: TimePeriod,
    startDate?: string,
    endDate?: string
  ): Promise<{
    chart: Array<{
      period: string;
      totalTransactions: number;
      successfulTransactions: number;
      failedTransactions: number;
      totalDeposit: number;
      totalPurchased: number;
      averageDepositVolume: number;
    }>;
    overview: {
      totalTransactions: number;
      successfulTransactions: number;
      failedTransactions: number;
      totalDeposit: number;
      totalPurchased: number;
      averageDepositVolume: number;
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
      
      // Get total transactions in this interval
      const totalTransactions = await this.transactionRepository.count({
        where: {
          createdAt: Between(intervalStart, intervalEnd)
        }
      });
      
      // Get successful transactions in this interval
      const successfulTransactions = await this.transactionRepository.count({
        where: {
          createdAt: Between(intervalStart, intervalEnd),
          status: TransactionStatus.SUCCESS
        }
      });
      
      // Get failed transactions in this interval
      const failedTransactions = await this.transactionRepository.count({
        where: {
          createdAt: Between(intervalStart, intervalEnd),
          status: TransactionStatus.FAILED
        }
      });
      
      // Get total deposit amount in this interval (successful transactions only)
      const depositResult = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'totalDeposit')
        .where('transaction.created_at BETWEEN :start AND :end', { 
          start: intervalStart, 
          end: intervalEnd 
        })
        .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
        .getRawOne();
      
      const totalDeposit = depositResult?.totalDeposit ? parseFloat(depositResult.totalDeposit) : 0;
      
      // Get total purchased amount in this interval (chapter purchases)
      const purchaseResult = await this.chapterPurchaseRepository
        .createQueryBuilder('purchase')
        .select('SUM(purchase.price)', 'totalPurchased')
        .where('purchase.created_at BETWEEN :start AND :end', { 
          start: intervalStart, 
          end: intervalEnd 
        })
        .getRawOne();
      
      const totalPurchased = purchaseResult?.totalPurchased ? parseFloat(purchaseResult.totalPurchased) : 0;
      
      // Calculate average deposit volume
      const averageDepositVolume = successfulTransactions > 0 ? totalDeposit / successfulTransactions : 0;
      
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
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        totalDeposit: Math.round(totalDeposit * 100) / 100, // Round to 2 decimal places
        totalPurchased: Math.round(totalPurchased * 100) / 100,
        averageDepositVolume: Math.round(averageDepositVolume * 100) / 100,
      };
    }));
    
    // Calculate overview statistics for the entire period
    const totalTransactions = await this.transactionRepository.count({
      where: {
        createdAt: Between(start, end)
      }
    });
    
    const successfulTransactions = await this.transactionRepository.count({
      where: {
        createdAt: Between(start, end),
        status: TransactionStatus.SUCCESS
      }
    });
    
    const failedTransactions = await this.transactionRepository.count({
      where: {
        createdAt: Between(start, end),
        status: TransactionStatus.FAILED
      }
    });
    
    // Get total deposit amount for the entire period (successful transactions only)
    const overallDepositResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'totalDeposit')
      .where('transaction.created_at BETWEEN :start AND :end', { start, end })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .getRawOne();
    
    const totalDeposit = overallDepositResult?.totalDeposit ? parseFloat(overallDepositResult.totalDeposit) : 0;
    
    // Get total purchased amount for the entire period (chapter purchases)
    const overallPurchaseResult = await this.chapterPurchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.price)', 'totalPurchased')
      .where('purchase.created_at BETWEEN :start AND :end', { start, end })
      .getRawOne();
    
    const totalPurchased = overallPurchaseResult?.totalPurchased ? parseFloat(overallPurchaseResult.totalPurchased) : 0;
    
    // Calculate overall average deposit volume
    const averageDepositVolume = successfulTransactions > 0 ? totalDeposit / successfulTransactions : 0;
    
    return {
      chart: chartData,
      overview: {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        totalDeposit: Math.round(totalDeposit * 100) / 100,
        totalPurchased: Math.round(totalPurchased * 100) / 100,
        averageDepositVolume: Math.round(averageDepositVolume * 100) / 100,
      }
    };
  }
}
