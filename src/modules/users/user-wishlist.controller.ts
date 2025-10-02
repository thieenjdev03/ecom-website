import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { UserWishlistService } from './user-wishlist.service';
import { AddToWishlistDto, UpdateWishlistDto } from './dto/wishlist.dto';

@Controller('user/wishlist')
@UseGuards(JwtGuard)
export class UserWishlistController {
  constructor(private readonly wishlistService: UserWishlistService) {}

  @Get()
  findAll(@Request() req) {
    const userId = req.user?.sub;
    return this.wishlistService.findAllByUser(userId);
  }

  @Post()
  addToWishlist(@Request() req, @Body() dto: AddToWishlistDto) {
    const userId = req.user?.sub;
    return this.wishlistService.addToWishlist(userId, dto);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateWishlistDto) {
    const userId = req.user?.sub;
    return this.wishlistService.updateWishlistItem(userId, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const userId = req.user?.sub;
    await this.wishlistService.removeFromWishlist(userId, id);
    return { message: 'Item removed from wishlist' };
  }

  @Delete()
  async clear(@Request() req) {
    const userId = req.user?.sub;
    await this.wishlistService.clearWishlist(userId);
    return { message: 'Wishlist cleared' };
  }

  @Get('check')
  async checkInWishlist(
    @Request() req,
    @Query('variantId') variantId?: string,
  ) {
    const userId = req.user?.sub;
    const inWishlist = await this.wishlistService.isInWishlist(userId);
    return { inWishlist };
  }
}

