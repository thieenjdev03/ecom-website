import { Controller, Get, Post, Patch, Delete, Body, Param, Request, Headers } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, MergeCartDto } from './dto/cart.dto';
import { Public } from '../../auth/public.decorator';  

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private getUserIdOrSessionId(req: any, headers: any) {
    const userId = req.user?.id;
    console.log(`req: ${req}, headers: ${headers}`);
    const sessionId = headers['x-session-id'] || headers['x-guest-id'];
    console.log(`req: ${req}, headers: ${headers}, sessionId: ${sessionId}`);
    console.log(`userId: ${userId}, sessionId: ${sessionId}`);
    return { userId, sessionId };
  }

  @Get()
  @Public()
  async getCart(@Request() req, @Headers() headers) {
    console.log(`req: ${req}, headers: ${headers}`);
    const { userId, sessionId } = this.getUserIdOrSessionId(req, headers);
    console.log(`userId: ${userId}, sessionId: ${sessionId}`);
    return this.cartService.getOrCreateCart(userId, sessionId);
  }

  @Post('items')
  @Public()
  async addToCart(@Request() req, @Headers() headers, @Body() dto: AddToCartDto) {
    const { userId, sessionId } = this.getUserIdOrSessionId(req, headers);
    return this.cartService.addToCart(userId, sessionId, dto);
  }

  @Patch('items/:itemId')
  @Public()
  async updateItem(
    @Request() req,
    @Headers() headers,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const { userId, sessionId } = this.getUserIdOrSessionId(req, headers);
    return this.cartService.updateCartItem(userId, sessionId, itemId, dto);
  }

  @Delete('items/:itemId')
  @Public()
  async removeItem(@Request() req, @Headers() headers, @Param('itemId') itemId: string) {
    const { userId, sessionId } = this.getUserIdOrSessionId(req, headers);
    await this.cartService.removeCartItem(userId, sessionId, itemId);
    return { message: 'Item removed from cart' };
  }

  @Delete()
  @Public()
  async clearCart(@Request() req, @Headers() headers) {
    const { userId, sessionId } = this.getUserIdOrSessionId(req, headers);
    await this.cartService.clearCart(userId, sessionId);
    return { message: 'Cart cleared' };
  }

  @Post('merge')
  async mergeCart(@Request() req, @Body() dto: MergeCartDto) {
    if (!req.user?.id) {
      return { message: 'User must be logged in to merge cart' };
    }
    return this.cartService.mergeGuestCart(req.user.id, dto.sessionId);
  }
}

