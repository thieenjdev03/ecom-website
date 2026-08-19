import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PointTransaction } from './entities/point-transaction.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PointTransaction, User])],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
