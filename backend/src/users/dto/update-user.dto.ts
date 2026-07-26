import { IsOptional, IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  user_full_name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  user_email?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại không hợp lệ' })
  user_phone?: string;

  @IsOptional()
  @IsString()
  account_status?: string; // ACTIVE, LOCKED,...
}

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  @IsString()
  oldPassword!: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  newPassword!: string;
}