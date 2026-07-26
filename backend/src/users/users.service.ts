import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}

  // 1. LẤY DANH SÁCH TẤT CẢ NGƯỜI DÙNG (Dùng cho Admin)
  async findAll() {
    const users = await this.dataSource.query(
      `SELECT u.user_id, u.user_full_name, u.user_email, u.user_phone, u.account_status, u.created_at, r.role_name, r.role_code 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       ORDER BY u.user_id DESC`
    );
    return { success: true, data: users };
  }

  // 2. LẤY CHI TIẾT 1 NGƯỜI DÙNG THEO ID
  async findOne(id: number) {
    const users = await this.dataSource.query(
      `SELECT u.user_id, u.user_full_name, u.user_email, u.user_phone, u.account_status, u.created_at, r.role_name, r.role_code 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = ? LIMIT 1`,
      [id]
    );

    if (!users[0]) {
      throw new NotFoundException(`Không tìm thấy người dùng có ID ${id}`);
    }

    return { success: true, data: users[0] };
  }

  // 3. CẬP NHẬT THÔNG TIN CÁ NHÂN (GET/PATCH /api/users/me)
  async updateProfile(userId: number, dto: UpdateUserDto) {
    await this.findOne(userId);

    const updates: string[] = [];
    const values: any[] = [];

    if (dto.user_full_name) {
      updates.push('user_full_name = ?');
      values.push(dto.user_full_name);
    }
    if (dto.user_phone) {
      updates.push('user_phone = ?');
      values.push(dto.user_phone);
    }
    if (dto.user_email) {
      updates.push('user_email = ?');
      values.push(dto.user_email);
    }

    if (updates.length === 0) {
      return { success: true, message: 'Không có thông tin nào thay đổi' };
    }

    values.push(userId);
    await this.dataSource.query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    return { success: true, message: 'Cập nhật thông tin thành công' };
  }

  // 4. ĐỔI MẬT KHẨU CÁ NHÂN
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const rows = await this.dataSource.query(
      `SELECT password_hash FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (!rows[0]) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, rows[0].password_hash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.dataSource.query(
      `UPDATE users SET password_hash = ? WHERE user_id = ?`,
      [newPasswordHash, userId]
    );

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  // 5. XÓA HOẶC KHÓA TÀI KHOẢN (Admin)
  async remove(id: number) {
    await this.findOne(id);
    await this.dataSource.query(`DELETE FROM users WHERE user_id = ?`, [id]);
    return { success: true, message: 'Đã xóa người dùng thành công' };
  }
}