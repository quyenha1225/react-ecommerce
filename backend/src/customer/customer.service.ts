import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AddressDto, ChangePasswordDto, CreateOrderDto, UpdateProfileDto } from './customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly db: DataSource) {}

  async me(userId: number) {
    const rows = await this.db.query(`SELECT u.user_id id,u.user_full_name name,u.user_email email,u.user_phone phone,u.created_at createdAt,r.role_code role,
      (SELECT COUNT(*) FROM orders o WHERE o.customer_id=u.user_id) orderCount,
      (SELECT COALESCE(SUM(p.payment_amount),0) FROM orders o JOIN payments p ON p.order_id=o.order_id JOIN payment_statuses ps ON ps.payment_status_id=p.payment_status_id WHERE o.customer_id=u.user_id AND ps.payment_status_code='PAID') totalSpent
      FROM users u JOIN roles r ON r.role_id=u.role_id WHERE u.user_id=?`, [userId]);
    if (!rows[0]) throw new NotFoundException('Không tìm thấy tài khoản');
    return rows[0];
  }

  async updateProfile(userId: number, body: UpdateProfileDto) {
    try {
      await this.db.query(`UPDATE users SET user_full_name=?,user_email=?,user_phone=? WHERE user_id=?`, [body.name.trim(), body.email.trim().toLowerCase(), body.phone?.trim() || null, userId]);
      return this.me(userId);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') throw new BadRequestException('Email hoặc số điện thoại đã được sử dụng');
      throw error;
    }
  }

  async changePassword(userId: number, body: ChangePasswordDto) {
    const rows = await this.db.query(`SELECT password_hash FROM users WHERE user_id=?`, [userId]);
    if (!rows[0] || !await bcrypt.compare(body.currentPassword, rows[0].password_hash)) throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    if (await bcrypt.compare(body.newPassword, rows[0].password_hash)) throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    await this.db.query(`UPDATE users SET password_hash=? WHERE user_id=?`, [await bcrypt.hash(body.newPassword, 12), userId]);
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  addresses(userId: number) {
    return this.db.query(`SELECT address_id id,receiver_name receiverName,receiver_phone receiverPhone,province_name province,district_name district,ward_name ward,street_address street,is_default isDefault FROM user_addresses WHERE user_id=? ORDER BY is_default DESC,address_id DESC`, [userId]);
  }

  async saveAddress(userId: number, id: number | null, body: AddressDto) {
    const runner = this.db.createQueryRunner(); await runner.connect(); await runner.startTransaction();
    try {
      if (body.isDefault) await runner.query(`UPDATE user_addresses SET is_default=FALSE WHERE user_id=?`, [userId]);
      if (id) {
        const result = await runner.query(`UPDATE user_addresses SET receiver_name=?,receiver_phone=?,province_name=?,district_name=?,ward_name=?,street_address=?,is_default=? WHERE address_id=? AND user_id=?`, [body.receiverName, body.receiverPhone, body.province, body.district, body.ward, body.street, Boolean(body.isDefault), id, userId]);
        if (!result.affectedRows) throw new NotFoundException('Không tìm thấy địa chỉ');
      } else {
        const count = await runner.query(`SELECT COUNT(*) total FROM user_addresses WHERE user_id=?`, [userId]);
        await runner.query(`INSERT INTO user_addresses(user_id,receiver_name,receiver_phone,province_name,district_name,ward_name,street_address,is_default) VALUES(?,?,?,?,?,?,?,?)`, [userId, body.receiverName, body.receiverPhone, body.province, body.district, body.ward, body.street, Boolean(body.isDefault) || Number(count[0].total) === 0]);
      }
      await runner.commitTransaction(); return this.addresses(userId);
    } catch (error) { await runner.rollbackTransaction(); throw error; } finally { await runner.release(); }
  }

  async deleteAddress(userId: number, id: number) {
    const result = await this.db.query(`DELETE FROM user_addresses WHERE address_id=? AND user_id=?`, [id, userId]);
    if (!result.affectedRows) throw new NotFoundException('Không tìm thấy địa chỉ');
    return { success: true };
  }

  orders(userId: number) {
    return this.db.query(`SELECT o.order_id id,o.order_code code,os.order_status_code status,os.order_status_name statusName,o.order_created_at createdAt,
      COUNT(oi.product_id) itemTypes,COALESCE(SUM(oi.ordered_quantity),0) itemCount,COALESCE(SUM(oi.ordered_quantity*oi.final_unit_price),0) total,
      pm.payment_method_code paymentMethod,pm.payment_method_name paymentMethodName,ps.payment_status_code paymentStatus,ps.payment_status_name paymentStatusName
      FROM orders o JOIN order_statuses os ON os.order_status_id=o.order_status_id LEFT JOIN order_items oi ON oi.order_id=o.order_id
      LEFT JOIN payments p ON p.order_id=o.order_id LEFT JOIN payment_methods pm ON pm.payment_method_id=p.payment_method_id LEFT JOIN payment_statuses ps ON ps.payment_status_id=p.payment_status_id
      WHERE o.customer_id=? GROUP BY o.order_id,o.order_code,os.order_status_code,os.order_status_name,o.order_created_at,pm.payment_method_code,pm.payment_method_name,ps.payment_status_code,ps.payment_status_name ORDER BY o.order_created_at DESC`, [userId]);
  }

  async order(userId: number, id: number) {
    const rows = await this.db.query(`SELECT o.order_id id,o.order_code code,o.order_note note,o.order_created_at createdAt,os.order_status_code status,os.order_status_name statusName,
      osa.receiver_name receiverName,osa.receiver_phone receiverPhone,osa.shipping_province province,osa.shipping_district district,osa.shipping_ward ward,osa.shipping_street street,
      p.payment_amount total,pm.payment_method_name paymentMethodName,ps.payment_status_code paymentStatus,ps.payment_status_name paymentStatusName,p.transaction_code transactionCode,p.paid_at paidAt
      FROM orders o JOIN order_statuses os ON os.order_status_id=o.order_status_id LEFT JOIN order_shipping_addresses osa ON osa.order_id=o.order_id LEFT JOIN payments p ON p.order_id=o.order_id LEFT JOIN payment_methods pm ON pm.payment_method_id=p.payment_method_id LEFT JOIN payment_statuses ps ON ps.payment_status_id=p.payment_status_id WHERE o.order_id=? AND o.customer_id=?`, [id, userId]);
    if (!rows[0]) throw new NotFoundException('Không tìm thấy đơn hàng');
    const [items, timeline] = await Promise.all([
      this.db.query(`SELECT oi.product_id productId,p.product_slug slug,p.product_name name,pi.image_url image,oi.ordered_quantity quantity,oi.final_unit_price unitPrice,(oi.ordered_quantity*oi.final_unit_price) lineTotal,pv.variant_name variantName FROM order_items oi JOIN products p ON p.product_id=oi.product_id LEFT JOIN product_variants pv ON pv.variant_id=oi.variant_id LEFT JOIN product_images pi ON pi.product_id=p.product_id AND pi.is_thumbnail=TRUE WHERE oi.order_id=?`, [id]),
      this.db.query(`SELECT os.order_status_code status,os.order_status_name statusName,l.status_note note,l.changed_at changedAt FROM order_status_logs l JOIN order_statuses os ON os.order_status_id=l.new_order_status_id WHERE l.order_id=? ORDER BY l.changed_at`, [id]),
    ]);
    return { ...rows[0], items, timeline };
  }

  async createOrder(userId: number, body: CreateOrderDto) {
    if (!body.items?.length || body.items.length > 100) throw new BadRequestException('Giỏ hàng không hợp lệ');
    const runner = this.db.createQueryRunner(); await runner.connect(); await runner.startTransaction();
    try {
      const status = await runner.query(`SELECT order_status_id FROM order_statuses WHERE order_status_code='PENDING'`);
      const method = await runner.query(`SELECT payment_method_id FROM payment_methods WHERE payment_method_code=?`, [body.paymentMethod]);
      const paymentStatus = await runner.query(`SELECT payment_status_id FROM payment_statuses WHERE payment_status_code=?`, [body.paymentMethod === 'COD' ? 'UNPAID' : 'PENDING']);
      if (!status[0] || !method[0] || !paymentStatus[0]) throw new BadRequestException('Cấu hình trạng thái đơn hàng chưa đầy đủ');
      const code = `ESH${Date.now()}${Math.floor(Math.random()*90+10)}`;
      const inserted = await runner.query(`INSERT INTO orders(order_code,customer_id,order_status_id,order_note) VALUES(?,?,?,?)`, [code, userId, status[0].order_status_id, body.note || null]);
      const orderId = inserted.insertId; let total = 0;
      for (const item of body.items) {
        const products = await runner.query(`SELECT p.product_id,p.base_price,p.product_status,v.variant_id,COALESCE(v.additional_price,0) extra,COALESCE(s.available_quantity,0) stock FROM products p JOIN product_variants v ON v.product_id=p.product_id AND v.variant_status='ACTIVE' AND (? IS NULL OR v.variant_id=?) LEFT JOIN vw_product_stock s ON s.variant_id=v.variant_id WHERE p.product_id=? ORDER BY v.is_default DESC,v.variant_id LIMIT 1`, [item.variantId || null, item.variantId || null, item.productId]);
        const product = products[0];
        if (!product || product.product_status !== 'ACTIVE') throw new BadRequestException(`Sản phẩm ${item.productId} không còn bán`);
        if (Number(product.stock) < item.quantity) throw new BadRequestException(`Sản phẩm ${item.productId} không đủ tồn kho`);
        const price = Number(product.base_price) + Number(product.extra); total += price * item.quantity;
        await runner.query(`INSERT INTO order_items(order_id,product_id,variant_id,ordered_quantity,unit_price_at_order,discount_amount_at_order,final_unit_price) VALUES(?,?,?,?,?,0,?)`, [orderId, item.productId, product.variant_id, item.quantity, price, price]);
      }
      const a = body.shipping;
      await runner.query(`INSERT INTO order_shipping_addresses(order_id,receiver_name,receiver_phone,shipping_province,shipping_district,shipping_ward,shipping_street) VALUES(?,?,?,?,?,?,?)`, [orderId,a.receiverName,a.receiverPhone,a.province,a.district,a.ward,a.street]);
      await runner.query(`INSERT INTO payments(order_id,payment_method_id,payment_status_id,payment_code,payment_amount,qr_content) VALUES(?,?,?,?,?,?)`, [orderId,method[0].payment_method_id,paymentStatus[0].payment_status_id,`PAY-${code}`,total,body.paymentMethod==='QR_BANKING'?code:null]);
      await runner.query(`INSERT INTO order_status_logs(order_id,new_order_status_id,status_note) VALUES(?,?,?)`, [orderId,status[0].order_status_id,'Khách hàng đã đặt đơn']);
      await runner.commitTransaction(); return this.order(userId, orderId);
    } catch (error) { await runner.rollbackTransaction(); throw error; } finally { await runner.release(); }
  }

  async cancelOrder(userId: number, id: number) {
    const rows = await this.db.query(`SELECT o.order_status_id,os.order_status_code FROM orders o JOIN order_statuses os ON os.order_status_id=o.order_status_id WHERE o.order_id=? AND o.customer_id=?`, [id,userId]);
    if (!rows[0]) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (!['PENDING','CONFIRMED'].includes(rows[0].order_status_code)) throw new ForbiddenException('Đơn hàng ở trạng thái này không thể hủy');
    const cancelled = await this.db.query(`SELECT order_status_id FROM order_statuses WHERE order_status_code='CANCELLED'`);
    await this.db.query(`UPDATE orders SET order_status_id=? WHERE order_id=?`, [cancelled[0].order_status_id,id]);
    await this.db.query(`INSERT INTO order_status_logs(order_id,old_order_status_id,new_order_status_id,status_note) VALUES(?,?,?,'Khách hàng yêu cầu hủy')`, [id,rows[0].order_status_id,cancelled[0].order_status_id]);
    return this.order(userId,id);
  }

  async confirmPayment(userId: number, id: number) {
    const rows = await this.db.query(`SELECT o.order_status_id,os.order_status_code,p.payment_id,pm.payment_method_code,ps.payment_status_code FROM orders o JOIN order_statuses os ON os.order_status_id=o.order_status_id JOIN payments p ON p.order_id=o.order_id JOIN payment_methods pm ON pm.payment_method_id=p.payment_method_id JOIN payment_statuses ps ON ps.payment_status_id=p.payment_status_id WHERE o.order_id=? AND o.customer_id=?`, [id,userId]);
    const current=rows[0];
    if(!current) throw new NotFoundException('Không tìm thấy đơn hàng');
    if(current.payment_method_code!=='QR_BANKING') throw new BadRequestException('Đơn hàng không sử dụng thanh toán QR');
    if(current.payment_status_code==='PAID') return this.order(userId,id);
    if(['CANCELLED','RETURNED'].includes(current.order_status_code)) throw new BadRequestException('Đơn hàng đã kết thúc');
    const [paid,confirmed]=await Promise.all([this.db.query(`SELECT payment_status_id FROM payment_statuses WHERE payment_status_code='PAID'`),this.db.query(`SELECT order_status_id FROM order_statuses WHERE order_status_code='CONFIRMED'`)]);
    await this.db.query(`UPDATE payments SET payment_status_id=?,paid_at=NOW(),transaction_code=? WHERE payment_id=?`,[paid[0].payment_status_id,`DEMO-${Date.now()}`,current.payment_id]);
    if(current.order_status_code==='PENDING'){
      await this.db.query(`UPDATE orders SET order_status_id=? WHERE order_id=?`,[confirmed[0].order_status_id,id]);
      await this.db.query(`INSERT INTO order_status_logs(order_id,old_order_status_id,new_order_status_id,status_note) VALUES(?,?,?,'Đã ghi nhận thanh toán QR')`,[id,current.order_status_id,confirmed[0].order_status_id]);
    }
    return this.order(userId,id);
  }
}
