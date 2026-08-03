"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findAll() {
        const users = await this.dataSource.query(`SELECT u.user_id, u.user_full_name, u.user_email, u.user_phone, u.account_status, u.created_at, r.role_name, r.role_code 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       ORDER BY u.user_id DESC`);
        return { success: true, data: users };
    }
    async findOne(id) {
        const users = await this.dataSource.query(`SELECT u.user_id, u.user_full_name, u.user_email, u.user_phone, u.account_status, u.created_at, r.role_name, r.role_code 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = ? LIMIT 1`, [id]);
        if (!users[0]) {
            throw new common_1.NotFoundException(`Không tìm thấy người dùng có ID ${id}`);
        }
        return { success: true, data: users[0] };
    }
    async updateProfile(userId, dto) {
        await this.findOne(userId);
        const updates = [];
        const values = [];
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
        await this.dataSource.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);
        return { success: true, message: 'Cập nhật thông tin thành công' };
    }
    async changePassword(userId, dto) {
        const rows = await this.dataSource.query(`SELECT password_hash FROM users WHERE user_id = ? LIMIT 1`, [userId]);
        if (!rows[0]) {
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        }
        const isMatch = await bcrypt.compare(dto.oldPassword, rows[0].password_hash);
        if (!isMatch) {
            throw new common_1.BadRequestException('Mật khẩu cũ không chính xác');
        }
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);
        await this.dataSource.query(`UPDATE users SET password_hash = ? WHERE user_id = ?`, [newPasswordHash, userId]);
        return { success: true, message: 'Đổi mật khẩu thành công' };
    }
    async remove(id) {
        await this.findOne(id);
        await this.dataSource.query(`DELETE FROM users WHERE user_id = ?`, [id]);
        return { success: true, message: 'Đã xóa người dùng thành công' };
    }
    async getAddresses(userId) {
        const addresses = await this.dataSource.query(`SELECT address_id, receiver_name, receiver_phone, province_name, district_name, ward_name, street_address, is_default 
       FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, address_id DESC`, [userId]);
        return { success: true, data: addresses };
    }
    async createAddress(userId, dto) {
        if (dto.is_default) {
            await this.dataSource.query(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?`, [userId]);
        }
        await this.dataSource.query(`INSERT INTO user_addresses (user_id, receiver_name, receiver_phone, province_name, district_name, ward_name, street_address, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId,
            dto.receiver_name,
            dto.receiver_phone,
            dto.province_name || 'Hà Nội',
            dto.district_name || 'N/A',
            dto.ward_name || 'N/A',
            dto.street_address,
            dto.is_default ? true : false,
        ]);
        return { success: true, message: 'Thêm địa chỉ thành công' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], UsersService);
//# sourceMappingURL=users.service.js.map