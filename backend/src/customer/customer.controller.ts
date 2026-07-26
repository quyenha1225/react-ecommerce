import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { AddressDto, ChangePasswordDto, CreateOrderDto, UpdateProfileDto } from './customer.dto';
import { CustomerService } from './customer.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Get('account/me') me(@Req() req: any) { return this.service.me(req.user.id); }
  @Patch('account/profile') updateProfile(@Req() req: any, @Body() body: UpdateProfileDto) { return this.service.updateProfile(req.user.id, body); }
  @Patch('account/password') changePassword(@Req() req: any, @Body() body: ChangePasswordDto) { return this.service.changePassword(req.user.id, body); }
  @Get('account/addresses') addresses(@Req() req: any) { return this.service.addresses(req.user.id); }
  @Post('account/addresses') createAddress(@Req() req: any, @Body() body: AddressDto) { return this.service.saveAddress(req.user.id, null, body); }
  @Patch('account/addresses/:id') updateAddress(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: AddressDto) { return this.service.saveAddress(req.user.id, id, body); }
  @Delete('account/addresses/:id') deleteAddress(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.service.deleteAddress(req.user.id, id); }

  @Get('orders/my') orders(@Req() req: any) { return this.service.orders(req.user.id); }
  @Get('orders/my/:id') order(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.service.order(req.user.id, id); }
  @Post('orders') createOrder(@Req() req: any, @Body() body: CreateOrderDto) { return this.service.createOrder(req.user.id, body); }
  @Patch('orders/:id/cancel') cancelOrder(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.service.cancelOrder(req.user.id, id); }
  @Patch('orders/:id/payment-confirm') confirmPayment(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.service.confirmPayment(req.user.id, id); }
}
