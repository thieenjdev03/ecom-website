import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { StorefrontHomeDto } from './dto/storefront-home.dto';

@ApiTags('storefront')
@Controller('storefront')
export class StorefrontController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('home')
  @ApiOperation({ summary: 'Get active homepage collections and sellable products' })
  @ApiOkResponse({ type: StorefrontHomeDto })
  getHome(@Query('locale') locale = 'vi') {
    return this.collectionsService.getStorefrontHome(locale);
  }
}
