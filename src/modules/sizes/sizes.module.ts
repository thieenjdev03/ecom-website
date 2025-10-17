import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SizesController } from './sizes.controller';
import { SizesService } from './sizes.service';
import { Size } from './entities/size.entity';
import { Category } from '../products/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Size, Category])],
  controllers: [SizesController],
  providers: [SizesService],
  exports: [SizesService],
})
export class SizesModule {}


