import { DataSource } from 'typeorm';
export declare class ProductsService {
    private dataSource;
    constructor(dataSource: DataSource);
    findAll(): Promise<any>;
    findOne(productId: number): Promise<any>;
    getRecommendedProducts(productId: number): Promise<any>;
    logView(userId: number, productId: number): Promise<any>;
    getReviews(productId: number): Promise<any>;
    createReview(productId: number, userId: number, rating: number, title: string, content: string, orderId?: number | null): Promise<{
        insertId: any;
    }>;
}
