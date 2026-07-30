import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  category_name!: string;

  @IsOptional()
  @IsString()
  category_slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  parent_category_id?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  category_name?: string;

  @IsOptional()
  @IsString()
  category_slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  parent_category_id?: number;
}
