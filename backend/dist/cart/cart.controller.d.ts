import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    saveCart(body: {
        items: any[];
    }, req: any): Promise<{
        success: boolean;
        itemsCount: number;
    }>;
    getCart(req: any): Promise<{
        success: boolean;
        items: any;
    }>;
}
