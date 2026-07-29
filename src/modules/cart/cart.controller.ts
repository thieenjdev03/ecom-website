import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../auth/jwt.guard';
import { CartService } from './cart.service';
import {
  AddCartItemDto,
  CartResponseDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

@ApiTags('cart')
@ApiHeader({ name: 'X-Cart-Token', required: true })
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOkResponse({ type: CartResponseDto })
  getCart(
    @Headers('x-cart-token') token: string,
    @Query('locale') locale = 'vi',
  ) {
    return this.cartService.getCart(token, locale);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a sellable product to the server-side cart' })
  @ApiOkResponse({ type: CartResponseDto })
  addItem(
    @Headers('x-cart-token') token: string,
    @Body() dto: AddCartItemDto,
    @Query('locale') locale = 'vi',
  ) {
    return this.cartService.addItem(token, dto, locale);
  }

  @Patch('items/:id')
  @ApiOkResponse({ type: CartResponseDto })
  updateItem(
    @Headers('x-cart-token') token: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Query('locale') locale = 'vi',
  ) {
    return this.cartService.updateItem(token, id, dto, locale);
  }

  @Delete('items/:id')
  @ApiOkResponse({ type: CartResponseDto })
  removeItem(
    @Headers('x-cart-token') token: string,
    @Param('id') id: string,
    @Query('locale') locale = 'vi',
  ) {
    return this.cartService.removeItem(token, id, locale);
  }

  @Delete()
  clear(@Headers('x-cart-token') token: string) {
    return this.cartService.clear(token);
  }

  @Post('merge')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CartResponseDto })
  merge(
    @Headers('x-cart-token') token: string,
    @Request() request: any,
    @Query('locale') locale = 'vi',
  ) {
    const userId = request.user?.sub || request.user?.userId;
    if (!userId) throw new UnauthorizedException('Unauthorized');
    return this.cartService.mergeGuestCart(token, userId, locale);
  }
}
