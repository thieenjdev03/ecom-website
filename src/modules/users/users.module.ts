import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { UserPhoneNumber } from './entities/user-phone-number.entity';
import { UserWishlist } from './entities/user-wishlist.entity';
import { UserPhoneService } from './user-phone.service';
import { UserWishlistService } from './user-wishlist.service';
import { UserPhoneController } from './user-phone.controller';
import { UserWishlistController } from './user-wishlist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPhoneNumber, UserWishlist])],
  controllers: [UsersController, UserPhoneController, UserWishlistController],
  providers: [UsersService, UserPhoneService, UserWishlistService],
  exports: [UsersService, UserPhoneService, UserWishlistService],
})
export class UsersModule {}
