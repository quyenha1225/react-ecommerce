import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Checkout công khai (tự nhận diện userId từ token nếu có, hoặc dùng ID 1 mặc định)
  @Post('checkout')
  async checkout(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user?.id || 1;
    return await this.ordersService.checkout(userId, createOrderDto);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Request() req) {
    return await this.ordersService.getMyOrders(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderDetail(@Request() req, @Param('id') id: string) {
    return await this.ordersService.getOrderDetail(req.user.id, +id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(@Request() req, @Param('id') id: string) {
    return await this.ordersService.cancelOrder(req.user.id, +id);
  }
}
