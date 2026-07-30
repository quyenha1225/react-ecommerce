import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module'; // <-- Import AuthModule chứa JwtService

@Module({
  imports: [AuthModule], // <-- Đưa vào đây
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
