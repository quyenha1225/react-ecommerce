import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private dataSource: DataSource) {}

  // 1. TẠO ĐƠN HÀNG MỚI (CHECKOUT)
  async checkout(userId: number, createOrderDto: CreateOrderDto) {
    const {
      recipient_name,
      recipient_phone,
      shipping_address,
      payment_method,
      items,
      note,
    } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống');
    }

    // Dùng QueryRunner để làm DB Transaction (Đảm bảo an toàn dữ liệu)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Lấy order_status_id ban đầu ('PENDING')
      const statuses = await queryRunner.query(
        `SELECT order_status_id FROM order_statuses WHERE order_status_code = 'PENDING' LIMIT 1`,
      );
      const initialStatusId = statuses[0]?.order_status_id || 1;

      // 2. Tính toán tổng tiền và kiểm tra số lượng tồn kho từng item
      let totalAmount = 0;
      const orderItemsToInsert: any[] = [];

      for (const item of items) {
        const variants = await queryRunner.query(
          `SELECT pv.variant_id, pv.additional_price, pv.stock_quantity, p.base_price, p.product_name 
           FROM product_variants pv 
           JOIN products p ON p.product_id = pv.product_id 
           WHERE pv.variant_id = ? LIMIT 1`,
          [item.variant_id],
        );

        const variant = variants[0];
        if (!variant) {
          throw new BadRequestException(
            `Không tìm thấy sản phẩm biến thể ID ${item.variant_id}`,
          );
        }

        if (variant.stock_quantity < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm ${variant.product_name} không đủ số lượng trong kho`,
          );
        }

        const unitPrice =
          Number(variant.base_price) + Number(variant.additional_price);
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;

        orderItemsToInsert.push({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: itemTotal,
        });

        // Trừ bớt số lượng tồn kho
        await queryRunner.query(
          `UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE variant_id = ?`,
          [item.quantity, item.variant_id],
        );
      }

      // 3. Tạo bản ghi đơn hàng orders
      const orderCode = 'ORD' + Date.now();
      const orderResult = await queryRunner.query(
        `INSERT INTO orders (user_id, order_code, order_status_id, total_amount, note) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, orderCode, initialStatusId, totalAmount, note || null],
      );
      const orderId = orderResult.insertId;

      // 4. Lưu danh sách sản phẩm order_items
      for (const orderItem of orderItemsToInsert) {
        await queryRunner.query(
          `INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            orderItem.variant_id,
            orderItem.quantity,
            orderItem.unit_price,
            orderItem.total_price,
          ],
        );
      }

      // 5. Lưu địa chỉ giao hàng order_shipping_addresses
      await queryRunner.query(
        `INSERT INTO order_shipping_addresses (order_id, recipient_name, recipient_phone, shipping_address) 
         VALUES (?, ?, ?, ?)`,
        [orderId, recipient_name, recipient_phone, shipping_address],
      );

      // 6. Lấy payment_method_id & payment_status_id ('UNPAID')
      const pMethods = await queryRunner.query(
        `SELECT payment_method_id FROM payment_methods WHERE payment_method_code = ? LIMIT 1`,
        [payment_method],
      );
      const pStatuses = await queryRunner.query(
        `SELECT payment_status_id FROM payment_statuses WHERE payment_status_code = 'UNPAID' LIMIT 1`,
      );

      const paymentMethodId = pMethods[0]?.payment_method_id || 1;
      const paymentStatusId = pStatuses[0]?.payment_status_id || 1;

      // 7. Tạo bản ghi thanh toán payments
      await queryRunner.query(
        `INSERT INTO payments (order_id, payment_method_id, payment_status_id, amount) 
         VALUES (?, ?, ?, ?)`,
        [orderId, paymentMethodId, paymentStatusId, totalAmount],
      );

      // Commit Transaction nếu mọi thứ thành công
      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Đặt hàng thành công',
        order: {
          order_id: orderId,
          order_code: orderCode,
          total_amount: totalAmount,
          payment_method,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA CÁ NHÂN (MY ORDERS)
  async getMyOrders(userId: number) {
    const orders = await this.dataSource.query(
      `SELECT o.order_id, o.order_code, o.total_amount, o.order_created_at, 
              os.status_name, os.order_status_code,
              pm.payment_method_name, ps.payment_status_code
       FROM orders o
       JOIN order_statuses os ON os.order_status_id = o.order_status_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       LEFT JOIN payment_methods pm ON pm.payment_method_id = p.payment_method_id
       LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id
       WHERE o.user_id = ? 
       ORDER BY o.order_created_at DESC`,
      [userId],
    );

    return { success: true, data: orders };
  }

  // 3. XEM CHI TIẾT 1 ĐƠN HÀNG
  async getOrderDetail(userId: number, orderId: number) {
    const orders = await this.dataSource.query(
      `SELECT o.*, os.status_name, os.order_status_code, 
              sa.recipient_name, sa.recipient_phone, sa.shipping_address,
              pm.payment_method_name, ps.payment_status_code
       FROM orders o
       JOIN order_statuses os ON os.order_status_id = o.order_status_id
       LEFT JOIN order_shipping_addresses sa ON sa.order_id = o.order_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       LEFT JOIN payment_methods pm ON pm.payment_method_id = p.payment_method_id
       LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id
       WHERE o.order_id = ? AND o.user_id = ? LIMIT 1`,
      [orderId, userId],
    );

    const order = orders[0];
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const items = await this.dataSource.query(
      `SELECT oi.*, p.product_name, pv.variant_name
       FROM order_items oi
       JOIN product_variants pv ON pv.variant_id = oi.variant_id
       JOIN products p ON p.product_id = pv.product_id
       WHERE oi.order_id = ?`,
      [orderId],
    );

    return { success: true, data: { ...order, items } };
  }

  // 4. HỦY ĐƠN HÀNG (Nếu đơn chưa được xác nhận/chưa giao)
  async cancelOrder(userId: number, orderId: number) {
    const orders = await this.dataSource.query(
      `SELECT o.order_id, os.order_status_code 
       FROM orders o
       JOIN order_statuses os ON os.order_status_id = o.order_status_id
       WHERE o.order_id = ? AND o.user_id = ? LIMIT 1`,
      [orderId, userId],
    );

    const order = orders[0];
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.order_status_code !== 'PENDING') {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn hàng đang ở trạng thái Chờ xử lý',
      );
    }

    const cancelStatuses = await this.dataSource.query(
      `SELECT order_status_id FROM order_statuses WHERE order_status_code = 'CANCELLED' LIMIT 1`,
    );

    await this.dataSource.query(
      `UPDATE orders SET order_status_id = ? WHERE order_id = ?`,
      [cancelStatuses[0].order_status_id, orderId],
    );

    return { success: true, message: 'Hủy đơn hàng thành công' };
  }
}
