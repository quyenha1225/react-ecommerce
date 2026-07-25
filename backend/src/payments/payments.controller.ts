// backend/src/payments/payments.controller.ts hoặc orders.controller.ts
import { Controller, Patch, Param, Body, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('payments')
export class PaymentsController {
  constructor(private dataSource: DataSource) {}

  // API Giả lập thanh toán thành công
  @Patch('mock-success/:orderId')
  async mockPaymentSuccess(@Param('orderId') orderId: string) {
    const numericOrderId = Number(orderId);
    
    // 1. Lấy ID trạng thái 'PAID' trong bảng payment_statuses
    const paymentStatusRows = await this.dataSource.query(
      `SELECT payment_status_id FROM payment_statuses WHERE payment_status_code = 'PAID' LIMIT 1`
    );
    const paidStatusId = paymentStatusRows[0]?.payment_status_id || 3;

    // 2. Lấy ID trạng thái đơn hàng 'CONFIRMED' hoặc 'PACKING' trong order_statuses
    const orderStatusRows = await this.dataSource.query(
      `SELECT order_status_id FROM order_statuses WHERE order_status_code IN ('CONFIRMED', 'PACKING') LIMIT 1`
    );
    const confirmedOrderStatusId = orderStatusRows[0]?.order_status_id || 2;

    // 3. Cập nhật bảng payments
    await this.dataSource.query(
      `UPDATE payments 
       SET payment_status_id = ?, paid_at = NOW(), transaction_code = ? 
       WHERE order_id = ?`,
      [paidStatusId, `MOCK_TXN_${Date.now()}`, numericOrderId]
    );

    // 4. Cập nhật bảng orders sang Đã xác nhận
    await this.dataSource.query(
      `UPDATE orders SET order_status_id = ? WHERE order_id = ?`,
      [confirmedOrderStatusId, numericOrderId]
    );

    return {
      success: true,
      message: 'Giả lập thanh toán thành công!',
      orderId: numericOrderId,
    };
  }
}