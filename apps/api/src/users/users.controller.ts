import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../common';
import { UsersService } from './users.service';
import { AddressDto, UpdateProfileDto } from './users.dto';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.sub, dto);
  }

  @Get('me/addresses')
  addresses(@CurrentUser() user: AuthUser) {
    return this.users.listAddresses(user.sub);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser() user: AuthUser, @Body() dto: AddressDto) {
    return this.users.createAddress(user.sub, dto);
  }

  @Patch('me/addresses/:id')
  updateAddress(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddressDto) {
    return this.users.updateAddress(user.sub, id, dto);
  }

  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.deleteAddress(user.sub, id);
  }

  @Get('me/wishlist')
  wishlist(@CurrentUser() user: AuthUser) {
    return this.users.wishlist(user.sub);
  }

  @Post('me/wishlist/:productId')
  toggleWishlist(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.users.toggleWishlist(user.sub, productId);
  }

  @Delete('me/wishlist/:productId')
  removeWishlist(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    return this.users.removeWishlist(user.sub, productId);
  }
}
