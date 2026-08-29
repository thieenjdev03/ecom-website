import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { ContactService } from './contact.service'
import { CreateContactDto } from './dto/create-contact.dto'

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Submit the storefront contact form' })
  @HttpCode(HttpStatus.CREATED)
  async submit(@Body() dto: CreateContactDto, @Req() req: Request) {
    const forwarded = req.headers['x-forwarded-for']
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || req.ip || null
    const contact = await this.contactService.submit(dto, ip)
    return { id: contact.id, message: 'Đã nhận liên hệ của bạn.' }
  }
}
