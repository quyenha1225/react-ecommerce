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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let ProductsService = class ProductsService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findAll() {
        const query = `
      SELECT 
        p.product_id AS id, 
        p.product_slug AS slug,
        p.product_name AS name, 
        p.base_price AS price, 
        c.category_slug AS category, 
        b.brand_name AS brand, 
        pi.image_url,
        0 AS percent_off,
        p.average_rating AS rating,
        p.review_count AS reviewCount
        ,COALESCE(bs.total_sold, 0) AS sold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_thumbnail = TRUE
      LEFT JOIN vw_best_selling_products bs ON bs.product_id = p.product_id
      WHERE p.product_status = 'ACTIVE'
    `;
        const products = await this.dataSource.query(query);
        return products;
    }
    async findOne(identifier) {
        const numericId = Number(identifier);
        const rows = await this.dataSource.query(`
      SELECT 
        p.product_id AS id, 
        p.product_name AS name, 
        p.product_description AS description,
        p.base_price AS price, 
        p.warranty_months AS warrantyMonths,
        c.category_name AS category, 
        b.brand_name AS brand, 
        pi.image_url,
        p.average_rating AS rating,
        p.review_count AS reviewCount,
        0 AS percent_off,
        COALESCE(vs.current_stock, 0) AS stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_thumbnail = TRUE
      LEFT JOIN vw_product_stock vs ON p.product_id = vs.product_id
      WHERE (p.product_id = ? OR p.product_slug = ?) AND p.product_status = 'ACTIVE'
      LIMIT 1
      `, [Number.isFinite(numericId) ? numericId : -1, String(identifier)]);
        const product = rows[0];
        if (!product)
            return null;
        const specifications = await this.dataSource.query(`
      SELECT 
        pa.attribute_id, 
        pa.attribute_name, 
        pa.attribute_unit, 
        pa.spec_group, 
        pa.display_order, 
        pa.is_highlight, 
        pav.attribute_value
      FROM product_attribute_values pav
      JOIN product_attributes pa ON pav.attribute_id = pa.attribute_id
      WHERE pav.product_id = ?
      ORDER BY pa.display_order ASC
      `, [product.id]);
        const variants = await this.dataSource.query(`
      SELECT 
        pv.variant_id, 
        pv.variant_name, 
        pv.sku, 
        pv.color, 
        pv.ram_size, 
        pv.storage_size, 
        pv.gpu_option, 
        pv.cpu_option, 
        pv.additional_price, 
        pv.is_default,
        COALESCE(vi.stock_quantity, 0) AS stock_quantity
      FROM product_variants pv
      LEFT JOIN variant_inventory vi ON pv.variant_id = vi.variant_id
      WHERE pv.product_id = ? AND pv.variant_status = 'ACTIVE'
      `, [product.id]);
        product.specifications = specifications;
        product.variants = variants;
        return product;
    }
    async getRecommendedProducts(productId) {
        return await this.dataSource.query(`
      SELECT p.product_id AS id, p.product_slug AS slug, p.product_name AS name, p.base_price AS price, pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_thumbnail = TRUE
      WHERE p.category_id=(SELECT category_id FROM products WHERE product_id=?)
        AND p.product_id<>? AND p.product_status='ACTIVE'
      ORDER BY p.created_at DESC LIMIT 4
    `, [productId, productId]);
    }
    async logView(userId, productId) {
        return await this.dataSource.query(`INSERT INTO user_view_history (user_id, product_id) VALUES (?, ?)`, [userId, productId]);
    }
    async getReviews(productId) {
        return await this.dataSource.query(`
      SELECT
        r.review_id AS id,
        r.rating,
        r.review_title AS title,
        r.review_content AS content,
        r.is_verified_purchase AS isVerifiedPurchase,
        r.helpful_count AS helpfulCount,
        r.created_at AS createdAt,
        u.user_full_name AS userName
      FROM product_reviews r
      JOIN users u ON u.user_id = r.user_id
      WHERE r.product_id = ? AND r.review_status = 'APPROVED'
      ORDER BY r.created_at DESC
      `, [productId]);
    }
    async createReview(productId, userId, rating, title, content, orderId = null) {
        if (rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('rating phai tu 1 den 5');
        }
        const result = await this.dataSource.query(`
      INSERT INTO product_reviews
        (product_id, user_id, order_id, rating, review_title, review_content, is_verified_purchase, review_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
      `, [productId, userId, orderId, rating, title, content, orderId !== null]);
        return { insertId: result.insertId };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], ProductsService);
//# sourceMappingURL=products.service.js.map