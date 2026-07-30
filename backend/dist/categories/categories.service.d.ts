import { DataSource } from 'typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoriesService {
    private dataSource;
    constructor(dataSource: DataSource);
    findAll(): Promise<{
        success: boolean;
        data: any;
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: any;
    }>;
    create(dto: CreateCategoryDto): Promise<{
        success: boolean;
        message: string;
        data: {
            category_slug: string;
            category_name: string;
            description?: string;
            parent_category_id?: number;
            category_id: any;
        };
    }>;
    update(id: number, dto: UpdateCategoryDto): Promise<{
        success: boolean;
        message: string;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
