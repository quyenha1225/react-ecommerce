import { IsNotEmpty, IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  variant_id!: number;

  @IsNotEmpty()
  @IsNumber()
  quantity!: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  recipient_name!: string;

  @IsNotEmpty()
  @IsString()
  recipient_phone!: string;

  @IsNotEmpty()
  @IsString()
  shipping_address!: string;

  @IsNotEmpty()
  @IsString()
  payment_method!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  note?: string;
}