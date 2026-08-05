import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { QueryCartDto } from './dto/query-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { JwtGuard } from '../../auth/jwt.guard';

const CART_TOKEN_HEADER = 'x-cart-token';

@ApiTags('cart')
@ApiHeader({
  name: CART_TOKEN_HEADER,
  description: 'Guest cart token (persisted in the browser)',
  required: false,
})
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  getCart(
    @Headers(CART_TOKEN_HEADER) token: string,
    @Query() query: QueryCartDto,
  ) {
    return this.cartService.getCart(token, query.locale);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a product to the cart' })
  @ApiResponse({ status: 201, type: CartResponseDto })
  addItem(
    @Headers(CART_TOKEN_HEADER) token: string,
    @Body() dto: AddCartItemDto,
    @Query() query: QueryCartDto,
  ) {
    return this.cartService.addItem(token, dto, query.locale);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update a cart line quantity (0 removes it)' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  updateItem(
    @Headers(CART_TOKEN_HEADER) token: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Query() query: QueryCartDto,
  ) {
    return this.cartService.updateItem(token, itemId, dto, query.locale);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove a line from the cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  removeItem(
    @Headers(CART_TOKEN_HEADER) token: string,
    @Param('itemId') itemId: string,
    @Query() query: QueryCartDto,
  ) {
    return this.cartService.removeItem(token, itemId, query.locale);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Empty the cart' })
  @ApiResponse({ status: 204, description: 'Cart emptied' })
  clear(@Headers(CART_TOKEN_HEADER) token: string) {
    return this.cartService.clear(token);
  }

  @Post('merge')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Merge the guest cart into the authenticated user on login' })
  @ApiResponse({ status: 201, type: CartResponseDto })
  merge(
    @Headers(CART_TOKEN_HEADER) token: string,
    @Req() req: any,
    @Query() query: QueryCartDto,
  ) {
    return this.cartService.merge(token, req.user?.sub, query.locale);
  }
}
