import { DataSource } from 'typeorm';
export declare class CartService {
    private dataSource;
    constructor(dataSource: DataSource);
    saveCart(userId: number, cartItems: any[]): Promise<{
        success: boolean;
        message: string;
        userId: number;
        itemsCount: number;
    }>;
    getCart(userId: number): Promise<{
        success: boolean;
        items: never[];
    }>;
}
