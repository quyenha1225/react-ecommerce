import { IsNotEmpty, IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  name?: string; // Hỗ trợ auth.service.ts đang gọi .name

  @IsOptional()
  @IsString()
  user_full_name?: string; // Hỗ trợ database

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string; // Hỗ trợ auth.service.ts đang gọi .email

  @IsOptional()
  @IsEmail()
  user_email?: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string; // Hỗ trợ auth.service.ts đang gọi .phone

  @IsOptional()
  @IsString()
  user_phone?: string;
}