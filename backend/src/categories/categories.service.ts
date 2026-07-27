import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private dataSource: DataSource) {}

  // 1. LẤY TẤT CẢ DANH MỤC (Bỏ cột description không tồn tại)
  async findAll() {
    const categories = await this.dataSource.query(
      `SELECT category_id, category_name, category_slug, parent_category_id 
       FROM categories 
       ORDER BY category_id DESC`,
    );
    return { success: true, data: categories };
  }

  // 2. LẤY CHI TIẾT 1 DANH MỤC THEO ID
  async findOne(id: number) {
    const categories = await this.dataSource.query(
      `SELECT category_id, category_name, category_slug, parent_category_id 
       FROM categories 
       WHERE category_id = ? LIMIT 1`,
      [id],
    );

    if (!categories[0]) {
      throw new NotFoundException(`Không tìm thấy danh mục có ID ${id}`);
    }

    return { success: true, data: categories[0] };
  }

  // 3. TẠO DANH MỤC MỚI
  async create(dto: CreateCategoryDto) {
    const slug =
      dto.category_slug ||
      dto.category_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/^-+|-+$/g, '');

    const result = await this.dataSource.query(
      `INSERT INTO categories (category_name, category_slug, parent_category_id) 
       VALUES (?, ?, ?)`,
      [dto.category_name, slug, dto.parent_category_id || null],
    );

    return {
      success: true,
      message: 'Tạo danh mục thành công',
      data: { category_id: result.insertId, ...dto, category_slug: slug },
    };
  }

  // 4. CẬP NHẬT DANH MỤC
  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id); // Check tồn tại

    const updates: string[] = [];
    const values: any[] = [];

    if (dto.category_name) {
      updates.push('category_name = ?');
      values.push(dto.category_name);
    }
    if (dto.parent_category_id !== undefined) {
      updates.push('parent_category_id = ?');
      values.push(dto.parent_category_id);
    }

    if (updates.length === 0) {
      return { success: true, message: 'Không có thay đổi nào' };
    }

    values.push(id);
    await this.dataSource.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE category_id = ?`,
      values,
    );

    return { success: true, message: 'Cập nhật danh mục thành công' };
  }

  // 5. XÓA DANH MỤC
  async remove(id: number) {
    await this.findOne(id);

    await this.dataSource.query(
      `DELETE FROM categories WHERE category_id = ?`,
      [id],
    );

    return { success: true, message: 'Đã xóa danh mục thành công' };
  }
}
