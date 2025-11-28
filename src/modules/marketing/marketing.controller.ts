import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';

@ApiTags('Marketing')
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe email via modal or similar entry points' })
  async subscribe(@Body() dto: SubscribeDto) {
    const contact = await this.marketingService.subscribe(dto);
    return {
      id: contact.id,
      email: contact.email,
      subscribed: contact.subscribed,
    };
  }

  @Get('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe email via tokenized link' })
  async unsubscribe(@Query() dto: UnsubscribeDto) {
    await this.marketingService.unsubscribe(dto);
    return { message: 'You have been unsubscribed successfully.' };
  }
}

