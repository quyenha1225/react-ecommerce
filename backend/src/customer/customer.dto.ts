import { IsArray, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsString() @MinLength(2) @MaxLength(150) name: string;
  @IsEmail() @MaxLength(150) email: string;
  @IsOptional() @Matches(/^(0|\+84)\d{9,10}$/) phone?: string;
}

export class ChangePasswordDto {
  @IsString() @MinLength(1) currentPassword: string;
  @IsString() @MinLength(10)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
  newPassword: string;
}

export class AddressDto {
  @IsString() @MinLength(2) @MaxLength(150) receiverName: string;
  @Matches(/^(0|\+84)\d{9,10}$/) receiverPhone: string;
  @IsString() @IsNotEmpty() @MaxLength(100) province: string;
  @IsString() @IsNotEmpty() @MaxLength(100) district: string;
  @IsString() @IsNotEmpty() @MaxLength(100) ward: string;
  @IsString() @IsNotEmpty() @MaxLength(255) street: string;
  @IsOptional() isDefault?: boolean;
}

export class CheckoutItemDto {
  @Type(() => Number) @IsInt() @Min(1) productId: number;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) variantId?: number;
}

export class CreateOrderDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => CheckoutItemDto) items: CheckoutItemDto[];
  @IsIn(['COD', 'QR_BANKING']) paymentMethod: 'COD' | 'QR_BANKING';
  @ValidateNested() @Type(() => AddressDto) shipping: AddressDto;
  @IsOptional() @IsString() @MaxLength(255) note?: string;
}
