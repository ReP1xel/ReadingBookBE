import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Query,
  Patch,
  Param,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UserService } from './user.service';
import { CreateManagerDto, CreateUserDto } from './dto/create-user.dto';
import {
  GetUsersFilterDto,
  UserProfileResponseDto,
  UserPublicDto,
  UserResponseDto,
} from './dto/get-user-response.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetPasswordDto } from './dto/verify-reset-password-dto';
import { JwtAuthGuard } from '@core/auth/jwt-auth.guard';
import { UpdateUserDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password-dto';
import { AdminGuard } from '@core/auth/admin.guard';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import { PaginationResponseDto } from '@shared/dto/common/pagnination/pagination-response.dto';
import {
  AddFavoriteCategoriesDto,
  updateFavoriteCategoriesDto,
} from './dto/user-favorite.dto';
import { UpdateSettingsDto } from './dto/user-setting.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { LoginResponseDto } from './dto/login.dto';
import { OptionalAuthGuard } from '@core/auth/jwt-auth-optional.guard';
import { SearchType } from './entities/user-recent-search.entity';
import { RecentSearchResponseDto } from './dto/recent-search-response.dto';
import { CreateRecentSearchDto } from './dto/create-recent-search.dto';
import { Activity, ACTIVITY_TYPE } from '@features/activities/entities/activity.entity';
import { UserActivity } from '@features/activities/entities/user-activity.entity';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
import { ActivityStatusResponseDto } from './dto/activity-status.dto';
import { TimeRangeDto } from '@features/activities/dto/time-range.dto';
import { UserBalanceDto } from './dto/user-balance.dto';

// Define the interface extending Express Request with user property
interface RequestWithUser extends ExpressRequest {
  user: {
    id: number;
    [key: string]: any;
  };
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Tạo tài khoản' })
  @Post('/register')
  async register(@Body() body: CreateUserDto): Promise<UserResponseDto> {
    return await this.userService.register(body);
  }

  @ApiOperation({ summary: 'Xác thực tài khoản' })
  @Get('/verify')
  async verify(@Query('token') token: string): Promise<LoginResponseDto> {
    return await this.userService.verify(token);
  }

  @ApiOperation({ summary: 'Quên mật khẩu' })
  @Post('/reset-password')
  async resetPassword(@Body() body: ResetPasswordDto): Promise<Boolean> {
    return await this.userService.resetPassword(body);
  }

  @ApiOperation({ summary: 'Xác thực otp' })
  @Post('/verify-reset-password')
  async verifyResetPasswordCode(
    @Body() body: VerifyResetPasswordDto,
  ): Promise<Boolean> {
    return await this.userService.verifyResetPasswordCode(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @Get('/me')
  async getProfile(@Req() req: ExpressRequest): Promise<UserProfileResponseDto> {
    return await this.userService.getProfile(req);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @Patch()
  async updateUser(
    @Req() req: ExpressRequest,
    @Body() body: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateUser(req, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @Patch('update-password')
  async updatePassword(@Req() req: ExpressRequest, @Body() body: UpdatePasswordDto) {
    return this.userService.updatePassword(req, body);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin lấy danh sách người dùng' })
  @Get()
  async getUsers(
    @Req() req: any,
    @Query() filter: GetUsersFilterDto,
    @Query() pagination: PaginationRequestDto,
  ): Promise<PaginationResponseDto<UserResponseDto>> {
    const user = req.user;
    return this.userService.getUsers(user, filter, pagination);
  }

  @Post('create-manager')
  @ApiOperation({ summary: 'Tạo tài khoản Manager (chỉ Super Admin)' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createManager(@Body() createDto: CreateManagerDto) {
    return this.userService.createManagerAccount(createDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Cập nhật trạng thái người dùng' })
  @Patch('status/:id')
  async updateUserStatus(
    @Param('id') id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<Boolean> {
    return await this.userService.updateUserStatus(
      id,
      updateUserStatusDto.statusId,
    );
  }

  @ApiOperation({ summary: 'Thêm thể loại sách với người dùng' })
  @ApiBody({ type: AddFavoriteCategoriesDto })
  @Post('favorite/categories')
  async addFavorites(@Body() body: { userId: number; categoryIds: number[] }) {
    return this.userService.addFavorite(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Chỉnh sửa thể loại sách yêu thích của người dùng' })
  @ApiBody({ type: updateFavoriteCategoriesDto })
  @Patch('favorite/categories')
  async updateFavorite(
    @Req() req: ExpressRequest,
    @Body() body: updateFavoriteCategoriesDto,
  ) {
    const userId = (req as any).user?.id;
    return this.userService.updateFavorite(userId, body.categoryIds);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách thể loại sách yêu thích của người dùng',
  })
  @Get('favorite/categories')
  async getFavoriteCategories(@Req() req: ExpressRequest) {
    const userId = (req as any).user?.id;
    return this.userService.getFavoriteCategories(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy setting của người dùng',
  })
  @Get('settings')
  async getSettings(@Req() req: ExpressRequest) {
    const userId = (req as any).user?.id;
    return this.userService.getSettings(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cập nhật setting của người dùng',
  })
  @Patch('settings')
  async updateSettings(
    @Req() req: ExpressRequest,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    const userId = (req as any).user?.id;
    return this.userService.updateSettings(userId, updateSettingsDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy thông tin số dư của người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Return user balance information',
    type: UserBalanceDto,
  })
  @Get('balance')
  async getBalance(@Req() req: ExpressRequest): Promise<UserBalanceDto> {
    const userId = (req as any).user?.id;
    return this.userService.getBalance(userId);
  }

  @Get('search')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Search users by name',
    description: 'Search for users by name with optional authentication to save search history',
  })
  @ApiResponse({
    status: 200,
    description: 'Return matched users',
    type: PaginationResponseDto,
  })
  async searchUsersByName(
    @Query('search') search: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: ExpressRequest,
  ): Promise<PaginationResponseDto<UserPublicDto>> {
    const userId = (req as any).user?.id;
    return this.userService.searchUsersByName(search, { page, limit }, userId);
  }

  @Get('recent-searches')
  @ApiOperation({
    summary: 'Get recent searches',
    description: 'Get user recent searches',
  })
  @ApiResponse({
    status: 200,
    description: 'Return recent searches',
    type: [RecentSearchResponseDto],
  })
  @UseGuards(JwtAuthGuard)
  async getRecentSearches(
    @Req() req: RequestWithUser,
    @Query('type') searchType?: SearchType,
  ) {
    const user = req.user;
    return this.userService.getRecentSearches(user.id, searchType);
  }

  @Post('recent-searches')
  @ApiOperation({
    summary: 'Create recent search record',
    description: 'Save a user search to their recent searches history'
  })
  @ApiResponse({
    status: 201,
    description: 'Recent search saved successfully',
    type: Boolean
  })
  @UseGuards(JwtAuthGuard)
  async createRecentSearch(
    @Req() req: RequestWithUser,
    @Body() createRecentSearchDto: CreateRecentSearchDto
  ) {
    const userId = req.user.id;
    return this.userService.storeRecentSearch(
      userId,
      createRecentSearchDto.searchType,
      createRecentSearchDto.searchValue,
      createRecentSearchDto.relatedId
    );
  }


  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get user registration statistics' })
  @Get('statistics')
  async getUserStatistics(@Query() query: TimeRangeDto) {
    return this.userService.getUserStatisticsWithChart(
      query.period,
      query.startDate,
      query.endDate
    );
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  async getUserProfile(
    @Param('id') id: number,
    @Req() req: ExpressRequest,
  ): Promise<UserProfileDto | UserProfileResponseDto> {
    const userId = (req as any).user?.id;
    return await this.userService.getUserProfileById(id, userId);
  }

}
