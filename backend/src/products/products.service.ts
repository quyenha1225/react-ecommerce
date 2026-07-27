import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(private dataSource: DataSource) {}

  // 1. LẤY DANH SÁCH TẤT CẢ SẢN PHẨM (ĐÃ BỔ SUNG ĐẦY ĐỦ THÔNG TIN CATEGORY & BRAND)
  async findAll() {
    const query = `
      SELECT 
        p.product_id AS id, 
        p.product_id,
        p.product_slug AS slug,
        p.product_slug AS category_slug,
        p.product_name AS name, 
        p.product_name,
        p.base_price AS price, 
        p.base_price,
        c.category_id,
        c.category_name,
        c.category_slug,
        c.category_slug AS category, 
        b.brand_id,
        b.brand_name AS brand, 
        b.brand_name,
        pi.image_url,
        0 AS percent_off,
        p.average_rating AS rating,
        p.review_count AS reviewCount,
        COALESCE(bs.total_sold, 0) AS sold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_thumbnail = TRUE
      LEFT JOIN vw_best_selling_products bs ON bs.product_id = p.product_id
      WHERE p.product_status = 'ACTIVE'
      ORDER BY p.product_id DESC
    `;

    const products = await this.dataSource.query(query);
    return products;
  }

  // 2. CHI TIẾT 1 SẢN PHẨM (ProductDetail.jsx)
  async findOne(identifier: string | number) {
    const numericId = Number(identifier);

    // Lấy thông tin cơ bản của sản phẩm
    const rows = await this.dataSource.query(
      `
      SELECT 
        p.product_id AS id, 
        p.product_slug AS slug,
        p.product_name AS name, 
        p.sku,
        p.barcode,
        p.manufacturer_part_number AS manufacturerPartNumber,
        p.release_year AS releaseYear,
        p.origin_country AS originCountry,
        p.product_description AS description,
        p.base_price AS price, 
        p.warranty_months AS warrantyMonths,
        c.category_id,
        c.category_name AS category, 
        c.category_slug,
        b.brand_name AS brand, 
        pi.image_url,
        p.average_rating AS rating,
        p.review_count AS reviewCount,
        0 AS percent_off,
        COALESCE(vs.available_quantity, 0) AS stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_thumbnail = TRUE
      LEFT JOIN (
        SELECT product_id, SUM(available_quantity) AS available_quantity
        FROM vw_product_stock GROUP BY product_id
      ) vs ON p.product_id = vs.product_id
      WHERE (p.product_id = ? OR p.product_slug = ?) AND p.product_status = 'ACTIVE'
      LIMIT 1
      `,
      [Number.isFinite(numericId) ? numericId : -1, String(identifier)],
    );

    const product = rows[0];
    if (!product) return null;

    const [specifications, variants, images, promotions, reviews] =
      await Promise.all([
        this.dataSource.query(
          `
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
      `,
          [product.id],
        ),

        this.dataSource.query(
          `
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
        COALESCE(vi.stock_quantity, 0) AS stock_quantity,
        COALESCE(vi.reserved_quantity, 0) AS reserved_quantity,
        COALESCE(vi.stock_quantity - vi.reserved_quantity, 0) AS available_quantity
      FROM product_variants pv
      LEFT JOIN variant_inventory vi ON pv.variant_id = vi.variant_id
      WHERE pv.product_id = ? AND pv.variant_status = 'ACTIVE'
      `,
          [product.id],
        ),

        this.dataSource.query(
          `SELECT image_id, image_url, is_thumbnail, sort_order
         FROM product_images WHERE product_id=?
         ORDER BY is_thumbnail DESC, sort_order, image_id`,
          [product.id],
        ),

        this.dataSource.query(
          `SELECT pr.promotion_code,pr.promotion_name,pr.discount_type,
                pr.discount_value,pr.max_discount_amount,pr.end_at
         FROM promotions pr
         JOIN promotion_products pp ON pp.promotion_id=pr.promotion_id
         WHERE pp.product_id=? AND pr.promotion_status='ACTIVE'
           AND NOW() BETWEEN pr.start_at AND pr.end_at
         ORDER BY pr.discount_value DESC`,
          [product.id],
        ),

        this.getReviews(product.id),
      ]);

    product.specifications = specifications;
    product.variants = variants;
    product.images = images;
    product.promotions = promotions;
    product.reviews = reviews;

    return product;
  }

  // 3. LẤY SẢN PHẨM GỢI Ý CÙNG DANH MỤC
  async getRecommendedProducts(productId: number) {
    return await this.dataSource.query(
      `
      SELECT p.product_id AS id, p.product_slug AS slug, p.product_name AS name, p.base_price AS price, pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_thumbnail = TRUE
      WHERE p.category_id=(SELECT category_id FROM products WHERE product_id=?)
        AND p.product_id<>? AND p.product_status='ACTIVE'
      ORDER BY p.created_at DESC LIMIT 4
    `,
      [productId, productId],
    );
  }

  // 4. LƯU LỊCH SỬ XEM SẢN PHẨM
  async logView(userId: number, productId: number) {
    return await this.dataSource.query(
      `INSERT INTO user_view_history (user_id, product_id) VALUES (?, ?)`,
      [userId, productId],
    );
  }

  // ===================== REVIEWS =====================

  // 5. LẤY DANH SÁCH ĐÁNH GIÁ CỦA SẢN PHẨM
  async getReviews(productId: number) {
    return await this.dataSource.query(
      `
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
      `,
      [productId],
    );
  }

  // 6. TẠO ĐÁNH GIÁ MỚI
  async createReview(
    productId: number,
    userId: number,
    rating: number,
    title: string,
    content: string,
    orderId: number,
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('rating phai tu 1 den 5');
    }

    if (!Number.isInteger(orderId)) {
      throw new BadRequestException('orderId la bat buoc');
    }
    const purchased = await this.dataSource.query(
      `SELECT oi.variant_id FROM order_items oi
       JOIN orders o ON o.order_id=oi.order_id
       JOIN order_statuses os ON os.order_status_id=o.order_status_id
       WHERE o.order_id=? AND o.customer_id=? AND oi.product_id=?
         AND os.order_status_code='DELIVERED' LIMIT 1`,
      [orderId, userId, productId],
    );
    if (!purchased[0]) {
      throw new BadRequestException('Chi co the danh gia san pham da giao');
    }

    const result = await this.dataSource.query(
      `
      INSERT INTO product_reviews
        (product_id, user_id, order_id, variant_id, rating, review_title, review_content, is_verified_purchase, review_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, 'PENDING')
      `,
      [
        productId,
        userId,
        orderId,
        purchased[0].variant_id,
        rating,
        title,
        content,
      ],
    );

    return { insertId: result.insertId };
  }
}
