"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let CategoriesService = class CategoriesService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findAll() {
        const categories = await this.dataSource.query(`SELECT category_id, category_name, category_slug, parent_category_id 
       FROM categories 
       ORDER BY category_id DESC`);
        return { success: true, data: categories };
    }
    async findOne(id) {
        const categories = await this.dataSource.query(`SELECT category_id, category_name, category_slug, parent_category_id 
       FROM categories 
       WHERE category_id = ? LIMIT 1`, [id]);
        if (!categories[0]) {
            throw new common_1.NotFoundException(`Không tìm thấy danh mục có ID ${id}`);
        }
        return { success: true, data: categories[0] };
    }
    async create(dto) {
        const slug = dto.category_slug ||
            dto.category_name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/([^0-9a-z-\s])/g, '')
                .replace(/(\s+)/g, '-')
                .replace(/^-+|-+$/g, '');
        const result = await this.dataSource.query(`INSERT INTO categories (category_name, category_slug, parent_category_id) 
       VALUES (?, ?, ?)`, [
            dto.category_name,
            slug,
            dto.parent_category_id || null,
        ]);
        return {
            success: true,
            message: 'Tạo danh mục thành công',
            data: { category_id: result.insertId, ...dto, category_slug: slug },
        };
    }
    async update(id, dto) {
        await this.findOne(id);
        const updates = [];
        const values = [];
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
        await this.dataSource.query(`UPDATE categories SET ${updates.join(', ')} WHERE category_id = ?`, values);
        return { success: true, message: 'Cập nhật danh mục thành công' };
    }
    async remove(id) {
        await this.findOne(id);
        await this.dataSource.query(`DELETE FROM categories WHERE category_id = ?`, [id]);
        return { success: true, message: 'Đã xóa danh mục thành công' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map