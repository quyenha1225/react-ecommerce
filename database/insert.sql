-- ============================================================================
-- CNPM_DB - SEED DATA (IDEMPOTENT / UPSERT)
-- Chạy sau schema.sql. Có thể chạy lại nhiều lần mà không tạo dữ liệu trùng.
-- Master data được UPDATE khi đã tồn tại và INSERT khi chưa có.
-- Dữ liệu kho dạng lịch sử chỉ INSERT khi thiếu để tránh làm sai sổ kho.
-- ============================================================================

USE cnpm_db;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 1;

-- Bảng này nên đặt trong schema.sql. Giữ IF NOT EXISTS để seed không bị lỗi.
CREATE TABLE IF NOT EXISTS ai_configs (
  ai_config_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  config_value VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  config_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

START TRANSACTION;

-- ============================================================================
-- 1. VAI TRÒ, QUYỀN VÀ PHÂN QUYỀN
-- ============================================================================
INSERT INTO roles(role_code, role_name, role_description) VALUES
('CUSTOMER', 'Khách hàng', 'Người mua hàng trên website'),
('STAFF', 'Nhân viên', 'Vận hành sản phẩm, đơn hàng, kho và chăm sóc khách hàng'),
('ADMIN', 'Quản trị viên', 'Quản trị, cấu hình, phân quyền và giám sát toàn hệ thống')
ON DUPLICATE KEY UPDATE
  role_name = VALUES(role_name),
  role_description = VALUES(role_description);

INSERT INTO permissions(permission_code, permission_name, permission_description) VALUES
('VIEW_PRODUCTS', 'Xem sản phẩm', 'Xem danh sách và chi tiết sản phẩm'),
('USE_AI_SEARCH', 'Sử dụng AI Search', 'Sử dụng tìm kiếm sản phẩm thông minh'),
('VIEW_OPERATIONS_DASHBOARD', 'Xem dashboard vận hành', 'Xem số đơn, tồn kho và công việc cần xử lý'),
('MANAGE_PRODUCTS', 'Quản lý sản phẩm', 'Thêm, sửa, khóa, ảnh, biến thể và thông số sản phẩm'),
('MANAGE_ORDERS', 'Xử lý đơn hàng', 'Xác nhận, đóng gói, giao hàng, hủy hoặc hoàn đơn theo quy trình'),
('MANAGE_INVENTORY', 'Quản lý kho', 'Nhập, xuất, hoàn và điều chỉnh tồn kho'),
('MANAGE_SUPPLIERS', 'Quản lý nhà cung cấp', 'Quản lý nhà cung cấp và giá nhập'),
('MANAGE_REVIEWS', 'Xử lý đánh giá', 'Duyệt, ẩn và phản hồi đánh giá của khách hàng'),
('VIEW_CUSTOMERS', 'Xem khách hàng', 'Xem hồ sơ và lịch sử đơn để hỗ trợ khách hàng'),
('PROCESS_PAYMENTS', 'Xử lý thanh toán', 'Kiểm tra và cập nhật thanh toán theo đơn hàng'),
('MANAGE_PAYMENTS', 'Quản lý thanh toán', 'Quản lý giao dịch thanh toán'),
('MANAGE_CATEGORIES', 'Quản lý danh mục', 'Thiết lập cấu trúc danh mục sản phẩm'),
('MANAGE_BRANDS', 'Quản lý thương hiệu', 'Thêm, sửa, khóa thương hiệu'),
('MANAGE_USERS', 'Quản lý người dùng', 'Khóa, mở khóa và quản lý tài khoản người dùng'),
('MANAGE_STAFF', 'Quản lý nhân viên', 'Tạo, sửa, khóa và đặt lại mật khẩu nhân viên'),
('MANAGE_ROLES', 'Quản lý vai trò và quyền', 'Thiết lập vai trò và phân quyền hệ thống'),
('MANAGE_PAYMENT_CONFIG', 'Cấu hình thanh toán', 'Quản lý phương thức và trạng thái thanh toán'),
('MANAGE_ORDER_CONFIG', 'Cấu hình trạng thái đơn', 'Quản lý danh mục trạng thái đơn hàng'),
('MANAGE_SYSTEM_CONFIG', 'Cấu hình hệ thống', 'Quản lý cấu hình hệ thống và AI'),
('VIEW_REPORTS', 'Xem báo cáo tổng', 'Xem báo cáo doanh thu, khách hàng, bán hàng và tồn kho'),
('VIEW_AUDIT_LOGS', 'Xem nhật ký hệ thống', 'Xem lịch sử thao tác và đăng nhập')
ON DUPLICATE KEY UPDATE
  permission_name = VALUES(permission_name),
  permission_description = VALUES(permission_description);

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_code IN ('VIEW_PRODUCTS', 'USE_AI_SEARCH')
WHERE r.role_code = 'CUSTOMER';

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'VIEW_PRODUCTS',
  'VIEW_OPERATIONS_DASHBOARD',
  'MANAGE_PRODUCTS',
  'MANAGE_ORDERS',
  'MANAGE_INVENTORY',
  'MANAGE_SUPPLIERS',
  'MANAGE_REVIEWS',
  'VIEW_CUSTOMERS',
  'PROCESS_PAYMENTS',
  'MANAGE_PAYMENTS'
)
WHERE r.role_code = 'STAFF';

INSERT IGNORE INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN';

-- ============================================================================
-- 2. DANH MỤC HỆ THỐNG
-- ============================================================================
INSERT INTO order_statuses(order_status_code, order_status_name) VALUES
('PENDING', 'Chờ xác nhận'),
('CONFIRMED', 'Đã xác nhận'),
('PACKING', 'Đang đóng gói'),
('SHIPPING', 'Đang giao hàng'),
('DELIVERED', 'Đã giao hàng'),
('CANCELLED', 'Đã hủy'),
('RETURNED', 'Đã hoàn trả')
ON DUPLICATE KEY UPDATE order_status_name = VALUES(order_status_name);

INSERT INTO payment_methods(payment_method_code, payment_method_name) VALUES
('COD', 'Thanh toán khi nhận hàng'),
('QR_BANKING', 'Chuyển khoản QR'),
('BANK_TRANSFER', 'Chuyển khoản ngân hàng')
ON DUPLICATE KEY UPDATE payment_method_name = VALUES(payment_method_name);

INSERT INTO payment_statuses(payment_status_code, payment_status_name) VALUES
('UNPAID', 'Chưa thanh toán'),
('PENDING', 'Đang xử lý'),
('PAID', 'Đã thanh toán'),
('FAILED', 'Thanh toán thất bại'),
('REFUNDED', 'Đã hoàn tiền')
ON DUPLICATE KEY UPDATE payment_status_name = VALUES(payment_status_name);

INSERT INTO inventory_transaction_types(inventory_type_code, inventory_type_name) VALUES
('IN', 'Nhập kho'),
('OUT', 'Xuất kho'),
('ADJUST', 'Điều chỉnh kho'),
('RETURN', 'Hoàn kho')
ON DUPLICATE KEY UPDATE inventory_type_name = VALUES(inventory_type_name);

INSERT INTO categories(parent_category_id, category_name, category_slug, category_description, category_status) VALUES
(NULL, 'Điện thoại', 'dien-thoai', 'Điện thoại thông minh chính hãng', 'ACTIVE'),
(NULL, 'Laptop', 'laptop', 'Laptop học tập, văn phòng và gaming', 'ACTIVE'),
(NULL, 'Phụ kiện', 'phu-kien', 'Phụ kiện công nghệ và thiết bị ngoại vi', 'ACTIVE'),
(NULL, 'Linh kiện PC', 'linh-kien-pc', 'Linh kiện máy tính để bàn', 'ACTIVE'),
(NULL, 'Màn hình', 'man-hinh', 'Màn hình làm việc và giải trí', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  parent_category_id = VALUES(parent_category_id),
  category_name = VALUES(category_name),
  category_description = VALUES(category_description),
  category_status = VALUES(category_status);

INSERT INTO brands(brand_name, brand_description, brand_status) VALUES
('Acer', 'Thương hiệu Acer', 'ACTIVE'),
('Anker', 'Thương hiệu Anker', 'ACTIVE'),
('Apple', 'Thương hiệu Apple', 'ACTIVE'),
('Asus', 'Thương hiệu Asus', 'ACTIVE'),
('Baseus', 'Thương hiệu Baseus', 'ACTIVE'),
('Cooler Master', 'Thương hiệu Cooler Master', 'ACTIVE'),
('Corsair', 'Thương hiệu Corsair', 'ACTIVE'),
('Dell', 'Thương hiệu Dell', 'ACTIVE'),
('Gigabyte', 'Thương hiệu Gigabyte', 'ACTIVE'),
('HP', 'Thương hiệu HP', 'ACTIVE'),
('HyperX', 'Thương hiệu HyperX', 'ACTIVE'),
('Intel', 'Thương hiệu Intel', 'ACTIVE'),
('JBL', 'Thương hiệu JBL', 'ACTIVE'),
('Keychron', 'Thương hiệu Keychron', 'ACTIVE'),
('Kingston', 'Thương hiệu Kingston', 'ACTIVE'),
('Lenovo', 'Thương hiệu Lenovo', 'ACTIVE'),
('Logitech', 'Thương hiệu Logitech', 'ACTIVE'),
('MSI', 'Thương hiệu MSI', 'ACTIVE'),
('NVIDIA', 'Thương hiệu NVIDIA', 'ACTIVE'),
('NZXT', 'Thương hiệu NZXT', 'ACTIVE'),
('OPPO', 'Thương hiệu OPPO', 'ACTIVE'),
('Razer', 'Thương hiệu Razer', 'ACTIVE'),
('Samsung', 'Thương hiệu Samsung', 'ACTIVE'),
('Sony', 'Thương hiệu Sony', 'ACTIVE'),
('Western Digital', 'Thương hiệu Western Digital', 'ACTIVE'),
('Xiaomi', 'Thương hiệu Xiaomi', 'ACTIVE'),
('Google', 'Thiết bị và điện thoại Google Pixel', 'ACTIVE'),
('AMD', 'Bộ xử lý và linh kiện máy tính AMD', 'ACTIVE'),
('LG', 'Màn hình và thiết bị điện tử LG', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  brand_description = VALUES(brand_description),
  brand_status = VALUES(brand_status);

INSERT INTO suppliers(supplier_name, supplier_phone, supplier_email, supplier_address, supplier_status) VALUES
('Digiworld Việt Nam', '02873038383', 'sales@digiworld.com.vn', 'Quận 7, TP. Hồ Chí Minh', 'ACTIVE'),
('Synnex FPT', '02873005688', 'kinhdoanh@synnexfpt.com', 'TP. Thủ Đức, TP. Hồ Chí Minh', 'ACTIVE'),
('Petrosetco Distribution', '02839110455', 'contact@psd.com.vn', 'Quận Phú Nhuận, TP. Hồ Chí Minh', 'ACTIVE'),
('Điện Thoại Đà Lạt Distribution', '02633555668', 'nhaphang@dienthoaidalat.vn', 'Phường 1, TP. Đà Lạt, Lâm Đồng', 'ACTIVE'),
('Công Nghệ Lâm Đồng', '02633888668', 'kinhdoanh@congnghelamdong.vn', 'Phường 8, TP. Đà Lạt, Lâm Đồng', 'ACTIVE'),
('TechZone Tây Nguyên', '02623999668', 'phanphoi@techzonetaynguyen.vn', 'TP. Buôn Ma Thuột, Đắk Lắk', 'ACTIVE'),
('Mobile Hub Miền Trung', '02363888688', 'sales@mobilehubmientrung.vn', 'Quận Hải Châu, TP. Đà Nẵng', 'ACTIVE'),
('Phụ Kiện Việt Wholesale', '02837776688', 'doitac@phukienviet.vn', 'Quận Tân Bình, TP. Hồ Chí Minh', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  supplier_phone = VALUES(supplier_phone),
  supplier_email = VALUES(supplier_email),
  supplier_address = VALUES(supplier_address),
  supplier_status = VALUES(supplier_status);

-- ============================================================================
-- 3. NGƯỜI DÙNG MẪU: UPDATE THEO EMAIL, INSERT NẾU CHƯA CÓ
-- ============================================================================
SET @seed_password_hash = '$2b$10$2u0jc/NkHd4t.MlGrfsUy.tAyX0HiDTsA7d.MA57SidEhV7bapdsW';
DROP TEMPORARY TABLE IF EXISTS tmp_seed_users;
CREATE TEMPORARY TABLE tmp_seed_users (
  role_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL PRIMARY KEY,
  phone VARCHAR(30) NULL,
  account_status VARCHAR(30) NOT NULL
);
INSERT INTO tmp_seed_users(role_code, full_name, email, phone, account_status) VALUES
('ADMIN', 'Quản trị viên hệ thống', 'admin@cnpm.local', '0900000001', 'ACTIVE'),
('STAFF', 'Nhân viên vận hành', 'staff@cnpm.local', '0900000002', 'ACTIVE'),
('STAFF', 'Nguyễn Hoàng Nam', 'staff.kho@cnpm.local', '0908001001', 'ACTIVE'),
('STAFF', 'Trần Ngọc Mai', 'staff.donhang@cnpm.local', '0908001002', 'ACTIVE'),
('STAFF', 'Lê Quốc Bảo', 'staff.sanpham@cnpm.local', '0908001003', 'ACTIVE'),
('CUSTOMER', 'Nguyễn Minh Anh', 'minhanh@example.com', '0911000001', 'ACTIVE'),
('CUSTOMER', 'Trần Gia Huy', 'giahuy@example.com', '0911000002', 'ACTIVE'),
('CUSTOMER', 'Lê Khánh Linh', 'khanhlinh@example.com', '0911000003', 'ACTIVE'),
('CUSTOMER', 'Phạm Tuấn Kiệt', 'tuankiet@example.com', '0911000004', 'ACTIVE')
;

UPDATE users u
JOIN tmp_seed_users s ON s.email = u.user_email
JOIN roles r ON r.role_code = s.role_code
SET u.role_id = r.role_id,
    u.user_full_name = s.full_name,
    u.user_phone = s.phone,
    u.account_status = s.account_status;

INSERT INTO users(role_id, user_full_name, user_email, user_phone, password_hash, account_status)
SELECT r.role_id, s.full_name, s.email, s.phone, @seed_password_hash, s.account_status
FROM tmp_seed_users s
JOIN roles r ON r.role_code = s.role_code
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.user_email = s.email
);

-- Không ghi đè password_hash khi tài khoản đã tồn tại.

-- ============================================================================
-- 4. SẢN PHẨM: GOM TOÀN BỘ DỮ LIỆU VÀO BẢNG TẠM
-- ============================================================================
DROP TEMPORARY TABLE IF EXISTS tmp_seed_products;
CREATE TEMPORARY TABLE tmp_seed_products (
  product_slug VARCHAR(255) NOT NULL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT NULL,
  base_price DECIMAL(18,2) NOT NULL,
  warranty_months INT NOT NULL,
  category_slug VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  product_status VARCHAR(30) NOT NULL
);
INSERT INTO tmp_seed_products(product_slug, sku, product_name, product_description, base_price, warranty_months, category_slug, brand_name, product_status) VALUES
('asus-rog', 'CNPM-0001', 'Laptop Gaming ASUS ROG Strix', 'Laptop Gaming ASUS ROG Strix - sản phẩm mẫu cho project CNPM.', 45990000, 24, 'laptop', 'Asus', 'ACTIVE'),
('lenovo-thinkpad', 'CNPM-0002', 'Laptop Lenovo ThinkPad', 'Laptop Lenovo ThinkPad - sản phẩm mẫu cho project CNPM.', 38000000, 24, 'laptop', 'Lenovo', 'ACTIVE'),
('hp-victus', 'CNPM-0003', 'Laptop HP Victus 16', 'Laptop HP Victus 16 - sản phẩm mẫu cho project CNPM.', 24500000, 24, 'laptop', 'HP', 'ACTIVE'),
('acer-swift', 'CNPM-0004', 'Laptop Acer Swift Go', 'Laptop Acer Swift Go - sản phẩm mẫu cho project CNPM.', 21900000, 24, 'laptop', 'Acer', 'ACTIVE'),
('msi-katana', 'CNPM-0005', 'Laptop MSI Katana 15', 'Laptop MSI Katana 15 - sản phẩm mẫu cho project CNPM.', 27500000, 24, 'laptop', 'MSI', 'ACTIVE'),
('macbook-air', 'CNPM-0006', 'Laptop MacBook Air M2', 'Laptop MacBook Air M2 - sản phẩm mẫu cho project CNPM.', 26500000, 24, 'laptop', 'Apple', 'ACTIVE'),
('dell-inspiron', 'CNPM-0007', 'Laptop Dell Inspiron 15', 'Laptop Dell Inspiron 15 - sản phẩm mẫu cho project CNPM.', 16500000, 24, 'laptop', 'Dell', 'ACTIVE'),
('gigabyte-g5', 'CNPM-0008', 'Laptop Gigabyte G5 MF', 'Laptop Gigabyte G5 MF - sản phẩm mẫu cho project CNPM.', 19990000, 24, 'laptop', 'Gigabyte', 'ACTIVE'),
('macbook-pro-m3', 'CNPM-0009', 'Laptop MacBook Pro M3', 'Laptop MacBook Pro M3 - sản phẩm mẫu cho project CNPM.', 52990000, 24, 'laptop', 'Apple', 'ACTIVE'),
('hp-elitebook', 'CNPM-0010', 'Laptop HP EliteBook', 'Laptop HP EliteBook - sản phẩm mẫu cho project CNPM.', 22500000, 24, 'laptop', 'HP', 'ACTIVE'),
('iphone-16-pro-max', 'CNPM-0011', 'iPhone 16 Pro Max', 'iPhone 16 Pro Max - sản phẩm mẫu cho project CNPM.', 34990000, 12, 'dien-thoai', 'Apple', 'ACTIVE'),
('iphone-15-plus', 'CNPM-0012', 'iPhone 15 Plus', 'iPhone 15 Plus - sản phẩm mẫu cho project CNPM.', 22990000, 12, 'dien-thoai', 'Apple', 'ACTIVE'),
('iphone-13-128gb', 'CNPM-0013', 'iPhone 13 128GB', 'iPhone 13 128GB - sản phẩm mẫu cho project CNPM.', 15990000, 12, 'dien-thoai', 'Apple', 'ACTIVE'),
('samsung-s24-ultra', 'CNPM-0014', 'Samsung S24 Ultra', 'Samsung S24 Ultra - sản phẩm mẫu cho project CNPM.', 28990000, 12, 'dien-thoai', 'Samsung', 'ACTIVE'),
('samsung-a55', 'CNPM-0015', 'Samsung Galaxy A55', 'Samsung Galaxy A55 - sản phẩm mẫu cho project CNPM.', 9990000, 12, 'dien-thoai', 'Samsung', 'ACTIVE'),
('xiaomi-14-ultra', 'CNPM-0016', 'Xiaomi 14 Ultra', 'Xiaomi 14 Ultra - sản phẩm mẫu cho project CNPM.', 25000000, 12, 'dien-thoai', 'Xiaomi', 'ACTIVE'),
('samsung-z-flip-5', 'CNPM-0017', 'Samsung Z Flip 5', 'Samsung Z Flip 5 - sản phẩm mẫu cho project CNPM.', 21500000, 12, 'dien-thoai', 'Samsung', 'ACTIVE'),
('iphone-12-64gb', 'CNPM-0018', 'iPhone 12 64GB', 'iPhone 12 64GB - sản phẩm mẫu cho project CNPM.', 12500000, 12, 'dien-thoai', 'Apple', 'ACTIVE'),
('oppo-find-x7', 'CNPM-0019', 'Oppo Find X7 Ultra', 'Oppo Find X7 Ultra - sản phẩm mẫu cho project CNPM.', 27000000, 12, 'dien-thoai', 'OPPO', 'ACTIVE'),
('samsung-s23-fe', 'CNPM-0020', 'Samsung S23 FE', 'Samsung S23 FE - sản phẩm mẫu cho project CNPM.', 11990000, 12, 'dien-thoai', 'Samsung', 'ACTIVE'),
('logitech-g-pro-x', 'CNPM-0021', 'Logitech G Pro X', 'Logitech G Pro X - sản phẩm mẫu cho project CNPM.', 3200000, 12, 'phu-kien', 'Logitech', 'ACTIVE'),
('razer-deathadder-v3', 'PK-RZR-DAV3', 'Razer DeathAdder V3', 'Chuột gaming siêu nhẹ, cảm biến chính xác cao.', 1790000, 24, 'phu-kien', 'Razer', 'ACTIVE'),
('hyperx-cloud-alpha', 'CNPM-0023', 'HyperX Cloud Alpha', 'HyperX Cloud Alpha - sản phẩm mẫu cho project CNPM.', 2100000, 12, 'phu-kien', 'HyperX', 'ACTIVE'),
('keychron-q1-pro', 'CNPM-0024', 'Keychron Q1 Pro', 'Keychron Q1 Pro - sản phẩm mẫu cho project CNPM.', 4500000, 12, 'phu-kien', 'Keychron', 'ACTIVE'),
('anker-735-gan', 'CNPM-0025', 'Anker 735 GaN 65W', 'Anker 735 GaN 65W - sản phẩm mẫu cho project CNPM.', 1200000, 12, 'phu-kien', 'Anker', 'ACTIVE'),
('sony-wh-1000xm5', 'PK-SNY-XM5', 'Sony WH-1000XM5', 'Tai nghe chống ồn chủ động cao cấp.', 8490000, 12, 'phu-kien', 'Sony', 'ACTIVE'),
('baseus-holder', 'CNPM-0027', 'Baseus Phone Holder', 'Baseus Phone Holder - sản phẩm mẫu cho project CNPM.', 150000, 12, 'phu-kien', 'Baseus', 'ACTIVE'),
('apple-magic-mouse', 'CNPM-0028', 'Apple Magic Mouse', 'Apple Magic Mouse - sản phẩm mẫu cho project CNPM.', 2200000, 12, 'phu-kien', 'Apple', 'ACTIVE'),
('jbl-flip-6', 'CNPM-0029', 'JBL Flip 6 Speaker', 'JBL Flip 6 Speaker - sản phẩm mẫu cho project CNPM.', 2900000, 12, 'phu-kien', 'JBL', 'ACTIVE'),
('logitech-mx-master', 'CNPM-0030', 'Logitech MX Master 3S', 'Logitech MX Master 3S - sản phẩm mẫu cho project CNPM.', 2800000, 12, 'phu-kien', 'Logitech', 'ACTIVE'),
('cpu-i9-14900k', 'CNPM-0031', 'CPU Intel Core i9-14900K', 'CPU Intel Core i9-14900K - sản phẩm mẫu cho project CNPM.', 15000000, 12, 'linh-kien-pc', 'Intel', 'ACTIVE'),
('ram-corsair-32gb', 'CNPM-0032', 'RAM Corsair Vengeance 32GB', 'RAM Corsair Vengeance 32GB - sản phẩm mẫu cho project CNPM.', 3500000, 12, 'linh-kien-pc', 'Corsair', 'ACTIVE'),
('ssd-samsung-990pro', 'CNPM-0033', 'SSD Samsung 990 Pro 1TB', 'SSD Samsung 990 Pro 1TB - sản phẩm mẫu cho project CNPM.', 3200000, 12, 'linh-kien-pc', 'Samsung', 'ACTIVE'),
('case-corsair-4000d', 'CNPM-0034', 'Case Corsair 4000D Airflow', 'Case Corsair 4000D Airflow - sản phẩm mẫu cho project CNPM.', 2800000, 12, 'linh-kien-pc', 'Corsair', 'ACTIVE'),
('psu-coolermaster-750w', 'CNPM-0035', 'Nguồn Cooler Master 750W', 'Nguồn Cooler Master 750W - sản phẩm mẫu cho project CNPM.', 2200000, 12, 'linh-kien-pc', 'Cooler Master', 'ACTIVE'),
('main-asus-z790', 'CNPM-0036', 'Mainboard ASUS ROG Z790', 'Mainboard ASUS ROG Z790 - sản phẩm mẫu cho project CNPM.', 8500000, 12, 'linh-kien-pc', 'Asus', 'ACTIVE'),
('gpu-rtx-4070-super', 'CNPM-0037', 'Card màn hình RTX 4070 Super', 'Card màn hình RTX 4070 Super - sản phẩm mẫu cho project CNPM.', 18500000, 12, 'linh-kien-pc', 'NVIDIA', 'ACTIVE'),
('cool-nzxt-kraken', 'CNPM-0038', 'Tản nhiệt nước NZXT Kraken', 'Tản nhiệt nước NZXT Kraken - sản phẩm mẫu cho project CNPM.', 4500000, 12, 'linh-kien-pc', 'NZXT', 'ACTIVE'),
('ram-kingston-16gb', 'CNPM-0039', 'RAM Kingston Fury 16GB', 'RAM Kingston Fury 16GB - sản phẩm mẫu cho project CNPM.', 1500000, 12, 'linh-kien-pc', 'Kingston', 'ACTIVE'),
('ssd-wd-sn850x', 'CNPM-0040', 'SSD WD Black SN850X 2TB', 'SSD WD Black SN850X 2TB - sản phẩm mẫu cho project CNPM.', 4800000, 12, 'linh-kien-pc', 'Western Digital', 'ACTIVE'),
('asus-rog-strix-g16', 'LT-ASUS-G16', 'Laptop Gaming ASUS ROG Strix G16', 'Laptop gaming hiệu năng cao, màn hình 165Hz.', 45990000, 24, 'laptop', 'Asus', 'ACTIVE'),
('dell-xps-14-9440', 'LT-DELL-XPS14', 'Dell XPS 14 9440', 'Laptop cao cấp thiết kế nhôm nguyên khối.', 52990000, 24, 'laptop', 'Dell', 'ACTIVE'),
('lenovo-thinkpad-x1-carbon', 'LT-LNV-X1', 'Lenovo ThinkPad X1 Carbon', 'Laptop doanh nhân bền bỉ và bảo mật cao.', 38990000, 24, 'laptop', 'Lenovo', 'ACTIVE'),
('iphone-16-pro-max-256gb', 'DT-APL-IP16PM', 'iPhone 16 Pro Max 256GB', 'Điện thoại Apple cao cấp với camera chuyên nghiệp.', 34990000, 12, 'dien-thoai', 'Apple', 'ACTIVE'),
('samsung-galaxy-s24-ultra', 'DT-SS-S24U', 'Samsung Galaxy S24 Ultra', 'Điện thoại Galaxy AI cùng bút S Pen.', 27990000, 12, 'dien-thoai', 'Samsung', 'ACTIVE'),
('logitech-mx-master-3s', 'PK-LGT-MX3S', 'Logitech MX Master 3S', 'Chuột không dây công thái học cho công việc.', 2490000, 12, 'phu-kien', 'Logitech', 'ACTIVE'),
('samsung-ssd-990-pro-1tb', 'LK-SS-990P', 'Samsung SSD 990 Pro 1TB', 'Ổ cứng NVMe PCIe 4.0 hiệu năng cao.', 3290000, 60, 'linh-kien-pc', 'Samsung', 'ACTIVE'),
('hp-pavilion-plus-14', 'LT-HP-PAV14', 'HP Pavilion Plus 14', 'Laptop mỏng nhẹ OLED phù hợp học tập và văn phòng.', 26990000, 24, 'laptop', 'HP', 'ACTIVE'),
('xiaomi-14-ultra-512gb', 'DT-XMI-14U', 'Xiaomi 14 Ultra 512GB', 'Điện thoại camera Leica, hiệu năng cao và sạc nhanh.', 22990000, 18, 'dien-thoai', 'Xiaomi', 'ACTIVE'),
('oppo-find-x7-256gb', 'DT-OPP-FX7', 'OPPO Find X7 256GB', 'Điện thoại cao cấp với màn hình AMOLED và camera Hasselblad.', 18990000, 12, 'dien-thoai', 'OPPO', 'ACTIVE'),
('anker-735-gan-65w', 'PK-ANK-735', 'Anker 735 GaN 65W', 'Bộ sạc nhanh GaN ba cổng nhỏ gọn.', 1290000, 18, 'phu-kien', 'Anker', 'ACTIVE'),
('intel-core-i9-14900k', 'LK-INT-I914', 'Intel Core i9-14900K', 'CPU 24 nhân hiệu năng cao cho gaming và sáng tạo.', 14990000, 36, 'linh-kien-pc', 'Intel', 'ACTIVE'),
('corsair-vengeance-32gb-ddr5', 'LK-COR-32D5', 'Corsair Vengeance 32GB DDR5', 'Bộ nhớ DDR5 dung lượng 32GB tốc độ cao.', 3290000, 60, 'linh-kien-pc', 'Corsair', 'ACTIVE'),
('nvidia-rtx-4070-super', 'LK-NV-4070S', 'NVIDIA GeForce RTX 4070 Super', 'Card đồ họa mạnh mẽ cho game 2K và xử lý đồ họa.', 18490000, 36, 'linh-kien-pc', 'NVIDIA', 'ACTIVE'),
('samsung-odyssey-g5-27', 'MH-SS-G527', 'Samsung Odyssey G5 27 inch', 'Màn hình gaming cong 2K tần số quét 165Hz.', 7490000, 24, 'man-hinh', 'Samsung', 'ACTIVE'),
('asus-proart-pa278qv', 'MH-AS-PA278', 'ASUS ProArt PA278QV 27 inch', 'Màn hình đồ họa 2K độ chính xác màu cao.', 8990000, 36, 'man-hinh', 'Asus', 'ACTIVE'),
('acer-nitro-vg240y', 'MH-AC-VG240', 'Acer Nitro VG240Y 24 inch', 'Màn hình gaming IPS Full HD 180Hz.', 4290000, 24, 'man-hinh', 'Acer', 'ACTIVE'),
('gigabyte-m32u-4k', 'MH-GB-M32U', 'Gigabyte M32U 32 inch 4K', 'Màn hình 4K 144Hz hỗ trợ HDMI 2.1.', 16990000, 36, 'man-hinh', 'Gigabyte', 'ACTIVE'),
('macbook-air-m3-15', 'LT-APL-M3A15', 'MacBook Air M3 15 inch', 'Laptop mỏng nhẹ pin lâu, phù hợp học tập và sáng tạo.', 32990000, 12, 'laptop', 'Apple', 'ACTIVE'),
('acer-predator-helios-neo-16', 'LT-AC-PHN16', 'Acer Predator Helios Neo 16', 'Laptop gaming màn hình 165Hz, tản nhiệt hiệu suất cao.', 37990000, 24, 'laptop', 'Acer', 'ACTIVE'),
('google-pixel-9-pro-256gb', 'DT-GG-P9P', 'Google Pixel 9 Pro 256GB', 'Điện thoại Android cao cấp, camera AI và màn hình OLED.', 25990000, 12, 'dien-thoai', 'Google', 'ACTIVE'),
('oppo-reno-12-pro-5g', 'DT-OPP-R12P', 'OPPO Reno 12 Pro 5G', 'Điện thoại 5G thiết kế mỏng, camera chân dung và sạc nhanh.', 14990000, 12, 'dien-thoai', 'OPPO', 'ACTIVE'),
('apple-airpods-pro-2-usbc', 'PK-APL-APP2', 'Apple AirPods Pro 2 USB-C', 'Tai nghe chống ồn chủ động, âm thanh không gian.', 5990000, 12, 'phu-kien', 'Apple', 'ACTIVE'),
('logitech-g-pro-x-superlight-2', 'PK-LGT-GPX2', 'Logitech G Pro X Superlight 2', 'Chuột gaming không dây siêu nhẹ, cảm biến độ chính xác cao.', 3490000, 24, 'phu-kien', 'Logitech', 'ACTIVE'),
('amd-ryzen-7-7800x3d', 'LK-AMD-7800X3D', 'AMD Ryzen 7 7800X3D', 'CPU gaming 8 nhân với bộ nhớ đệm 3D V-Cache.', 10990000, 36, 'linh-kien-pc', 'AMD', 'ACTIVE'),
('asus-tuf-rtx-4060-ti-8gb', 'LK-AS-4060TI', 'ASUS TUF RTX 4060 Ti 8GB', 'Card đồ họa chơi game Full HD và 2K, hỗ trợ DLSS 3.', 13990000, 36, 'linh-kien-pc', 'Asus', 'ACTIVE'),
('lg-ultragear-27gp850', 'MH-LG-27GP850', 'LG UltraGear 27GP850 27 inch', 'Màn hình Nano IPS 2K 180Hz cho game tốc độ cao.', 8990000, 24, 'man-hinh', 'LG', 'ACTIVE'),
('dell-ultrasharp-u2723qe', 'MH-DELL-U2723', 'Dell UltraSharp U2723QE 27 inch', 'Màn hình 4K IPS Black USB-C cho thiết kế và văn phòng.', 13990000, 36, 'man-hinh', 'Dell', 'ACTIVE')
;

UPDATE products p
JOIN tmp_seed_products s ON p.product_slug = s.product_slug OR p.sku = s.sku
JOIN categories c ON c.category_slug = s.category_slug
JOIN brands b ON b.brand_name = s.brand_name
SET p.category_id = c.category_id,
    p.brand_id = b.brand_id,
    p.product_name = s.product_name,
    p.product_slug = s.product_slug,
    p.sku = s.sku,
    p.product_description = s.product_description,
    p.base_price = s.base_price,
    p.warranty_months = s.warranty_months,
    p.product_status = s.product_status;

INSERT INTO products(
  category_id, brand_id, product_name, product_slug, sku, product_description,
  base_price, warranty_months, product_status, created_by_user_id
)
SELECT c.category_id, b.brand_id, s.product_name, s.product_slug, s.sku,
       s.product_description, s.base_price, s.warranty_months,
       s.product_status, admin_user.user_id
FROM tmp_seed_products s
JOIN categories c ON c.category_slug = s.category_slug
JOIN brands b ON b.brand_name = s.brand_name
JOIN users admin_user ON admin_user.user_email = 'admin@cnpm.local'
WHERE NOT EXISTS (
  SELECT 1
  FROM products p
  WHERE p.product_slug = s.product_slug OR p.sku = s.sku
);

-- ============================================================================
-- 5. ẢNH ĐẠI DIỆN SẢN PHẨM: UPDATE NẾU CÓ, INSERT NẾU THIẾU
-- ============================================================================
DROP TEMPORARY TABLE IF EXISTS tmp_seed_images;
CREATE TEMPORARY TABLE tmp_seed_images (
  product_slug VARCHAR(255) NOT NULL PRIMARY KEY,
  image_url TEXT NOT NULL
);
INSERT INTO tmp_seed_images(product_slug, image_url) VALUES
('asus-rog', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEnknfpKUVn9wre0WRiFFu2LjE7KoJvs34QQR0evHuog&s'),
('lenovo-thinkpad', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKx6dkN8KCFjC_sceph0WqPn21P65_DPh5fOcrX6MAVg&s=10'),
('hp-victus', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCFy6nKqryy5MBbeUJNkMGnoCEVsixSZPMmfKKTyeVIA&s'),
('acer-swift', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcL2QueflKnDn5bGAXPzP-_KqhQH8oE0r1h5yxz2A0Lw&s'),
('msi-katana', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIHiiTjSygQu2ItHxAJjhzPRFTx0N5k-hX1elY-rdrrA&s=10'),
('macbook-air', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRrypBrP-2TcAIzQehcMsJuNAvyj4jL0usU1W9V-SJeQ&s'),
('dell-inspiron', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0zlOV2S4_PbEcmvIlNVtsfNXzCNxy7-THx9ZN7Fxe6w&s=10'),
('gigabyte-g5', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8dHOcFPeMfjDkeblAYX6FAlbfbok550LOduZWJG2mNw&s=10'),
('macbook-pro-m3', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-4lGVwvvLVlXci7swohzob95lCkvn9hFN23_jhwn9zg&s=10'),
('hp-elitebook', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS--Yb5pMLgRaDYwPh7khDwpWl8EDd_fGy7jWovDFlkMQ&s=10'),
('iphone-16-pro-max', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlV8w6eLL2QVY8zAvF1Je1VHcrd_bTrVT0-ElqvBG8Fg&s'),
('iphone-15-plus', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvr0PHYylAD3EFN8t8nOk7IZR8GFQS73_XXcHvg_rE1A&s'),
('iphone-13-128gb', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoh3yt4lkcmClQZ2pqUIopBfOy1VmwQAZSxHRpr_rU4Q&s'),
('samsung-s24-ultra', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRw3HTF1utzLQHaUHHwJrUNJLifOiEcd4JK_B9aqB0s8w&s'),
('samsung-a55', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRDOBHc_GzO2Ih6Fd6oM9OMfaVZljrlyUX9EHtI98E_g&s=10'),
('xiaomi-14-ultra', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOeqJu2FK58lyH5Fznb2EN0NnvfcJXH7Xr-a83vCOdkw&s=10'),
('samsung-z-flip-5', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJwtnOOobxYbO101RYHU6JjdxgPHBlJmMEhBf65AGlwg&s=10'),
('iphone-12-64gb', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiTbopNAIFSLCyq6Uzq836GIA-d1YuREyuB73tzigeHw&s=10'),
('oppo-find-x7', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbFSYn_UI-S_adV_etKDP2ttZU6BLGdoOLUcTJ2yNcIw&s'),
('samsung-s23-fe', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrDNyvj9-CFJcIXo05Cyy-NvxqkQl76rVEOzOszp4Wpg&s=10'),
('logitech-g-pro-x', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKWNZJFqOq4nlFV4wco3cxhb--RGvACt_8u2BSpjJCfg&s=10'),
('razer-deathadder-v3', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=85'),
('hyperx-cloud-alpha', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKkBDr78foi0VjRtBl_dfjYxNlmpAklG48tuAZosFHxw&s=10'),
('keychron-q1-pro', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTY9zCEnvq1csNpYkDXw47MQlXAvVMtZULuTT_cZKvK8w&s=10'),
('anker-735-gan', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrtqqNZT1CZKbUlH1c8dZOH7wjlediuvDBPqfAq86WAQ&s=10'),
('sony-wh-1000xm5', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85'),
('baseus-holder', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsdWjH7b_ZSicKqm44X6z9__Qnb3uwsKBnUqTPNQm1Gw&s'),
('apple-magic-mouse', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3anBCkqt5UFsCkAF3TwIncX2HRdp3rKKV8lqxQUREmA&s=10'),
('jbl-flip-6', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkrISmOt3_KK1hKa64UlddeelrpGHn5Zymuj1n6VWcAQ&s'),
('logitech-mx-master', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWH2ZSX-F_YndrkGvlM3pnO-ehK1JuAVF4ZeiAG8MfAQ&s=10'),
('cpu-i9-14900k', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbiwdCt-tz2Y6fKzK22UZfXHhltTlmKT9zV2fWp530jw&s=10'),
('ram-corsair-32gb', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5VxwnH5JnjmCnBDwf2PKHw_DlI8bk4G628Zi_lqd1sg&s=10'),
('ssd-samsung-990pro', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7AboDJY-7PK2gpKT7mXXqA4itfuoxee_LWYcMWppAkw&s=10'),
('case-corsair-4000d', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTg6xP_yuxgH7-p-cydmRhnl9F2rYaiftIGJA-3XNhi9Q&s=10'),
('psu-coolermaster-750w', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBt736ZHryIu4LVEeKctqHxuJsCXHLVM3KZe5iy82gEw&s=10'),
('main-asus-z790', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPyym8FPCeJEVbp97G6myH8fCoiL2u5VPX9mu08l3YHQ&s=10'),
('gpu-rtx-4070-super', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXvH7vCGe5eXwEYMZtR-8yHcSSDbHW1nAJbkIYagRRNA&s=10'),
('cool-nzxt-kraken', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_zW8QlL0clsIlafQlY_wK5mYZ4xObRw7evXvlNs-FAg&s=10'),
('ram-kingston-16gb', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1QgcqO0MBaV7uDFJjmBGJaygUzvfAMRbglnBfcRbP2A&s'),
('ssd-wd-sn850x', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPx9AkWki76bkzodjC29y57yj_H27mwdIIX_669Q5FAA&s=10'),
('asus-rog-strix-g16', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85'),
('dell-xps-14-9440', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85'),
('lenovo-thinkpad-x1-carbon', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85'),
('iphone-16-pro-max-256gb', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=85'),
('samsung-galaxy-s24-ultra', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=85'),
('logitech-mx-master-3s', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85'),
('samsung-ssd-990-pro-1tb', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85'),
('hp-pavilion-plus-14', 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=85'),
('xiaomi-14-ultra-512gb', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85'),
('oppo-find-x7-256gb', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85'),
('anker-735-gan-65w', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=85'),
('intel-core-i9-14900k', 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1200&q=85'),
('corsair-vengeance-32gb-ddr5', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=85'),
('nvidia-rtx-4070-super', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85'),
('samsung-odyssey-g5-27', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85'),
('asus-proart-pa278qv', 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=1200&q=85'),
('acer-nitro-vg240y', 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=85'),
('gigabyte-m32u-4k', 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=85'),
('macbook-air-m3-15', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85'),
('acer-predator-helios-neo-16', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85'),
('google-pixel-9-pro-256gb', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85'),
('oppo-reno-12-pro-5g', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85'),
('apple-airpods-pro-2-usbc', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=1200&q=85'),
('logitech-g-pro-x-superlight-2', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85'),
('amd-ryzen-7-7800x3d', 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1200&q=85'),
('asus-tuf-rtx-4060-ti-8gb', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85'),
('lg-ultragear-27gp850', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85'),
('dell-ultrasharp-u2723qe', 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=1200&q=85')
;

UPDATE product_images pi
JOIN products p ON p.product_id = pi.product_id
JOIN tmp_seed_images s ON s.product_slug = p.product_slug
SET pi.image_url = s.image_url,
    pi.sort_order = 1
WHERE pi.is_thumbnail = TRUE;

INSERT INTO product_images(product_id, image_url, is_thumbnail, sort_order)
SELECT p.product_id, s.image_url, TRUE, 1
FROM tmp_seed_images s
JOIN products p ON p.product_slug = s.product_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM product_images pi
  WHERE pi.product_id = p.product_id AND pi.is_thumbnail = TRUE
);

-- ============================================================================
-- 6. BIẾN THỂ, TỒN KHO VÀ NHÀ CUNG CẤP
-- ============================================================================
-- Chỉ cập nhật biến thể do seed tạo; không ghi đè biến thể nghiệp vụ khác.
UPDATE product_variants pv
JOIN products p ON p.product_id = pv.product_id
JOIN tmp_seed_products s ON s.product_slug = p.product_slug
SET pv.variant_name = CONCAT(p.product_name, ' - Tiêu chuẩn'),
    pv.additional_price = 0,
    pv.variant_status = 'ACTIVE',
    pv.is_default = TRUE
WHERE pv.sku IN (CONCAT(p.sku, '-STD'), CONCAT(p.sku, '-DEFAULT'));

INSERT INTO product_variants(product_id, variant_name, sku, additional_price, variant_status, is_default)
SELECT p.product_id, CONCAT(p.product_name, ' - Tiêu chuẩn'),
       CONCAT(p.sku, '-STD'), 0, 'ACTIVE', TRUE
FROM products p
JOIN tmp_seed_products s ON s.product_slug = p.product_slug
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants pv
  WHERE pv.product_id = p.product_id AND pv.is_default = TRUE
);

DROP TEMPORARY TABLE IF EXISTS tmp_seed_inventory;
CREATE TEMPORARY TABLE tmp_seed_inventory (
  product_slug VARCHAR(255) NOT NULL PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  cost_rate DECIMAL(5,4) NOT NULL,
  stock_quantity INT NOT NULL,
  reserved_quantity INT NOT NULL,
  transaction_note VARCHAR(255) NOT NULL,
  staff_email VARCHAR(255) NOT NULL
);
INSERT INTO tmp_seed_inventory(product_slug, supplier_name, cost_rate, stock_quantity, reserved_quantity, transaction_note, staff_email) VALUES
('asus-rog', 'Digiworld Việt Nam', 0.78, 7, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('lenovo-thinkpad', 'Digiworld Việt Nam', 0.78, 12, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('hp-victus', 'Digiworld Việt Nam', 0.78, 20, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('acer-swift', 'Digiworld Việt Nam', 0.78, 8, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('msi-katana', 'Digiworld Việt Nam', 0.78, 14, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('macbook-air', 'Digiworld Việt Nam', 0.78, 22, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('dell-inspiron', 'Digiworld Việt Nam', 0.78, 10, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('gigabyte-g5', 'Digiworld Việt Nam', 0.78, 4, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('macbook-pro-m3', 'Digiworld Việt Nam', 0.78, 7, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('hp-elitebook', 'Digiworld Việt Nam', 0.78, 12, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('iphone-16-pro-max', 'Digiworld Việt Nam', 0.78, 20, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('iphone-15-plus', 'Digiworld Việt Nam', 0.78, 8, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('iphone-13-128gb', 'Digiworld Việt Nam', 0.78, 14, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('samsung-s24-ultra', 'Digiworld Việt Nam', 0.78, 22, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('samsung-a55', 'Digiworld Việt Nam', 0.78, 10, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('xiaomi-14-ultra', 'Digiworld Việt Nam', 0.78, 4, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('samsung-z-flip-5', 'Digiworld Việt Nam', 0.78, 7, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('iphone-12-64gb', 'Digiworld Việt Nam', 0.78, 12, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('oppo-find-x7', 'Digiworld Việt Nam', 0.78, 20, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('samsung-s23-fe', 'Digiworld Việt Nam', 0.78, 8, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('logitech-g-pro-x', 'Digiworld Việt Nam', 0.78, 14, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('razer-deathadder-v3', 'Digiworld Việt Nam', 0.78, 22, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('hyperx-cloud-alpha', 'Digiworld Việt Nam', 0.78, 10, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('keychron-q1-pro', 'Digiworld Việt Nam', 0.78, 4, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('anker-735-gan', 'Digiworld Việt Nam', 0.78, 7, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('sony-wh-1000xm5', 'Digiworld Việt Nam', 0.78, 12, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('baseus-holder', 'Digiworld Việt Nam', 0.78, 20, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('apple-magic-mouse', 'Digiworld Việt Nam', 0.78, 8, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('jbl-flip-6', 'Digiworld Việt Nam', 0.78, 14, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('logitech-mx-master', 'Digiworld Việt Nam', 0.78, 22, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('cpu-i9-14900k', 'Digiworld Việt Nam', 0.78, 10, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('ram-corsair-32gb', 'Digiworld Việt Nam', 0.78, 4, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('ssd-samsung-990pro', 'Digiworld Việt Nam', 0.78, 7, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('case-corsair-4000d', 'Digiworld Việt Nam', 0.78, 12, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('psu-coolermaster-750w', 'Digiworld Việt Nam', 0.78, 20, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('main-asus-z790', 'Digiworld Việt Nam', 0.78, 8, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('gpu-rtx-4070-super', 'Digiworld Việt Nam', 0.78, 14, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('cool-nzxt-kraken', 'Digiworld Việt Nam', 0.78, 22, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('ram-kingston-16gb', 'Digiworld Việt Nam', 0.78, 10, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('ssd-wd-sn850x', 'Digiworld Việt Nam', 0.78, 4, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('asus-rog-strix-g16', 'Digiworld Việt Nam', 0.78, 7, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('dell-xps-14-9440', 'Digiworld Việt Nam', 0.78, 12, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('lenovo-thinkpad-x1-carbon', 'Digiworld Việt Nam', 0.78, 20, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('iphone-16-pro-max-256gb', 'Digiworld Việt Nam', 0.78, 8, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('samsung-galaxy-s24-ultra', 'Digiworld Việt Nam', 0.78, 14, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('logitech-mx-master-3s', 'Digiworld Việt Nam', 0.78, 22, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('samsung-ssd-990-pro-1tb', 'Digiworld Việt Nam', 0.78, 10, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('hp-pavilion-plus-14', 'Digiworld Việt Nam', 0.78, 4, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('xiaomi-14-ultra-512gb', 'Synnex FPT', 0.78, 7, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('oppo-find-x7-256gb', 'Petrosetco Distribution', 0.78, 12, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('anker-735-gan-65w', 'Digiworld Việt Nam', 0.78, 20, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('intel-core-i9-14900k', 'Petrosetco Distribution', 0.78, 8, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('corsair-vengeance-32gb-ddr5', 'Digiworld Việt Nam', 0.78, 14, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('nvidia-rtx-4070-super', 'Synnex FPT', 0.78, 22, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('samsung-odyssey-g5-27', 'Petrosetco Distribution', 0.78, 10, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('asus-proart-pa278qv', 'Digiworld Việt Nam', 0.78, 4, 1, 'Phiếu nhập kho ban đầu', 'staff.donhang@cnpm.local'),
('acer-nitro-vg240y', 'Synnex FPT', 0.78, 7, 2, 'Phiếu nhập kho ban đầu', 'staff.sanpham@cnpm.local'),
('gigabyte-m32u-4k', 'Petrosetco Distribution', 0.78, 12, 0, 'Phiếu nhập kho ban đầu', 'staff.kho@cnpm.local'),
('macbook-air-m3-15', 'Digiworld Việt Nam', 0.72, 20, 1, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.donhang@cnpm.local'),
('acer-predator-helios-neo-16', 'Synnex FPT', 0.72, 8, 2, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.sanpham@cnpm.local'),
('google-pixel-9-pro-256gb', 'Petrosetco Distribution', 0.72, 14, 0, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.kho@cnpm.local'),
('oppo-reno-12-pro-5g', 'Điện Thoại Đà Lạt Distribution', 0.72, 22, 1, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.donhang@cnpm.local'),
('apple-airpods-pro-2-usbc', 'Công Nghệ Lâm Đồng', 0.72, 10, 2, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.sanpham@cnpm.local'),
('logitech-g-pro-x-superlight-2', 'TechZone Tây Nguyên', 0.72, 4, 0, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.kho@cnpm.local'),
('amd-ryzen-7-7800x3d', 'Mobile Hub Miền Trung', 0.72, 7, 1, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.donhang@cnpm.local'),
('asus-tuf-rtx-4060-ti-8gb', 'Phụ Kiện Việt Wholesale', 0.72, 12, 2, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.sanpham@cnpm.local'),
('lg-ultragear-27gp850', 'Digiworld Việt Nam', 0.72, 20, 0, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.kho@cnpm.local'),
('dell-ultrasharp-u2723qe', 'Synnex FPT', 0.72, 8, 1, 'Nhập kho dữ liệu mở rộng quản trị', 'staff.donhang@cnpm.local')
;

-- Tồn kho chỉ INSERT khi chưa có, tránh reset tồn kho thật khi chạy lại seed.
INSERT INTO variant_inventory(variant_id, stock_quantity, reserved_quantity)
SELECT pv.variant_id, s.stock_quantity, s.reserved_quantity
FROM tmp_seed_inventory s
JOIN products p ON p.product_slug = s.product_slug
JOIN product_variants pv ON pv.product_id = p.product_id AND pv.is_default = TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM variant_inventory vi WHERE vi.variant_id = pv.variant_id
);

UPDATE product_suppliers ps
JOIN products p ON p.product_id = ps.product_id
JOIN tmp_seed_inventory s ON s.product_slug = p.product_slug
JOIN suppliers sp ON sp.supplier_name = s.supplier_name AND sp.supplier_id = ps.supplier_id
SET ps.supplier_sku = CONCAT('NCC-', p.sku),
    ps.cost_price = ROUND(p.base_price * s.cost_rate, 2);

INSERT INTO product_suppliers(product_id, supplier_id, supplier_sku, cost_price)
SELECT p.product_id, sp.supplier_id, CONCAT('NCC-', p.sku),
       ROUND(p.base_price * s.cost_rate, 2)
FROM tmp_seed_inventory s
JOIN products p ON p.product_slug = s.product_slug
JOIN suppliers sp ON sp.supplier_name = s.supplier_name
WHERE NOT EXISTS (
  SELECT 1 FROM product_suppliers ps
  WHERE ps.product_id = p.product_id AND ps.supplier_id = sp.supplier_id
);

-- Phiếu kho là dữ liệu lịch sử: chỉ thêm khi chưa tồn tại cùng sản phẩm + ghi chú.
INSERT INTO inventory_transactions(
  product_id, variant_id, supplier_id, staff_user_id, inventory_type_id,
  transaction_quantity, unit_cost, transaction_note
)
SELECT p.product_id, pv.variant_id, sp.supplier_id, staff.user_id,
       itt.inventory_type_id, vi.stock_quantity,
       ROUND(p.base_price * s.cost_rate, 2), s.transaction_note
FROM tmp_seed_inventory s
JOIN products p ON p.product_slug = s.product_slug
JOIN product_variants pv ON pv.product_id = p.product_id AND pv.is_default = TRUE
JOIN variant_inventory vi ON vi.variant_id = pv.variant_id
JOIN suppliers sp ON sp.supplier_name = s.supplier_name
JOIN users staff ON staff.user_email = s.staff_email
JOIN inventory_transaction_types itt ON itt.inventory_type_code = 'IN'
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_transactions it
  WHERE it.product_id = p.product_id
    AND it.transaction_note = s.transaction_note
);

-- ============================================================================
-- 7. THUỘC TÍNH VÀ THÔNG SỐ SẢN PHẨM
-- ============================================================================
INSERT INTO product_attributes(attribute_name, spec_group, attribute_unit, display_order, is_highlight) VALUES
('CPU', 'Bộ xử lý & Bộ nhớ', NULL, 1, TRUE),
('RAM', 'Bộ xử lý & Bộ nhớ', 'GB', 2, TRUE),
('Bộ nhớ trong', 'Bộ xử lý & Bộ nhớ', 'GB', 3, TRUE),
('GPU', 'Đồ họa', NULL, 1, TRUE),
('Kích thước màn hình', 'Màn hình', 'inch', 1, TRUE),
('Tần số quét', 'Màn hình', 'Hz', 2, FALSE),
('Dung lượng pin', 'Pin', 'mAh', 1, FALSE),
('Hệ điều hành', 'Phần mềm', NULL, 1, FALSE),
('Thông số chính', 'Cấu hình', NULL, 1, TRUE),
('Bộ nhớ', 'Cấu hình', NULL, 2, TRUE),
('Màn hình / Kích thước', 'Hiển thị', NULL, 3, TRUE),
('Kết nối', 'Kết nối', NULL, 4, FALSE),
('Màu sắc', 'Thiết kế', NULL, 5, FALSE),
('Xuất xứ', 'Thông tin chung', NULL, 6, FALSE)
ON DUPLICATE KEY UPDATE
  spec_group = VALUES(spec_group),
  attribute_unit = VALUES(attribute_unit),
  display_order = VALUES(display_order),
  is_highlight = VALUES(is_highlight);

UPDATE product_attribute_values pav
JOIN products p ON p.product_id = pav.product_id
JOIN tmp_seed_products seed_p ON seed_p.product_slug = p.product_slug
JOIN categories c ON c.category_id = p.category_id
LEFT JOIN brands b ON b.brand_id = p.brand_id
JOIN product_attributes a ON a.attribute_id = pav.attribute_id
SET pav.attribute_value = CASE a.attribute_name
  WHEN 'Thông số chính' THEN CASE c.category_slug
    WHEN 'laptop' THEN 'CPU hiệu năng cao, đồ họa tối ưu'
    WHEN 'dien-thoai' THEN 'Chip flagship, camera đa ống kính'
    WHEN 'phu-kien' THEN 'Thiết kế công thái học, hiệu suất ổn định'
    WHEN 'linh-kien-pc' THEN 'Chuẩn phần cứng thế hệ mới'
    ELSE 'Tấm nền IPS/VA chất lượng cao' END
  WHEN 'Bộ nhớ' THEN CASE c.category_slug
    WHEN 'laptop' THEN '16GB RAM, SSD 512GB'
    WHEN 'dien-thoai' THEN '12GB RAM, bộ nhớ 256GB'
    WHEN 'linh-kien-pc' THEN 'Theo cấu hình sản phẩm'
    ELSE 'Không áp dụng' END
  WHEN 'Màn hình / Kích thước' THEN CASE c.category_slug
    WHEN 'laptop' THEN '14–16 inch'
    WHEN 'dien-thoai' THEN '6.7 inch AMOLED'
    WHEN 'man-hinh' THEN 'Kích thước theo tên sản phẩm'
    ELSE 'Thiết kế nhỏ gọn' END
  WHEN 'Kết nối' THEN CASE c.category_slug
    WHEN 'phu-kien' THEN 'USB-C / Bluetooth'
    WHEN 'man-hinh' THEN 'HDMI / DisplayPort'
    ELSE 'Wi-Fi, Bluetooth, USB-C' END
  WHEN 'Màu sắc' THEN 'Màu tiêu chuẩn theo hãng'
  WHEN 'Xuất xứ' THEN CONCAT('Thương hiệu ', COALESCE(b.brand_name, 'Chính hãng'))
END
WHERE a.attribute_name IN (
  'Thông số chính', 'Bộ nhớ', 'Màn hình / Kích thước',
  'Kết nối', 'Màu sắc', 'Xuất xứ'
);

INSERT INTO product_attribute_values(product_id, attribute_id, attribute_value)
SELECT p.product_id, a.attribute_id,
  CASE a.attribute_name
    WHEN 'Thông số chính' THEN CASE c.category_slug
      WHEN 'laptop' THEN 'CPU hiệu năng cao, đồ họa tối ưu'
      WHEN 'dien-thoai' THEN 'Chip flagship, camera đa ống kính'
      WHEN 'phu-kien' THEN 'Thiết kế công thái học, hiệu suất ổn định'
      WHEN 'linh-kien-pc' THEN 'Chuẩn phần cứng thế hệ mới'
      ELSE 'Tấm nền IPS/VA chất lượng cao' END
    WHEN 'Bộ nhớ' THEN CASE c.category_slug
      WHEN 'laptop' THEN '16GB RAM, SSD 512GB'
      WHEN 'dien-thoai' THEN '12GB RAM, bộ nhớ 256GB'
      WHEN 'linh-kien-pc' THEN 'Theo cấu hình sản phẩm'
      ELSE 'Không áp dụng' END
    WHEN 'Màn hình / Kích thước' THEN CASE c.category_slug
      WHEN 'laptop' THEN '14–16 inch'
      WHEN 'dien-thoai' THEN '6.7 inch AMOLED'
      WHEN 'man-hinh' THEN 'Kích thước theo tên sản phẩm'
      ELSE 'Thiết kế nhỏ gọn' END
    WHEN 'Kết nối' THEN CASE c.category_slug
      WHEN 'phu-kien' THEN 'USB-C / Bluetooth'
      WHEN 'man-hinh' THEN 'HDMI / DisplayPort'
      ELSE 'Wi-Fi, Bluetooth, USB-C' END
    WHEN 'Màu sắc' THEN 'Màu tiêu chuẩn theo hãng'
    WHEN 'Xuất xứ' THEN CONCAT('Thương hiệu ', COALESCE(b.brand_name, 'Chính hãng'))
  END
FROM tmp_seed_products seed_p
JOIN products p ON p.product_slug = seed_p.product_slug
JOIN categories c ON c.category_id = p.category_id
LEFT JOIN brands b ON b.brand_id = p.brand_id
CROSS JOIN product_attributes a
WHERE a.attribute_name IN (
  'Thông số chính', 'Bộ nhớ', 'Màn hình / Kích thước',
  'Kết nối', 'Màu sắc', 'Xuất xứ'
)
AND NOT EXISTS (
  SELECT 1 FROM product_attribute_values pav
  WHERE pav.product_id = p.product_id
    AND pav.attribute_id = a.attribute_id
);

-- ============================================================================
-- 8. ĐÁNH GIÁ MẪU
-- ============================================================================
UPDATE product_reviews pr
JOIN products p ON p.product_id = pr.product_id
JOIN tmp_seed_products seed_p ON seed_p.product_slug = p.product_slug
JOIN users u ON u.user_id = pr.user_id
SET pr.rating = CASE MOD(p.product_id + u.user_id, 3) WHEN 0 THEN 4 ELSE 5 END,
    pr.review_title = 'Trải nghiệm sản phẩm',
    pr.review_content = 'Sản phẩm đúng mô tả, đóng gói tốt và sử dụng ổn định.',
    pr.is_verified_purchase = FALSE,
    pr.review_status = 'APPROVED',
    pr.helpful_count = MOD(p.product_id + u.user_id, 6)
WHERE u.user_email IN (
  'minhanh@example.com', 'giahuy@example.com',
  'khanhlinh@example.com', 'tuankiet@example.com'
);

INSERT INTO product_reviews(
  product_id, user_id, rating, review_title, review_content,
  is_verified_purchase, review_status, helpful_count
)
SELECT p.product_id, u.user_id,
       CASE MOD(p.product_id + u.user_id, 3) WHEN 0 THEN 4 ELSE 5 END,
       'Trải nghiệm sản phẩm',
       'Sản phẩm đúng mô tả, đóng gói tốt và sử dụng ổn định.',
       FALSE, 'APPROVED', MOD(p.product_id + u.user_id, 6)
FROM tmp_seed_products seed_p
JOIN products p ON p.product_slug = seed_p.product_slug
JOIN users u ON u.user_email IN (
  'minhanh@example.com', 'giahuy@example.com',
  'khanhlinh@example.com', 'tuankiet@example.com'
)
WHERE NOT EXISTS (
  SELECT 1 FROM product_reviews pr
  WHERE pr.product_id = p.product_id AND pr.user_id = u.user_id
);

UPDATE products p
LEFT JOIN (
  SELECT product_id, ROUND(AVG(rating), 2) AS average_rating, COUNT(*) AS review_count
  FROM product_reviews
  WHERE review_status = 'APPROVED'
  GROUP BY product_id
) r ON r.product_id = p.product_id
SET p.average_rating = COALESCE(r.average_rating, 0),
    p.review_count = COALESCE(r.review_count, 0);

-- ============================================================================
-- 9. ĐƠN HÀNG VÀ THANH TOÁN MẪU
-- ============================================================================
DROP TEMPORARY TABLE IF EXISTS tmp_seed_orders;
CREATE TEMPORARY TABLE tmp_seed_orders (
  order_code VARCHAR(100) NOT NULL PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  status_code VARCHAR(50) NOT NULL,
  order_note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  product_slug VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  payment_method_code VARCHAR(50) NOT NULL,
  payment_status_code VARCHAR(50) NOT NULL
);
INSERT INTO tmp_seed_orders(order_code, customer_email, status_code, order_note, created_at, product_slug, quantity, payment_method_code, payment_status_code) VALUES
('DH-20260722-001', 'minhanh@example.com', 'DELIVERED', 'Đơn hàng mẫu phục vụ báo cáo', '2026-07-22 08:30:00', 'asus-rog-strix-g16', 1, 'BANK_TRANSFER', 'PAID'),
('DH-20260722-002', 'giahuy@example.com', 'SHIPPING', 'Đơn hàng mẫu phục vụ báo cáo', '2026-07-22 09:45:00', 'iphone-16-pro-max-256gb', 1, 'BANK_TRANSFER', 'UNPAID'),
('DH-20260722-003', 'khanhlinh@example.com', 'CONFIRMED', 'Đơn hàng mẫu phục vụ báo cáo', '2026-07-22 10:20:00', 'lenovo-thinkpad-x1-carbon', 1, 'BANK_TRANSFER', 'UNPAID'),
('DH-20260722-004', 'tuankiet@example.com', 'PENDING', 'Đơn hàng mẫu phục vụ báo cáo', '2026-07-22 11:05:00', 'sony-wh-1000xm5', 1, 'BANK_TRANSFER', 'UNPAID'),
('DH-20260723-001', 'minhanh@example.com', 'DELIVERED', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-10 09:10:00', 'hp-pavilion-plus-14', 1, 'BANK_TRANSFER', 'PAID'),
('DH-20260723-002', 'giahuy@example.com', 'DELIVERED', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-11 10:20:00', 'xiaomi-14-ultra-512gb', 2, 'QR_BANKING', 'PAID'),
('DH-20260723-003', 'khanhlinh@example.com', 'DELIVERED', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-12 14:30:00', 'oppo-find-x7-256gb', 1, 'COD', 'PAID'),
('DH-20260723-004', 'tuankiet@example.com', 'SHIPPING', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-13 16:15:00', 'anker-735-gan-65w', 2, 'BANK_TRANSFER', 'PAID'),
('DH-20260723-005', 'minhanh@example.com', 'DELIVERED', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-14 08:45:00', 'razer-deathadder-v3', 1, 'QR_BANKING', 'PAID'),
('DH-20260723-006', 'giahuy@example.com', 'CONFIRMED', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-15 11:00:00', 'intel-core-i9-14900k', 2, 'COD', 'UNPAID'),
('DH-20260723-007', 'khanhlinh@example.com', 'DELIVERED', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-16 13:20:00', 'corsair-vengeance-32gb-ddr5', 1, 'BANK_TRANSFER', 'PAID'),
('DH-20260723-008', 'tuankiet@example.com', 'PACKING', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-17 15:40:00', 'nvidia-rtx-4070-super', 2, 'QR_BANKING', 'UNPAID'),
('DH-20260723-009', 'minhanh@example.com', 'DELIVERED', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-18 17:10:00', 'samsung-odyssey-g5-27', 1, 'COD', 'PAID'),
('DH-20260723-010', 'giahuy@example.com', 'SHIPPING', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-19 19:25:00', 'asus-proart-pa278qv', 2, 'BANK_TRANSFER', 'PAID'),
('DH-20260723-011', 'khanhlinh@example.com', 'PENDING', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-20 20:10:00', 'acer-nitro-vg240y', 1, 'QR_BANKING', 'UNPAID'),
('DH-20260723-012', 'tuankiet@example.com', 'DELIVERED', 'Đơn hàng mẫu phục vụ báo cáo quản trị', '2026-07-21 21:30:00', 'gigabyte-m32u-4k', 2, 'COD', 'PAID'),
('DH-20260721-001', 'minhanh@example.com', 'DELIVERED', 'Dữ liệu mẫu dashboard', '2026-07-21 09:32:00', 'asus-rog', 1, 'BANK_TRANSFER', 'PAID'),
('DH-20260721-002', 'giahuy@example.com', 'SHIPPING', 'Dữ liệu mẫu dashboard', '2026-07-21 10:15:00', 'iphone-16-pro-max', 1, 'BANK_TRANSFER', 'UNPAID'),
('DH-20260721-003', 'khanhlinh@example.com', 'CONFIRMED', 'Dữ liệu mẫu dashboard', '2026-07-21 11:20:00', 'lenovo-thinkpad', 1, 'BANK_TRANSFER', 'UNPAID'),
('DH-20260721-004', 'tuankiet@example.com', 'PENDING', 'Dữ liệu mẫu dashboard', '2026-07-21 13:05:00', 'sony-wh-1000xm5', 1, 'BANK_TRANSFER', 'UNPAID')
;

UPDATE orders o
JOIN tmp_seed_orders s ON s.order_code = o.order_code
JOIN users u ON u.user_email = s.customer_email
JOIN order_statuses os ON os.order_status_code = s.status_code
SET o.customer_id = u.user_id,
    o.order_status_id = os.order_status_id,
    o.order_note = s.order_note,
    o.order_created_at = s.created_at;

INSERT INTO orders(order_code, customer_id, order_status_id, order_note, order_created_at)
SELECT s.order_code, u.user_id, os.order_status_id, s.order_note, s.created_at
FROM tmp_seed_orders s
JOIN users u ON u.user_email = s.customer_email
JOIN order_statuses os ON os.order_status_code = s.status_code
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.order_code = s.order_code
);

-- Chỉ UPDATE order item khi đơn mẫu hiện có đúng 1 dòng; nếu chưa có thì INSERT.
UPDATE order_items oi
JOIN (
  SELECT order_id
  FROM order_items
  GROUP BY order_id
  HAVING COUNT(*) = 1
) one_item ON one_item.order_id = oi.order_id
JOIN orders o ON o.order_id = oi.order_id
JOIN tmp_seed_orders s ON s.order_code = o.order_code
JOIN products p ON p.product_slug = s.product_slug
LEFT JOIN product_variants pv ON pv.product_id = p.product_id AND pv.is_default = TRUE
SET oi.product_id = p.product_id,
    oi.variant_id = pv.variant_id,
    oi.ordered_quantity = s.quantity,
    oi.unit_price_at_order = p.base_price;

INSERT INTO order_items(order_id, product_id, variant_id, ordered_quantity, unit_price_at_order)
SELECT o.order_id, p.product_id, pv.variant_id, s.quantity, p.base_price
FROM tmp_seed_orders s
JOIN orders o ON o.order_code = s.order_code
JOIN products p ON p.product_slug = s.product_slug
LEFT JOIN product_variants pv ON pv.product_id = p.product_id AND pv.is_default = TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.order_id = o.order_id
);

UPDATE payments pay
JOIN orders o ON o.order_id = pay.order_id
JOIN tmp_seed_orders s ON s.order_code = o.order_code
JOIN vw_order_totals total ON total.order_id = o.order_id
JOIN payment_methods pm ON pm.payment_method_code = s.payment_method_code
JOIN payment_statuses ps ON ps.payment_status_code = s.payment_status_code
SET pay.payment_method_id = pm.payment_method_id,
    pay.payment_status_id = ps.payment_status_id,
    pay.payment_code = CONCAT('PAY-', o.order_code),
    pay.payment_amount = total.total_amount,
    pay.transaction_code = CONCAT('TXN-', o.order_code),
    pay.paid_at = CASE WHEN s.payment_status_code = 'PAID' THEN o.order_created_at ELSE NULL END;

INSERT INTO payments(
  order_id, payment_method_id, payment_status_id, payment_code,
  payment_amount, transaction_code, paid_at
)
SELECT o.order_id, pm.payment_method_id, ps.payment_status_id,
       CONCAT('PAY-', o.order_code), total.total_amount,
       CONCAT('TXN-', o.order_code),
       CASE WHEN s.payment_status_code = 'PAID' THEN o.order_created_at ELSE NULL END
FROM tmp_seed_orders s
JOIN orders o ON o.order_code = s.order_code
JOIN vw_order_totals total ON total.order_id = o.order_id
JOIN payment_methods pm ON pm.payment_method_code = s.payment_method_code
JOIN payment_statuses ps ON ps.payment_status_code = s.payment_status_code
WHERE NOT EXISTS (
  SELECT 1 FROM payments pay WHERE pay.order_id = o.order_id
);

-- ============================================================================
-- 10. PHÂN BỔ NHÂN VIÊN, CẤU HÌNH AI VÀ AUDIT
-- ============================================================================
UPDATE products p
JOIN (
  SELECT 'macbook-air-m3-15' AS slug, 'staff.sanpham@cnpm.local' AS email UNION ALL
  SELECT 'acer-predator-helios-neo-16', 'staff.sanpham@cnpm.local' UNION ALL
  SELECT 'google-pixel-9-pro-256gb', 'staff.donhang@cnpm.local' UNION ALL
  SELECT 'oppo-reno-12-pro-5g', 'staff.donhang@cnpm.local' UNION ALL
  SELECT 'amd-ryzen-7-7800x3d', 'staff.kho@cnpm.local' UNION ALL
  SELECT 'lg-ultragear-27gp850', 'staff.kho@cnpm.local'
) workload ON workload.slug = p.product_slug
JOIN users staff ON staff.user_email = workload.email
SET p.created_by_user_id = staff.user_id;

INSERT INTO ai_configs(config_key, config_value, config_description, is_enabled) VALUES
('AI_SEARCH_PROVIDER', 'internal', 'Nhà cung cấp dịch vụ tìm kiếm thông minh', TRUE),
('AI_SEARCH_LIMIT', '8', 'Số kết quả tối đa cho mỗi truy vấn', TRUE),
('AI_SAFE_MODE', 'strict', 'Mức kiểm soát nội dung đầu vào', TRUE)
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  config_description = VALUES(config_description),
  is_enabled = VALUES(is_enabled);

INSERT INTO audit_logs(
  actor_user_id, action_name, affected_table_name,
  affected_record_id, action_description
)
SELECT u.user_id, 'SEED_ADMIN_SAMPLE', 'products', NULL,
       'Bổ sung dữ liệu mẫu cho dashboard quản trị'
FROM users u
WHERE u.user_email = 'admin@cnpm.local'
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs a
    WHERE a.action_name = 'SEED_ADMIN_SAMPLE'
  );

-- ============================================================================
-- 11. KẾT THÚC VÀ KIỂM TRA NHANH
-- ============================================================================
DROP TEMPORARY TABLE IF EXISTS tmp_seed_orders;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_inventory;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_images;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_products;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_users;

COMMIT;

SELECT 'roles' AS table_name, COUNT(*) AS total_rows FROM roles
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'brands', COUNT(*) FROM brands
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL SELECT 'product_variants', COUNT(*) FROM product_variants
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions;
