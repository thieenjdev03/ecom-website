import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { PointsService } from './points.service';
import {
  PointsBalanceResponseDto,
  PointsHistoryResponseDto,
  PointTransactionDto,
  QueryPointsHistoryDto,
} from './dto/points.dto';

@ApiTags('User Points')
@ApiBearerAuth('bearer')
@UseGuards(JwtGuard)
@Controller('me/points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /** JWT payload signs `sub: user.id`; fall back defensively like OrdersController. */
  private userId(req: Request): string {
    const u: any = (req as any).user;
    return u?.sub ?? u?.id ?? u?.userId;
  }

  @Get()
  @ApiOperation({ operationId: 'getMyPoints', summary: 'Điểm loyalty hiện tại của tôi' })
  @ApiOkResponse({ type: PointsBalanceResponseDto })
  async getBalance(@Req() req: Request): Promise<PointsBalanceResponseDto> {
    const pointsBalance = await this.pointsService.getBalance(this.userId(req));
    return { pointsBalance };
  }

  @Get('history')
  @ApiOperation({ operationId: 'getMyPointsHistory', summary: 'Lịch sử tích/trừ điểm của tôi' })
  @ApiOkResponse({ type: PointsHistoryResponseDto })
  async getHistory(
    @Req() req: Request,
    @Query() query: QueryPointsHistoryDto,
  ): Promise<PointsHistoryResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.pointsService.getHistory(this.userId(req), page, limit);
    return {
      items: result.items.map((t) => PointTransactionDto.fromEntity(t)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
