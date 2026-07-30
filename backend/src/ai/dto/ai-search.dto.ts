import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class AiSearchDto {
  @IsString()
  @Length(2, 180, { message: 'Nội dung tìm kiếm cần từ 2 đến 180 ký tự' })
  query!: string;

  @IsOptional()
  @IsBoolean()
  useAI?: boolean;
}
