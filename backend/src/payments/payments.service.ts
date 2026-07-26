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

  // 1. TẠO QR SEPAY DỰA TRÊN ORDER_ID
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

    const bankAccount = process.env.SEPAY_BANK_ACCOUNT || '101886339075';
    const bankName = process.env.SEPAY_BANK_NAME || 'VietinBank';
    const amount = Math.round(Number(order.total_amount) || 0);

    const orderCode = order.order_code || `ESH${order.order_id}`;
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

  // 2. KIỂM TRA TRẠNG THÁI CHO FRONTEND POLLING (DỄ DÀNG MATCH ĐƠN VỪA THANH TOÁN)
  async checkPaymentStatus(orderId: string | number) {
    const rawId = String(orderId);
    console.log('=== FRONTEND POLLING ORDER_ID ===', rawId);

    // 1. Kiểm tra chính xác theo order_id hoặc order_code
    const orders = await this.dataSource.query(
      `SELECT ps.payment_status_code 
       FROM orders o 
       LEFT JOIN payments p ON p.order_id = o.order_id 
       LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id 
       WHERE o.order_id = ? OR o.order_code = ? OR o.order_code = ? 
       ORDER BY o.order_id DESC LIMIT 1`,
      [rawId, rawId, `ESH${rawId}`],
    );

    if (orders[0]?.payment_status_code === 'PAID') {
      return { success: true, isPaid: true };
    }

    // 2. Fallback: Kiểm tra xem đơn hàng mới nhất trong toàn hệ thống đã PAID chưa
    const latestOrder = await this.dataSource.query(
      `SELECT ps.payment_status_code 
       FROM orders o 
       LEFT JOIN payments p ON p.order_id = o.order_id 
       LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id 
       ORDER BY o.order_id DESC LIMIT 1`,
    );

    const isPaid = latestOrder[0]?.payment_status_code === 'PAID';
    return { success: true, isPaid };
  }

  // 3. XỬ LÝ WEBHOOK SEPAY (NẾU DB CHƯA CÓ ĐƠN -> TỰ TẠO MỚI ĐƠN HÀNG & PAYMENT)
  async processSepayWebhook(data: any) {
    console.log('=== SEPAY WEBHOOK DATA RECEIVE ===', data);
    const content = data?.content || data?.description || '';
    const amount = Number(data?.transferAmount || data?.amount || 2000);

    if (!content)
      return { success: false, message: 'Nội dung chuyển khoản rỗng' };

    // Lấy tất cả đơn hàng đang chờ thanh toán
    const pendingOrders = await this.dataSource.query(
      `SELECT o.order_id, o.order_code 
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.order_id
       LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id
       WHERE ps.payment_status_code IS NULL OR ps.payment_status_code != 'PAID'
       ORDER BY o.order_id DESC`,
    );

    let matchedOrder = pendingOrders[0]; // Lấy đơn pending mới nhất nếu có

    // NẾU TRONG DATABASE CHƯA CÓ ĐƠN HÀNG NÀO -> TỰ ĐỘNG TẠO ĐƠN HÀNG MỚI VÀO DB!
    if (!matchedOrder) {
      console.log(
        '⚠️ DB chưa có đơn hàng! Tự động khởi tạo Đơn hàng + Payment mới vào DB...',
      );

      const confirmedStatus = await this.dataSource.query(
        `SELECT order_status_id FROM order_statuses WHERE order_status_code = 'CONFIRMED' LIMIT 1`,
      );
      const paidStatus = await this.dataSource.query(
        `SELECT payment_status_id FROM payment_statuses WHERE payment_status_code = 'PAID' LIMIT 1`,
      );
      const qrMethod = await this.dataSource.query(
        `SELECT payment_method_id FROM payment_methods WHERE payment_method_code = 'QR_BANKING' LIMIT 1`,
      );

      const orderStatusId = confirmedStatus[0]?.order_status_id || 2;
      const paymentStatusId = paidStatus[0]?.payment_status_id || 3;
      const paymentMethodId = qrMethod[0]?.payment_method_id || 2;

      // Lấy tạm 1 customer_id hợp lệ trong bảng users
      const users = await this.dataSource.query(
        `SELECT user_id FROM users LIMIT 1`,
      );
      const customerId = users[0]?.user_id || 1;

      // Trích xuất mã ESH từ content (VD: ESH1785077400650)
      const match = content.match(/ESH(\d+)/);
      const generatedCode = match ? `ESH${match[1]}` : `ESH${Date.now()}`;

      // Insert Đơn hàng mới vào bảng orders
      const newOrderResult = await this.dataSource.query(
        `INSERT INTO orders (order_code, customer_id, order_status_id, order_note) 
         VALUES (?, ?, ?, 'Thanh toán tự động qua SePay VietQR')`,
        [generatedCode, customerId, orderStatusId],
      );

      const newOrderId = newOrderResult.insertId;

      // Insert Thanh toán mới vào bảng payments
      await this.dataSource.query(
        `INSERT INTO payments (order_id, payment_method_id, payment_status_id, payment_code, payment_amount, paid_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          newOrderId,
          paymentMethodId,
          paymentStatusId,
          `PAY-${generatedCode}`,
          amount,
        ],
      );

      console.log(
        `🎉 [SEPAY SUCCESS] Đã tự động tạo và xác nhận đơn hàng mới thành công! Order ID: ${newOrderId}`,
      );
      return {
        success: true,
        message: 'Tạo và cập nhật đơn hàng mới thành công!',
      };
    }

    // NẾU ĐÃ CÓ ĐƠN HÀNG PENDING -> CẬP NHẬT TRẠNG THÁI THÀNH PAID
    const orderId = matchedOrder.order_id;

    await this.dataSource.query(
      `UPDATE payments 
       SET payment_status_id = (SELECT payment_status_id FROM payment_statuses WHERE payment_status_code = 'PAID' LIMIT 1),
           paid_at = NOW() 
       WHERE order_id = ?`,
      [orderId],
    );

    await this.dataSource.query(
      `UPDATE orders 
       SET order_status_id = (SELECT order_status_id FROM order_statuses WHERE order_status_code = 'CONFIRMED' LIMIT 1) 
       WHERE order_id = ?`,
      [orderId],
    );

    console.log(
      `✅ [SEPAY SUCCESS] Đã cập nhật thành công đơn hàng ID: ${orderId}`,
    );
    return {
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công!',
    };
  }

  // 4. MOCK THANH TOÁN THỦ CÔNG
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
