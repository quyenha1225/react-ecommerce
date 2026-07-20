import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getAllProducts(): Promise<any>;
    getProductDetail(id: string): Promise<any>;
    logProductView(body: {
        userId: number;
        productId: number;
    }): Promise<any>;
    getRecommendations(id: string): Promise<any>;
    getProductReviews(id: string): Promise<any>;
    createProductReview(id: string, body: {
        userId: number;
        rating: number;
        title?: string;
        content?: string;
        orderId?: number;
    }): Promise<{
        insertId: any;
    }>;
}
