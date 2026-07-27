import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // Yêu cầu đăng nhập token cho toàn bộ các API trong UsersController
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Lấy thông tin tài khoản đang đăng nhập: GET /api/users/me
  @Get('me')
  getProfile(@Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.findOne(userId);
  }

  // Cập nhật thông tin cá nhân: PATCH /api/users/me
  @Patch('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.updateProfile(userId, dto);
  }

  // Đổi mật khẩu: POST /api/users/change-password
  @Patch('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user.userId || req.user.sub;
    return this.usersService.changePassword(userId, dto);
  }

  // Lấy danh sách toàn bộ users (Dành cho Admin): GET /api/users
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Lấy chi tiết user theo ID: GET /api/users/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // Xóa user theo ID: DELETE /api/users/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
