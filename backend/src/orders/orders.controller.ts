import { Controller, Post, Get, Param, Body, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../security/jwt-auth.guard'; 

@Controller('orders')
@UseGuards(JwtAuthGuard) // Sửa tên class Guard ở đây
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.checkout(req.user.id, createOrderDto);
  }

  @Get('my-orders')
  async getMyOrders(@Request() req) {
    return await this.ordersService.getMyOrders(req.user.id);
  }

  @Get(':id')
  async getOrderDetail(@Request() req, @Param('id') id: string) {
    return await this.ordersService.getOrderDetail(req.user.id, +id);
  }

  @Post(':id/cancel')
  async cancelOrder(@Request() req, @Param('id') id: string) {
    return await this.ordersService.cancelOrder(req.user.id, +id);
  }
}