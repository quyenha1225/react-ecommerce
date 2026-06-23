import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="eshop-footer-compact">
      <div className="container eshop-footer-promises">
        <div>
          <FontAwesomeIcon icon={["fas", "truck"]} />
          <span>Giao nhanh toàn quốc</span>
        </div>
        <div>
          <FontAwesomeIcon icon={["fas", "shield-alt"]} />
          <span>Bảo hành minh bạch</span>
        </div>
        <div>
          <FontAwesomeIcon icon={["fas", "credit-card"]} />
          <span>Thanh toán linh hoạt</span>
        </div>
      </div>

      <div className="container eshop-footer-row">
        <div className="eshop-footer-brand">
          <h5>ElectroShop</h5>
          <p>
            Website bán đồ điện tử, laptop, điện thoại và phụ kiện công nghệ với
            trải nghiệm mua sắm nhanh, gọn và đáng tin cậy.
          </p>
        </div>

        <div>
          <h6>Danh mục</h6>
          <p><Link to="/category/dien-thoai">Điện thoại</Link></p>
          <p><Link to="/category/laptop">Laptop</Link></p>
          <p><Link to="/category/phu-kien">Phụ kiện</Link></p>
        </div>

        <div>
          <h6>Hỗ trợ</h6>
          <p><Link to="/about">Hướng dẫn mua hàng</Link></p>
          <p><Link to="/about">Thanh toán QR</Link></p>
          <p><Link to="/about">Bảo hành</Link></p>
        </div>

        <div>
          <h6>Liên hệ</h6>
          <p className="eshop-footer-contact">
            <FontAwesomeIcon icon={["fas", "envelope"]} />
            <a href="mailto:electroshop@gmail.com">electroshop@gmail.com</a>
          </p>
          <p className="eshop-footer-contact">
            <FontAwesomeIcon icon={["fas", "phone-alt"]} />
            <a href="tel:0385416387">0385416387</a>
          </p>

          <div className="footer-social-links">
            <a href="#!" aria-label="Facebook">
              <FontAwesomeIcon icon={["fab", "facebook-f"]} />
            </a>
            <a href="#!" aria-label="Instagram">
              <FontAwesomeIcon icon={["fab", "instagram"]} />
            </a>
            <a href="#!" aria-label="TikTok">
              <FontAwesomeIcon icon={["fab", "tiktok"]} />
            </a>
          </div>
        </div>
      </div>

      <div className="eshop-footer-bottom-small">
        Copyright © 2026 ElectroShop. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
