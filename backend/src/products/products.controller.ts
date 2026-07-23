import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts() {
    return await this.productsService.findAll();
  }

  // Chi tiet 1 san pham - ProductDetail.jsx goi endpoint nay
  @Get(':id')
  async getProductDetail(@Param('id') id: string) {
    return await this.productsService.findOne(id);
  }

  // GHI NHAT KY XEM
  @Post('log-view')
  @UseGuards(JwtAuthGuard)
  async logProductView(@Body() body: { productId: number }, @Req() req: any) {
    return await this.productsService.logView(req.user.id, body.productId);
  }

  @Get('recommend/:id')
  async getRecommendations(@Param('id') id: string) {
    return await this.productsService.getRecommendedProducts(Number(id));
  }

  // ===================== REVIEWS =====================

  @Get(':id/reviews')
  async getProductReviews(@Param('id') id: string) {
    return await this.productsService.getReviews(Number(id));
  }

  // TODO: khi ban gan JWT auth guard vao du an, thay body.userId bang
  // userId lay tu @Req() req.user.userId de tranh client tu xung la ai cung duoc.
  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  async createProductReview(
    @Param('id') id: string,
    @Body()
    body: {
      rating: number;
      title?: string;
      content?: string;
      orderId?: number;
    }, @Req() req: any,
  ) {
    return await this.productsService.createReview(
      Number(id),
      req.user.id,
      body.rating,
      body.title ?? '',
      body.content ?? '',
      body.orderId ?? null,
    );
  }
}
