import {
  Controller,
  Get,
  Post,
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
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user.id;
    return this.usersService.changePassword(userId, dto);
  }

  @Get('addresses')
  getAddresses(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.getAddresses(userId);
  }

  @Post('addresses')
  createAddress(@Req() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return this.usersService.createAddress(userId, dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
