USE cnpm_db;

-- 1. Kiểm tra bảng và dữ liệu chính
SELECT 'products' AS check_name, COUNT(*) AS result FROM products
UNION ALL SELECT 'variants', COUNT(*) FROM product_variants
UNION ALL SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
UNION ALL SELECT 'variant_inventory', COUNT(*) FROM variant_inventory
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'reviews', COUNT(*) FROM product_reviews
UNION ALL SELECT 'promotions', COUNT(*) FROM promotions;

-- 2. Các truy vấn bên dưới đều phải trả về 0 dòng.

-- Sản phẩm không có variant mặc định.
SELECT p.product_id, p.product_name
FROM products p
LEFT JOIN product_variants pv
  ON pv.product_id = p.product_id AND pv.is_default = TRUE
WHERE pv.variant_id IS NULL;

-- Sản phẩm có nhiều hơn một variant mặc định.
SELECT p.product_id, p.product_name, COUNT(*) AS default_count
FROM products p
JOIN product_variants pv
  ON pv.product_id = p.product_id AND pv.is_default = TRUE
GROUP BY p.product_id, p.product_name
HAVING COUNT(*) > 1;

-- Tồn kho hiện tại lệch với tổng lịch sử giao dịch.
SELECT
  pv.variant_id,
  p.product_name,
  vi.stock_quantity,
  COALESCE(SUM(CASE
    WHEN itt.inventory_type_code IN ('IN', 'RETURN') THEN ABS(it.transaction_quantity)
    WHEN itt.inventory_type_code = 'OUT' THEN -ABS(it.transaction_quantity)
    WHEN itt.inventory_type_code = 'ADJUST' THEN it.transaction_quantity
    ELSE 0
  END), 0) AS ledger_stock
FROM product_variants pv
JOIN products p ON p.product_id = pv.product_id
LEFT JOIN variant_inventory vi ON vi.variant_id = pv.variant_id
LEFT JOIN inventory_transactions it ON it.variant_id = pv.variant_id
LEFT JOIN inventory_transaction_types itt
  ON itt.inventory_type_id = it.inventory_type_id
GROUP BY pv.variant_id, p.product_name, vi.stock_quantity
HAVING COALESCE(vi.stock_quantity, 0) <> ledger_stock;

-- Tồn hoặc số lượng giữ hàng không hợp lệ.
SELECT *
FROM variant_inventory
WHERE stock_quantity < 0
   OR reserved_quantity < 0
   OR reserved_quantity > stock_quantity;

-- Order item có giá snapshot không khớp.
SELECT *
FROM order_items
WHERE final_unit_price <> unit_price_at_order - discount_amount_at_order
   OR final_unit_price < 0
   OR ordered_quantity <= 0;

-- Review không thuộc đơn DELIVERED của chính người dùng hoặc sai variant.
SELECT pr.*
FROM product_reviews pr
LEFT JOIN orders o
  ON o.order_id = pr.order_id AND o.customer_id = pr.user_id
LEFT JOIN order_statuses os
  ON os.order_status_id = o.order_status_id
LEFT JOIN order_items oi
  ON oi.order_id = pr.order_id
 AND oi.product_id = pr.product_id
 AND oi.variant_id = pr.variant_id
WHERE o.order_id IS NULL
   OR os.order_status_code <> 'DELIVERED'
   OR oi.order_id IS NULL;

-- Thanh toán lệch tổng giá trị đơn hàng mẫu.
SELECT
  o.order_code,
  pay.payment_amount,
  totals.total_amount
FROM payments pay
JOIN orders o ON o.order_id = pay.order_id
JOIN vw_order_totals totals ON totals.order_id = pay.order_id
WHERE pay.payment_amount <> totals.total_amount;

-- Chương trình khuyến mãi không hợp lệ.
SELECT *
FROM promotions
WHERE end_at <= start_at
   OR discount_value <= 0
   OR (discount_type = 'PERCENT' AND discount_value > 100);

-- 3. Kiểm tra trigger đã được tạo.
SHOW TRIGGERS FROM cnpm_db;
