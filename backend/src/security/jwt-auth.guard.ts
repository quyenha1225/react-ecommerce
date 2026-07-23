import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly db: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const value = request.headers.authorization || '';
    const [scheme, token] = value.split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Authentication required');
    try {
      const payload = this.jwt.verify(token);
      const rows = await this.db.query(
        `SELECT u.user_id, u.user_email, u.account_status, r.role_code,
          COALESCE(JSON_ARRAYAGG(p.permission_code), JSON_ARRAY()) permissions
         FROM users u JOIN roles r ON r.role_id=u.role_id
         LEFT JOIN role_permissions rp ON rp.role_id=r.role_id
         LEFT JOIN permissions p ON p.permission_id=rp.permission_id
         WHERE u.user_id=? GROUP BY u.user_id,u.user_email,u.account_status,r.role_code`, [payload.id],
      );
      const row = rows[0];
      if (!row || row.account_status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');
      request.user = {
        id: Number(row.user_id), email: row.user_email, role: row.role_code,
        permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
