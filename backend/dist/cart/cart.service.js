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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let CartService = class CartService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async saveCart(userId, cartItems) {
        if (!Array.isArray(cartItems) || cartItems.length > 100)
            throw new common_1.BadRequestException('Invalid cart items');
        const runner = this.dataSource.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        try {
            await runner.query(`INSERT INTO carts(customer_id) VALUES(?) ON DUPLICATE KEY UPDATE customer_id=VALUES(customer_id)`, [userId]);
            const carts = await runner.query(`SELECT cart_id FROM carts WHERE customer_id=?`, [userId]);
            const cartId = carts[0].cart_id;
            await runner.query(`DELETE FROM cart_items WHERE cart_id=?`, [cartId]);
            for (const item of cartItems) {
                const productId = Number(item.productId || item.id), quantity = Number(item.quantity), variantId = item.variantId ? Number(item.variantId) : null;
                if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99)
                    throw new common_1.BadRequestException('Invalid cart item');
                await runner.query(`INSERT INTO cart_items(cart_id,product_id,variant_id,cart_quantity) VALUES(?,?,?,?)`, [cartId, productId, variantId, quantity]);
            }
            await runner.commitTransaction();
            return { success: true, itemsCount: cartItems.length };
        }
        catch (error) {
            await runner.rollbackTransaction();
            throw error;
        }
        finally {
            await runner.release();
        }
    }
    async getCart(userId) {
        const items = await this.dataSource.query(`SELECT ci.product_id AS productId,ci.variant_id AS variantId,ci.cart_quantity AS quantity,
       p.product_name AS name,p.base_price+COALESCE(v.additional_price,0) AS price,pi.image_url
       FROM carts c JOIN cart_items ci ON ci.cart_id=c.cart_id JOIN products p ON p.product_id=ci.product_id
       LEFT JOIN product_variants v ON v.variant_id=ci.variant_id
       LEFT JOIN product_images pi ON pi.product_id=p.product_id AND pi.is_thumbnail=TRUE WHERE c.customer_id=?`, [userId]);
        return { success: true, items };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], CartService);
//# sourceMappingURL=cart.service.js.map