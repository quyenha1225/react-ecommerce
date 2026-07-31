import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getAllProducts(page?: string, limit?: string, category?: string, brand?: string, minPrice?: string, maxPrice?: string, search?: string): Promise<{
        success: boolean;
        data: any;
        pagination: {
            total: number;
            totalPages: number;
            currentPage: number;
            limit: number;
        };
    }>;
    getProductDetail(id: string): Promise<any>;
    logProductView(body: {
        productId: number;
    }, req: any): Promise<any>;
    getRecommendations(id: string): Promise<any>;
    getProductReviews(id: string): Promise<any>;
    createProductReview(id: string, body: {
        rating: number;
        title?: string;
        content?: string;
        orderId?: number;
    }, req: any): Promise<{
        insertId: any;
    }>;
}
