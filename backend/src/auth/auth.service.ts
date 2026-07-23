import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { name, password } = createUserDto;
    const email = createUserDto.email.trim().toLowerCase();

    // Check if user already exists
    const existingUsers = await this.dataSource.query(
      `SELECT user_id FROM users WHERE user_email = ? LIMIT 1`, [email],
    );

    if (existingUsers[0]) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Public registration is ALWAYS a customer. Never trust a role from the client
    // and never rely on auto-increment ids because seed order may change.
    const customerRoles = await this.dataSource.query(
      `SELECT role_id FROM roles WHERE role_code = 'CUSTOMER' LIMIT 1`,
    );
    if (!customerRoles[0]) {
      throw new BadRequestException('Customer role is not configured');
    }
    const result = await this.dataSource.query(
      `INSERT INTO users
       (role_id, user_full_name, user_email, user_phone, password_hash, account_status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [customerRoles[0].role_id, name, email, createUserDto.phone || null, hashedPassword],
    );
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

  async login(email: string, password: string) {
    email = email.trim().toLowerCase();
    const now = Date.now();
    const attempt = this.attempts.get(email);
    if (attempt && attempt.resetAt > now && attempt.count >= 5) {
      throw new UnauthorizedException('Too many attempts. Try again in 15 minutes');
    }
    // Find user by email
    const users = await this.dataSource.query(
      `SELECT user_id, role_id, user_full_name, user_email, password_hash, account_status
       FROM users WHERE user_email = ? LIMIT 1`, [email],
    );
    const user = users[0];

    if (!user) {
      this.recordFailure(email, now);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.account_status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      this.recordFailure(email, now);
      await this.logLogin(user.user_id, 'FAILED');
      throw new UnauthorizedException('Invalid email or password');
    }

    this.attempts.delete(email);
    await this.logLogin(user.user_id, 'SUCCESS');

    const roleRows = await this.dataSource.query(
      `SELECT r.role_code, COALESCE(JSON_ARRAYAGG(p.permission_code), JSON_ARRAY()) permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.role_id
       LEFT JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE r.role_id = ? GROUP BY r.role_id, r.role_code`,
      [user.role_id],
    );
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

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private recordFailure(email: string, now: number) {
    const current = this.attempts.get(email);
    this.attempts.set(email, current && current.resetAt > now
      ? { ...current, count: current.count + 1 }
      : { count: 1, resetAt: now + 15 * 60 * 1000 });
  }

  private async logLogin(userId: number, status: string) {
    await this.dataSource.query(
      `INSERT INTO login_logs(user_id, login_status) VALUES(?, ?)`, [userId, status],
    );
    await this.dataSource.query(
      `INSERT INTO audit_logs(actor_user_id, action_name, affected_table_name, affected_record_id, action_description)
       VALUES(?, ?, 'users', ?, ?)`,
      [userId, status === 'SUCCESS' ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED', userId, JSON.stringify({ status })],
    );
  }
}
