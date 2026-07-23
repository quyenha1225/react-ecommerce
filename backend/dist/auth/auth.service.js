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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    jwtService;
    dataSource;
    attempts = new Map();
    constructor(jwtService, dataSource) {
        this.jwtService = jwtService;
        this.dataSource = dataSource;
    }
    async register(createUserDto) {
        const { name, password } = createUserDto;
        const email = createUserDto.email.trim().toLowerCase();
        const existingUsers = await this.dataSource.query(`SELECT user_id FROM users WHERE user_email = ? LIMIT 1`, [email]);
        if (existingUsers[0]) {
            throw new common_1.BadRequestException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const customerRoles = await this.dataSource.query(`SELECT role_id FROM roles WHERE role_code = 'CUSTOMER' LIMIT 1`);
        if (!customerRoles[0]) {
            throw new common_1.BadRequestException('Customer role is not configured');
        }
        const result = await this.dataSource.query(`INSERT INTO users
       (role_id, user_full_name, user_email, user_phone, password_hash, account_status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`, [customerRoles[0].role_id, name, email, createUserDto.phone || null, hashedPassword]);
        const userId = result.insertId;
        const role = 'CUSTOMER';
        const token = this.jwtService.sign({ id: userId, email, role });
        return {
            success: true,
            token,
            user: {
                id: userId,
                name,
                email, role,
            },
        };
    }
    async login(email, password) {
        email = email.trim().toLowerCase();
        const now = Date.now();
        const attempt = this.attempts.get(email);
        if (attempt && attempt.resetAt > now && attempt.count >= 5) {
            throw new common_1.UnauthorizedException('Too many attempts. Try again in 15 minutes');
        }
        const users = await this.dataSource.query(`SELECT user_id, role_id, user_full_name, user_email, password_hash, account_status
       FROM users WHERE user_email = ? LIMIT 1`, [email]);
        const user = users[0];
        if (!user) {
            this.recordFailure(email, now);
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.account_status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            this.recordFailure(email, now);
            await this.logLogin(user.user_id, 'FAILED');
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        this.attempts.delete(email);
        await this.logLogin(user.user_id, 'SUCCESS');
        const roleRows = await this.dataSource.query(`SELECT r.role_code, COALESCE(JSON_ARRAYAGG(p.permission_code), JSON_ARRAY()) permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.role_id
       LEFT JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE r.role_id = ? GROUP BY r.role_id, r.role_code`, [user.role_id]);
        const role = roleRows[0]?.role_code || 'CUSTOMER';
        const permissions = typeof roleRows[0]?.permissions === 'string'
            ? JSON.parse(roleRows[0].permissions) : (roleRows[0]?.permissions || []);
        const token = this.jwtService.sign({ id: user.user_id, email: user.user_email, role, permissions });
        return {
            success: true,
            token,
            user: {
                id: user.user_id,
                name: user.user_full_name,
                email: user.user_email, role, permissions,
            },
        };
    }
    async validateToken(token) {
        try {
            const decoded = this.jwtService.verify(token);
            return decoded;
        }
        catch (err) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    recordFailure(email, now) {
        const current = this.attempts.get(email);
        this.attempts.set(email, current && current.resetAt > now
            ? { ...current, count: current.count + 1 }
            : { count: 1, resetAt: now + 15 * 60 * 1000 });
    }
    async logLogin(userId, status) {
        await this.dataSource.query(`INSERT INTO login_logs(user_id, login_status) VALUES(?, ?)`, [userId, status]);
        await this.dataSource.query(`INSERT INTO audit_logs(actor_user_id, action_name, affected_table_name, affected_record_id, action_description)
       VALUES(?, ?, 'users', ?, ?)`, [userId, status === 'SUCCESS' ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED', userId, JSON.stringify({ status })]);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        typeorm_1.DataSource])
], AuthService);
//# sourceMappingURL=auth.service.js.map