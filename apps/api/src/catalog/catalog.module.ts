import { Module } from '@nestjs/common';
import { CatalogController, ReviewsController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController, ReviewsController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
