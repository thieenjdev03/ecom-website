import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Distributor } from './entities/distributor.entity';
import { Category } from '../products/entities/category.entity';
import { Collection } from '../collections/entities/collection.entity';
import { DistributorsService } from './distributors.service';
import { DistributorsController } from './distributors.controller';
import { DistributorsPublicController } from './distributors.public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Distributor, Category, Collection])],
  controllers: [DistributorsController, DistributorsPublicController],
  providers: [DistributorsService],
  exports: [DistributorsService],
})
export class DistributorsModule {}
