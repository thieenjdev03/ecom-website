import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContactMessage } from './entities/contact-message.entity'
import { ContactService } from './contact.service'
import { ContactController } from './contact.controller'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage]), MailModule],
  providers: [ContactService],
  controllers: [ContactController],
})
export class ContactModule {}
