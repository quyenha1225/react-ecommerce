import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    saveCart(body: {
        userId: number;
        items: any[];
    }): Promise<{
        success: boolean;
        message: string;
        userId: number;
        itemsCount: number;
    }>;
    getCart(req: any): Promise<{
        success: boolean;
        items: never[];
    }>;
}
