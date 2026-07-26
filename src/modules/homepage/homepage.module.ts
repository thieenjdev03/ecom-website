import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomepageBannersController } from './homepage-banners.controller';
import { HomepageBannersService } from './homepage-banners.service';
import { HomepageBanner } from './entities/homepage-banner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HomepageBanner])],
  controllers: [HomepageBannersController],
  providers: [HomepageBannersService],
  exports: [HomepageBannersService],
})
export class HomepageModule {}
