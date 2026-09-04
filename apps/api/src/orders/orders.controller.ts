import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, PreviewOrderDto } from '../users/users.dto';

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post('preview')
  preview(@Body() dto: PreviewOrderDto) {
    return this.orders.preview(dto);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.sub, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.mine(user.sub);
  }

  @Get(':id')
  one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.findOne(id, user);
  }
}
