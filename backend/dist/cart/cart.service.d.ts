import { DataSource } from 'typeorm';
export declare class CartService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    saveCart(userId: number, cartItems: any[]): Promise<{
        success: boolean;
        itemsCount: number;
    }>;
    getCart(userId: number): Promise<{
        success: boolean;
        items: any;
    }>;
}
