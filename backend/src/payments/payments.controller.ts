import {
  Controller,
  Patch,
  Get,
  Post,
  Param,
  Request,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 1. LẤY MÃ QR ĐƠN HÀNG (CÓ JWT)
  @Get('qr/:orderId')
  @UseGuards(JwtAuthGuard)
  async getQrCode(@Param('orderId') orderId: string, @Request() req) {
    return await this.paymentsService.getSePayQrUrl(+orderId, req.user.id);
  }

  // 2. CHECK TRẠNG THÁI CHO FRONTEND POLLING (CÔNG KHẢI, KHÔNG RÀO JWT ĐỂ TRÁNH LỖI 401)
  @Get('status/:orderId')
  async checkPaymentStatus(@Param('orderId') orderId: string) {
    return await this.paymentsService.checkPaymentStatus(orderId);
  }

  // 3. MOCK THANH TOÁN THỦ CÔNG (CÓ JWT)
  @Patch('mock-success/:orderId')
  @UseGuards(JwtAuthGuard)
  async mockSuccess(@Param('orderId') orderId: string, @Request() req) {
    return await this.paymentsService.mockSuccess(+orderId, req.user.id);
  }

  // 4. WEBHOOK SEPAY BẮN TỰ ĐỘNG TỪ NGÂN HÀNG SANG
  @Post('sepay-webhook')
  async handleSepayWebhook(@Body() body: any) {
    return await this.paymentsService.processSepayWebhook(body);
  }
}
