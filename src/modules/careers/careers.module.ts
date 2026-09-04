import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareersService } from './careers.service';
import { CareersController } from './careers.controller';
import { CareerApplicationsController } from './career-applications.controller';
import { Career } from './entities/career.entity';
import { CareerApplication } from './entities/career-application.entity';
import { FilesModule } from '../files/files.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Career, CareerApplication]), FilesModule, MailModule],
  controllers: [CareersController, CareerApplicationsController],
  providers: [CareersService],
  exports: [CareersService],
})
export class CareersModule {}
