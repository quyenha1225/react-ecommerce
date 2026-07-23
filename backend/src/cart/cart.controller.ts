import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async saveCart(
    @Body() body: { items: any[] }, @Request() req: any
  ) {
    return await this.cartService.saveCart(req.user.id, body.items);
  }

  @Get()
  async getCart(@Request() req: any) {
    return await this.cartService.getCart(req.user.id);
  }
}
