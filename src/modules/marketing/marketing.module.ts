import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingContact } from './entities/marketing-contact.entity';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketingContact]),
    MailModule,
  ],
  providers: [MarketingService],
  controllers: [MarketingController],
  exports: [MarketingService],
})
export class MarketingModule {}

