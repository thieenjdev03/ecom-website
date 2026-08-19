import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { PointTransactionType } from '../enums/point-transaction-type.enum';
import { PointTransaction } from '../entities/point-transaction.entity';

export class PointsBalanceResponseDto {
  @ApiProperty({ description: 'Điểm loyalty hiện tại của user', example: 7 })
  pointsBalance: number;
}

export class PointTransactionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid', description: 'Đơn hàng phát sinh điểm' })
  orderId: string;

  @ApiProperty({ enum: PointTransactionType, example: PointTransactionType.EARN })
  type: PointTransactionType;

  @ApiProperty({
    description: 'Số điểm (dương). EARN cộng, REVERSE trừ khỏi balance.',
    example: 7,
  })
  points: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  static fromEntity(e: PointTransaction): PointTransactionDto {
    return {
      id: e.id,
      orderId: e.orderId,
      type: e.type,
      points: e.points,
      createdAt: e.createdAt,
    };
  }
}

export class PointsHistoryResponseDto {
  @ApiProperty({ type: [PointTransactionDto] })
  items: PointTransactionDto[];

  @ApiProperty({ description: 'Tổng số giao dịch', example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class QueryPointsHistoryDto {
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
