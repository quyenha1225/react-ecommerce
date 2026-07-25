// backend/src/payments/payments.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  // Thay bằng thông tin Ngân hàng bất kỳ của bạn để ảnh QR hiện đúng số tài khoản
  private readonly BANK_NAME = 'MBBank'; // VCB, MBBank, ACB, TPBank...
  private readonly ACCOUNT_NO = '0385416387'; 
  private readonly ACCOUNT_NAME = 'ELECTROSHOP';

  // Hàm sinh URL ảnh VietQR qua công cụ public của SePay
  getSePayQrUrl(orderCode: string, amount: number) {
    const description = encodeURIComponent(orderCode);
    return `https://qr.sepay.vn/img?bank=${this.BANK_NAME}&acc=${this.ACCOUNT_NO}&template=compact&amount=${amount}&des=${description}`;
  }
}