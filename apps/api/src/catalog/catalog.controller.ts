import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Public, CurrentUser, AuthUser } from '../common';
import { CatalogService } from './catalog.service';
import { ProductQueryDto } from './catalog.dto';
import { ReviewDto } from '../users/users.dto';

@Public()
@Controller()
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get('health')
  health() {
    return { ok: true, service: 'bakes-n-sale-api', time: new Date().toISOString() };
  }

  @Get('categories')
  categories() {
    return this.catalog.categories();
  }

  @Get('settings')
  settings() {
    return this.catalog.settings();
  }

  @Get('products')
  products(@Query() q: ProductQueryDto) {
    return this.catalog.products(q);
  }

  @Get('products/home')
  home() {
    return this.catalog.home();
  }

  @Get('products/:slug')
  product(@Param('slug') slug: string) {
    return this.catalog.productBySlug(slug);
  }
}

@Controller('catalog')
export class ReviewsController {
  constructor(private catalog: CatalogService) {}

  @Post('products/:id/reviews')
  addReview(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: ReviewDto) {
    return this.catalog.addReview(id, user.sub, dto);
  }
}
