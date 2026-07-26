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
      province_name,
      district_name,
      ward_name,
      payment_method,
      items,
      note,
    } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // A. Lấy trạng thái đơn hàng ban đầu ('PENDING')
      const statuses = await queryRunner.query(
        `SELECT order_status_id FROM order_statuses WHERE order_status_code = 'PENDING' LIMIT 1`,
      );
      const initialStatusId = statuses[0]?.order_status_id || 1;

      // B. Tạo bản ghi đơn hàng trong 'orders'
      const orderCode = 'ESH' + Date.now();
      const orderResult = await queryRunner.query(
        `INSERT INTO orders (customer_id, order_code, order_status_id, order_note) 
         VALUES (?, ?, ?, ?)`,
        [userId || 1, orderCode, initialStatusId, note || null],
      );
      const orderId = orderResult.insertId;

      // C. Lưu địa chỉ giao hàng vào 'order_shipping_addresses'
      await queryRunner.query(
        `INSERT INTO order_shipping_addresses 
         (order_id, receiver_name, receiver_phone, shipping_province, shipping_district, shipping_ward, shipping_street) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          recipient_name || 'Khách hàng',
          recipient_phone || '0386960699',
          province_name || 'N/A',
          district_name || 'N/A',
          ward_name || 'N/A',
          shipping_address || 'Hà Nội',
        ],
      );

      // Lấy loại giao dịch kho 'OUT' (Xuất kho)
      const outType = await queryRunner.query(
        `SELECT inventory_type_id FROM inventory_transaction_types WHERE inventory_type_code = 'OUT' LIMIT 1`,
      );
      const outTypeId = outType[0]?.inventory_type_id || 2;

      let totalCalculatedAmount = 0;

      // D. Duyệt danh sách mặt hàng, kiểm tra tồn kho và chèn 'order_items'
      for (const item of items) {
        const variantId = item.variant_id || 130;
        const qty = Number(item.quantity) || 1;

        const variants = await queryRunner.query(
          `SELECT pv.variant_id, pv.product_id, pv.additional_price, p.base_price, p.product_name,
                  COALESCE(vi.stock_quantity, 100) as stock_quantity
           FROM product_variants pv 
           JOIN products p ON p.product_id = pv.product_id 
           LEFT JOIN variant_inventory vi ON vi.variant_id = pv.variant_id
           WHERE pv.variant_id = ? LIMIT 1`,
          [variantId],
        );

        const variant = variants[0];
        if (!variant) {
          throw new BadRequestException(
            `Không tìm thấy biến thể sản phẩm ID ${variantId}`,
          );
        }

        if (variant.stock_quantity < qty) {
          throw new BadRequestException(
            `Sản phẩm "${variant.product_name}" không đủ số lượng tồn kho`,
          );
        }

        const unitPrice =
          Number(variant.base_price) + Number(variant.additional_price);
        const itemTotal = unitPrice * qty;
        totalCalculatedAmount += itemTotal;

        // Lưu vào order_items
        await queryRunner.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, ordered_quantity, unit_price_at_order) 
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, variant.product_id, variantId, qty, unitPrice],
        );

        // Trừ tồn kho trong bảng variant_inventory (tự khởi tạo nếu bản ghi chưa có)
        await queryRunner.query(
          `INSERT INTO variant_inventory (variant_id, stock_quantity, reserved_quantity)
           VALUES (?, GREATEST(0, 100 - ?), 0)
           ON DUPLICATE KEY UPDATE stock_quantity = GREATEST(0, stock_quantity - ?)`,
          [variantId, qty, qty],
        );

        // Ghi nhận lịch sử xuất kho trong inventory_transactions
        await queryRunner.query(
          `INSERT INTO inventory_transactions 
           (product_id, variant_id, staff_user_id, inventory_type_id, transaction_quantity, unit_cost, transaction_note) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            variant.product_id,
            variantId,
            userId || 1,
            outTypeId,
            qty,
            unitPrice,
            `Xuất kho bán hàng cho đơn ${orderCode}`,
          ],
        );
      }

      // E. Khởi tạo phương thức & trạng thái thanh toán ('UNPAID')
      const pMethods = await queryRunner.query(
        `SELECT payment_method_id FROM payment_methods WHERE payment_method_code = ? LIMIT 1`,
        [payment_method || 'COD'],
      );
      const pStatuses = await queryRunner.query(
        `SELECT payment_status_id FROM payment_statuses WHERE payment_status_code = 'UNPAID' LIMIT 1`,
      );

      const paymentMethodId = pMethods[0]?.payment_method_id || 1;
      const paymentStatusId = pStatuses[0]?.payment_status_id || 1;

      // Lưu vào bảng payments
      await queryRunner.query(
        `INSERT INTO payments (order_id, payment_method_id, payment_status_id, payment_code, payment_amount) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          paymentMethodId,
          paymentStatusId,
          `PAY-${orderCode}`,
          totalCalculatedAmount,
        ],
      );

      // Ghi log trạng thái đơn hàng ban đầu
      await queryRunner.query(
        `INSERT INTO order_status_logs (order_id, new_order_status_id, changed_by_user_id, status_note) 
         VALUES (?, ?, ?, 'Khách hàng đặt hàng thành công')`,
        [orderId, initialStatusId, userId || 1],
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Đặt hàng thành công',
        order: {
          order_id: orderId,
          order_code: orderCode,
          total_amount: totalCalculatedAmount,
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

  // 2. LẤY DANH SÁCH ĐƠN HÀNG DỰA TRÊN CUSTOMER_ID
  async getMyOrders(userId: number) {
    const orders = await this.dataSource.query(
      `SELECT o.order_id, o.order_code, o.order_created_at, 
              os.order_status_name, os.order_status_code,
              pm.payment_method_name, ps.payment_status_code,
              COALESCE(SUM(oi.ordered_quantity * oi.unit_price_at_order), 0) AS total_amount
       FROM orders o
       JOIN order_statuses os ON os.order_status_id = o.order_status_id
       LEFT JOIN order_items oi ON oi.order_id = o.order_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       LEFT JOIN payment_methods pm ON pm.payment_method_id = p.payment_method_id
       LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id
       WHERE o.customer_id = ? 
       GROUP BY o.order_id, o.order_code, o.order_created_at, os.order_status_name, os.order_status_code, pm.payment_method_name, ps.payment_status_code
       ORDER BY o.order_created_at DESC`,
      [userId],
    );

    return { success: true, data: orders };
  }

  // 3. XEM CHI TIẾT ĐƠN HÀNG
  async getOrderDetail(userId: number, orderId: number) {
    const orders = await this.dataSource.query(
      `SELECT o.order_id, o.order_code, o.order_note, o.order_created_at, 
              os.order_status_name, os.order_status_code, 
              sa.receiver_name, sa.receiver_phone, sa.shipping_province, sa.shipping_district, sa.shipping_ward, sa.shipping_street,
              pm.payment_method_name, ps.payment_status_code,
              COALESCE(SUM(oi.ordered_quantity * oi.unit_price_at_order), 0) AS total_amount
       FROM orders o
       JOIN order_statuses os ON os.order_status_id = o.order_status_id
       LEFT JOIN order_items oi ON oi.order_id = o.order_id
       LEFT JOIN order_shipping_addresses sa ON sa.order_id = o.order_id
       LEFT JOIN payments p ON p.order_id = o.order_id
       LEFT JOIN payment_methods pm ON pm.payment_method_id = p.payment_method_id
       LEFT JOIN payment_statuses ps ON ps.payment_status_id = p.payment_status_id
       WHERE o.order_id = ? AND o.customer_id = ? 
       GROUP BY o.order_id LIMIT 1`,
      [orderId, userId],
    );

    const order = orders[0];
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const items = await this.dataSource.query(
      `SELECT oi.product_id, oi.variant_id, oi.ordered_quantity, oi.unit_price_at_order,
              p.product_name, pv.variant_name,
              (oi.ordered_quantity * oi.unit_price_at_order) AS subtotal
       FROM order_items oi
       LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`,
      [orderId],
    );

    return { success: true, data: { ...order, items } };
  }

  // 4. HỦY ĐƠN HÀNG VÀ HOÀN LẠI TỒN KHO
  async cancelOrder(userId: number, orderId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orders = await queryRunner.query(
        `SELECT o.order_id, os.order_status_code 
         FROM orders o
         JOIN order_statuses os ON os.order_status_id = o.order_status_id
         WHERE o.order_id = ? AND o.customer_id = ? LIMIT 1`,
        [orderId, userId],
      );

      const order = orders[0];
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (order.order_status_code !== 'PENDING') {
        throw new BadRequestException(
          'Chỉ có thể hủy đơn hàng đang ở trạng thái Chờ xử lý (PENDING)',
        );
      }

      const cancelStatuses = await queryRunner.query(
        `SELECT order_status_id FROM order_statuses WHERE order_status_code = 'CANCELLED' LIMIT 1`,
      );
      const cancelledStatusId = cancelStatuses[0].order_status_id;

      // Cập nhật trạng thái đơn thành CANCELLED
      await queryRunner.query(
        `UPDATE orders SET order_status_id = ? WHERE order_id = ?`,
        [cancelledStatusId, orderId],
      );

      // Lấy danh sách item để hoàn tồn kho
      const items = await queryRunner.query(
        `SELECT product_id, variant_id, ordered_quantity FROM order_items WHERE order_id = ?`,
        [orderId],
      );

      const returnType = await queryRunner.query(
        `SELECT inventory_type_id FROM inventory_transaction_types WHERE inventory_type_code = 'RETURN' LIMIT 1`,
      );
      const returnTypeId = returnType[0]?.inventory_type_id || 4;

      for (const item of items) {
        if (item.variant_id) {
          // Hoàn kho
          await queryRunner.query(
            `UPDATE variant_inventory SET stock_quantity = stock_quantity + ? WHERE variant_id = ?`,
            [item.ordered_quantity, item.variant_id],
          );

          // Ghi nhận lịch sử hoàn kho
          await queryRunner.query(
            `INSERT INTO inventory_transactions 
             (product_id, variant_id, staff_user_id, inventory_type_id, transaction_quantity, transaction_note) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              item.product_id,
              item.variant_id,
              userId,
              returnTypeId,
              item.ordered_quantity,
              `Hoàn kho do hủy đơn hàng ID ${orderId}`,
            ],
          );
        }
      }

      await queryRunner.commitTransaction();
      return {
        success: true,
        message: 'Hủy đơn hàng và hoàn tồn kho thành công',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
