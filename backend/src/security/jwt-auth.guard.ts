import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly db: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const value = request.headers.authorization || '';
    const [scheme, bearerToken] = value.split(' ');
    const cookies = String(request.headers.cookie || '').split(';').reduce((result, part) => {
      const index = part.indexOf('=');
      if (index > 0) result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
      return result;
    }, {} as Record<string, string>);
    const token = scheme === 'Bearer' ? bearerToken : cookies.eshop_auth;
    if (!token) throw new UnauthorizedException('Authentication required');
    try {
      const payload = this.jwt.verify(token);
      const rows = await this.db.query(
        `SELECT u.user_id, u.user_full_name, u.user_email, u.user_phone, u.account_status, r.role_code,
          COALESCE(JSON_ARRAYAGG(p.permission_code), JSON_ARRAY()) permissions
         FROM users u JOIN roles r ON r.role_id=u.role_id
         LEFT JOIN role_permissions rp ON rp.role_id=r.role_id
         LEFT JOIN permissions p ON p.permission_id=rp.permission_id
         WHERE u.user_id=? GROUP BY u.user_id,u.user_full_name,u.user_email,u.user_phone,u.account_status,r.role_code`, [payload.id],
      );
      const row = rows[0];
      if (!row || row.account_status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');
      request.user = {
        id: Number(row.user_id), name: row.user_full_name, fullName: row.user_full_name,
        email: row.user_email, phone: row.user_phone, role: row.role_code,
        permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
