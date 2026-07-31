import { DataSource } from 'typeorm';
export declare class ProductsService {
    private dataSource;
    constructor(dataSource: DataSource);
    findAll(query: {
        page?: string;
        limit?: string;
        category?: string;
        brand?: string;
        minPrice?: string;
        maxPrice?: string;
        search?: string;
    }): Promise<{
        success: boolean;
        data: any;
        pagination: {
            total: number;
            totalPages: number;
            currentPage: number;
            limit: number;
        };
    }>;
    findOne(identifier: string | number): Promise<any>;
    getRecommendedProducts(productId: number): Promise<any>;
    logView(userId: number, productId: number): Promise<any>;
    getReviews(productId: number): Promise<any>;
    createReview(productId: number, userId: number, rating: number, title: string, content: string, orderId: number): Promise<{
        insertId: any;
    }>;
}
