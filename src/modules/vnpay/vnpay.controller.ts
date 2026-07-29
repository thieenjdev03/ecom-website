import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VnpayService } from './vnpay.service';

@ApiTags('vnpay')
@Controller('payments/vnpay')
export class VnpayController {
  constructor(private readonly vnpay: VnpayService) {}
  @Get('ipn')
  async ipn(@Query() query: Record<string, unknown>, @Res() response: any) { return response.json(await this.vnpay.handleIpn(query)); }
  @Get('return')
  async returnState(@Query() query: Record<string, unknown>) { return this.vnpay.getReturnState(query); }
}
