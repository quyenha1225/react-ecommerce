import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PaymentsService {
  constructor(private dataSource: DataSource) {}

  // 1. TẠO QR SEPAY DỰA TRÊN ORDER_ID (ĐÃ FIX ĐÚNG THÔNG TIN VIETINBANK & CÚ PHÁP SEVQR)
  async getSePayQrUrl(orderId: number, userId: number) {
    const orders = await this.dataSource.query(
      `SELECT o.order_id, o.order_code, 
              COALESCE(SUM(oi.ordered_quantity * oi.unit_price_at_order), 0) AS total_amount
       FROM orders o 
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       WHERE o.order_id = ? AND o.customer_id = ? 
       GROUP BY o.order_id, o.order_code LIMIT 1`,
      [orderId, userId],
    );

    const order = orders[0];
    if (!order) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập',
      );
    }

    // Cố định thông tin VietinBank và số tài khoản chính xác của bạn
    const bankAccount = '101886339075';
    const bankName = 'VietinBank';
    const amount = Math.round(Number(order.total_amount) || 0);

    const orderCode = order.order_code || `ESH${order.order_id}`;

    // BẮT BUỘC PHẢI CÓ CHỮ "SEVQR" Ở ĐẦU ĐỂ VIETINBANK VÀ SEPAY NHẬN DIỆN WEBHOOK
    const description = `SEVQR ${orderCode}`;

    const qrUrl = `https://qr.sepay.vn/img?bank=${bankName}&acc=${bankAccount}&template=compact&amount=${amount}&des=${encodeURIComponent(description)}`;

    return {
      success: true,
      qrUrl,
      amount,
      description,
      orderCode: orderCode,
    };
  }

  // 2. KIỂM TRA TRẠNG THÁI CHO FRONTEND POLLING (MATCH CHÍNH XÁC ĐƠN HIỆN TẠI)
  async checkPaymentStatus(orderId: string | number) {
    const rawId = String(orderId);

    const orders = await this.dataSource.query(
      `SELECT ps.payment_status_code 
       FROM orders o 
       LEFT JOIN payments p ON p.order_id = o.order_id 
       LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id 
       WHERE o.order_id = ? OR o.order_code = ? OR o.order_code = ? 
       LIMIT 1`,
      [rawId, rawId, `ESH${rawId}`],
    );

    const isPaid = orders[0]?.payment_status_code === 'PAID';
    return { success: true, isPaid };
  }

  // 3. XỬ LÝ WEBHOOK TỰ ĐỘNG TỪ SEPAY
  async processSepayWebhook(data: any) {
    console.log('=== SEPAY WEBHOOK DATA RECEIVE ===', data);
    const content = data?.content || data?.description || '';

    if (!content)
      return { success: false, message: 'Nội dung chuyển khoản rỗng' };

    // Trích xuất chuỗi số đằng sau chữ ESH (Ví dụ: SEVQR ESH1785076777742 -> bắt được ESH và số phía sau)
    const match = content.match(/ESH(\d+)/i);
    const orderCodeFromContent = match ? `ESH${match[1]}` : null;

    let orderToUpdate: any = null;

    // A. Tìm chính xác đơn hàng theo order_code hoặc order_id
    if (orderCodeFromContent) {
      const orders = await this.dataSource.query(
        `SELECT order_id FROM orders WHERE order_code = ? OR order_code = ? LIMIT 1`,
        [orderCodeFromContent, match[1]],
      );
      orderToUpdate = orders[0];
    }

    // B. Nếu không tìm thấy chính xác theo mã ESH, lấy đơn PENDING/UNPAID gần nhất
    if (!orderToUpdate) {
      const pendingOrders = await this.dataSource.query(
        `SELECT o.order_id 
         FROM orders o
         LEFT JOIN payments p ON p.order_id = o.order_id
         LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id
         WHERE ps.payment_status_code IS NULL OR ps.payment_status_code = 'UNPAID'
         ORDER BY o.order_id DESC LIMIT 1`,
      );
      orderToUpdate = pendingOrders[0];
    }

    // C. Cập nhật trạng thái sang PAID cho đơn hàng
    if (orderToUpdate) {
      const orderId = orderToUpdate.order_id;

      // Cập nhật bảng payments -> PAID
      await this.dataSource.query(
        `UPDATE payments 
         SET payment_status_id = (SELECT payment_status_id FROM payment_statuses WHERE payment_status_code = 'PAID' LIMIT 1),
             paid_at = NOW() 
         WHERE order_id = ?`,
        [orderId],
      );

      // Cập nhật bảng orders -> CONFIRMED
      await this.dataSource.query(
        `UPDATE orders 
         SET order_status_id = (SELECT order_status_id FROM order_statuses WHERE order_status_code = 'CONFIRMED' LIMIT 1) 
         WHERE order_id = ?`,
        [orderId],
      );

      console.log(
        `✅ [SEPAY SUCCESS] Đã xác nhận thanh toán thành công cho đơn hàng ID: ${orderId}`,
      );
      return {
        success: true,
        message: 'Cập nhật trạng thái đơn hàng thành công!',
      };
    }

    console.log('❌ [SEPAY FAILED] Không tìm thấy đơn hàng cần cập nhật');
    return { success: false, message: 'Không tìm thấy đơn hàng cần cập nhật' };
  }

  // 4. MOCK THANH TOÁN THỦ CÔNG (DỰ PHÒNG)
  async mockSuccess(orderId: number, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orders = await queryRunner.query(
        `SELECT o.order_id, o.customer_id, p.payment_id, ps.payment_status_code
         FROM orders o
         LEFT JOIN payments p ON p.order_id = o.order_id
         LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id
         WHERE o.order_id = ? LIMIT 1`,
        [orderId],
      );

      const order = orders[0];
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
      if (order.customer_id !== userId)
        throw new ForbiddenException(
          'Bạn không có quyền thao tác trên đơn hàng này',
        );
      if (order.payment_status_code === 'PAID')
        throw new BadRequestException('Đơn hàng đã được thanh toán trước đó');

      const paidStatuses = await queryRunner.query(
        `SELECT payment_status_id FROM payment_statuses WHERE payment_status_code = 'PAID' LIMIT 1`,
      );
      const paidStatusId = paidStatuses[0]?.payment_status_id || 3;

      await queryRunner.query(
        `UPDATE payments SET payment_status_id = ?, paid_at = NOW() WHERE order_id = ?`,
        [paidStatusId, orderId],
      );

      const confirmedStatuses = await queryRunner.query(
        `SELECT order_status_id FROM order_statuses WHERE order_status_code = 'CONFIRMED' LIMIT 1`,
      );
      const confirmedStatusId = confirmedStatuses[0]?.order_status_id || 2;

      await queryRunner.query(
        `UPDATE orders SET order_status_id = ? WHERE order_id = ?`,
        [confirmedStatusId, orderId],
      );

      await queryRunner.commitTransaction();
      return { success: true, message: 'Thanh toán thành công!' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
