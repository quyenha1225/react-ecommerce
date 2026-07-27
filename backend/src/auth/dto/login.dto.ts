import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(150)
  email!: string; // Thêm dấu ! vào đây

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string; // Thêm dấu ! vào đây
}
