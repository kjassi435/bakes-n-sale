import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../common';
import { AdminService } from './admin.service';
import {
  AdminOrdersQueryDto,
  CouponUpsertDto,
  ProductUpsertDto,
  UpdateOrderStatusDto,
} from './admin.dto';

const STAFF = ['ADMIN', 'MANAGER', 'SUPPORT'];
const EDITORS = ['ADMIN', 'MANAGER'];

@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  // Dashboard & reports
  @Get('dashboard')
  @Roles(...STAFF)
  dashboard() {
    return this.admin.dashboard();
  }

  // Orders
  @Get('orders')
  @Roles(...STAFF)
  orders(@Query() q: AdminOrdersQueryDto) {
    return this.admin.orders(q);
  }

  @Get('orders/:id')
  @Roles(...STAFF)
  order(@Param('id') id: string) {
    return this.admin.orderDetail(id);
  }

  @Patch('orders/:id/status')
  @Roles(...EDITORS)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.admin.updateOrderStatus(id, dto);
  }

  // Products
  @Get('products')
  @Roles(...STAFF)
  products(@Query('search') search?: string) {
    return this.admin.products(search);
  }

  @Get('products/:id')
  @Roles(...STAFF)
  product(@Param('id') id: string) {
    return this.admin.product(id);
  }

  @Post('products')
  @Roles(...EDITORS)
  createProduct(@Body() dto: ProductUpsertDto) {
    return this.admin.createProduct(dto);
  }

  @Patch('products/:id')
  @Roles(...EDITORS)
  updateProduct(@Param('id') id: string, @Body() dto: ProductUpsertDto) {
    return this.admin.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @Roles(...EDITORS)
  deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(id);
  }

  // Coupons
  @Get('coupons')
  @Roles(...STAFF)
  coupons() {
    return this.admin.coupons();
  }

  @Post('coupons')
  @Roles(...EDITORS)
  createCoupon(@Body() dto: CouponUpsertDto) {
    return this.admin.createCoupon(dto);
  }

  @Patch('coupons/:id')
  @Roles(...EDITORS)
  updateCoupon(@Param('id') id: string, @Body() dto: CouponUpsertDto) {
    return this.admin.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  @Roles(...EDITORS)
  deleteCoupon(@Param('id') id: string) {
    return this.admin.deleteCoupon(id);
  }

  // Customers
  @Get('customers')
  @Roles(...STAFF)
  customers() {
    return this.admin.customers();
  }

  // Site content (CMS)
  @Get('settings')
  @Roles(...STAFF)
  getSettings() {
    return this.admin.getSettings();
  }

  @Patch('settings')
  @Roles(...EDITORS)
  saveSettings(@Body() body: { key: string; value: any }[] | { items: { key: string; value: any }[] }) {
    const items = Array.isArray(body) ? body : body.items;
    return this.admin.saveSettings(items);
  }

  // Categories
  @Patch('categories/:id')
  @Roles(...EDITORS)
  updateCategory(@Param('id') id: string, @Body() body: { name?: string; image?: string; description?: string; sortOrder?: number }) {
    return this.admin.updateCategory(id, body);
  }

  @Post('categories')
  @Roles(...EDITORS)
  createCategory(@Body() body: { name: string; slug?: string; parentId?: string | null; image?: string; description?: string; sortOrder?: number }) {
    return this.admin.createCategory(body);
  }
}
