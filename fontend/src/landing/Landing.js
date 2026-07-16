import Banner from "./Banner";
import FeatureProduct from "./FeatureProduct";
import ScrollToTopOnMount from "../template/ScrollToTopOnMount";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import DealImage from "../nillkin-case.webp";
import { useState } from "react";

const categoryHighlights = [
  {
    title: "Điện thoại",
    slug: "/category/dien-thoai",
    icon: "mobile-alt",
    note: "Mẫu mới mỗi tuần",
  },
  {
    title: "Laptop",
    slug: "/category/laptop",
    icon: "laptop",
    note: "Gaming, văn phòng",
  },
  {
    title: "Phụ kiện",
    slug: "/category/phu-kien",
    icon: "headphones",
    note: "Sạc, tai nghe, case",
  },
  {
    title: "Linh kiện PC",
    slug: "/category/linh-kien-pc",
    icon: "microchip",
    note: "Nâng cấp hiệu năng",
  },
];

const featuredProducts = Array.from({ length: 18 }, (_, index) => index);
const featuredPageSize = 6;

function Landing() {
  const [featuredPage, setFeaturedPage] = useState(1);
  const featuredPageCount = Math.ceil(featuredProducts.length / featuredPageSize);
  const featuredProductsOnPage = featuredProducts.slice(
    (featuredPage - 1) * featuredPageSize,
    featuredPage * featuredPageSize
  );

  function goToFeaturedPage(page) {
    setFeaturedPage(Math.min(Math.max(page, 1), featuredPageCount));
  }

  return (
    <>
      <ScrollToTopOnMount />

      <Banner />

      <section className="home-products home-products-priority">
        <div className="container px-lg-5">
          <div className="home-section-heading d-flex justify-content-between align-items-center mb-4 home-animate">
            <div>
              <span className="home-intro-eyebrow">Đang được xem nhiều</span>
              <h2 className="fw-bold mb-1">Sản phẩm nổi bật</h2>
              <p className="text-muted mb-0">
                Các món công nghệ dễ mua, dễ dùng và đang có ưu đãi tốt.
              </p>
            </div>

            <Link to="/products" className="btn btn-outline-dark">
              Xem tất cả
            </Link>
          </div>

          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {featuredProductsOnPage.map((i) => (
              <FeatureProduct key={i} />
            ))}
          </div>

          <nav
            className="home-featured-pagination"
            aria-label="Phân trang sản phẩm nổi bật"
          >
            <button
              type="button"
              className="home-page-btn"
              disabled={featuredPage === 1}
              onClick={() => goToFeaturedPage(featuredPage - 1)}
              aria-label="Trang trước"
            >
              <FontAwesomeIcon icon={["fas", "chevron-left"]} />
            </button>

            {Array.from({ length: featuredPageCount }, (_, index) => {
              const page = index + 1;

              return (
                <button
                  key={page}
                  type="button"
                  className={
                    "home-page-number " +
                    (featuredPage === page ? "is-active" : "")
                  }
                  onClick={() => goToFeaturedPage(page)}
                  aria-current={featuredPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              className="home-page-btn"
              disabled={featuredPage === featuredPageCount}
              onClick={() => goToFeaturedPage(featuredPage + 1)}
              aria-label="Trang sau"
            >
              <FontAwesomeIcon icon={["fas", "chevron-right"]} />
            </button>
          </nav>
        </div>
      </section>

      <section className="home-deal-spotlight">
        <div className="container">
          <div className="home-deal-layout home-animate">
            <div className="home-deal-copy">
              <span className="home-intro-eyebrow">Ưu đãi đáng xem</span>
              <h2>Combo phụ kiện bảo vệ thiết bị</h2>
              <p>
                Chọn nhanh các món cần thiết cho điện thoại và laptop: ốp bảo vệ,
                sạc nhanh, tai nghe và phụ kiện làm việc hằng ngày.
              </p>

              <div className="home-deal-points">
                <span>
                  <FontAwesomeIcon icon={["fas", "check"]} />
                  Hàng sẵn kho
                </span>
                <span>
                  <FontAwesomeIcon icon={["fas", "check"]} />
                  Đổi trả dễ dàng
                </span>
              </div>

              <Link to="/products" className="btn btn-warning btn-lg">
                Xem ưu đãi
              </Link>
            </div>

            <div className="home-deal-product">
              <span className="home-product-badge">Hot pick</span>
              <img src={DealImage} alt="Ốp lưng Nillkin đang có ưu đãi" />
            </div>
          </div>
        </div>
      </section>

      <section className="home-category-showcase">
        <div className="container">
          <div className="home-section-heading d-flex justify-content-between align-items-center mb-4 home-animate">
            <div>
              <span className="home-intro-eyebrow">Mua nhanh theo nhu cầu</span>
              <h2 className="fw-bold mb-1">Danh mục nổi bật</h2>
            </div>

            <Link to="/products" className="btn btn-outline-dark">
              Xem cửa hàng
            </Link>
          </div>

          <div className="home-category-grid">
            {categoryHighlights.map((item, index) => (
              <Link
                key={item.slug}
                to={item.slug}
                className="home-category-tile home-animate"
                style={{ "--tile-index": index }}
              >
                <span className="home-category-icon">
                  <FontAwesomeIcon icon={["fas", item.icon]} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.note}</small>
                </span>
                <FontAwesomeIcon
                  icon={["fas", "chevron-right"]}
                  className="home-category-arrow"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container home-services">
        <div className="row text-center g-4">
          <div className="col-md-4">
            <div className="home-service-card home-animate home-delay-1">
              <span className="home-service-icon home-service-icon-primary">
                <FontAwesomeIcon icon={["fas", "truck"]} />
              </span>
              <h5>Giao hàng nhanh</h5>
              <p>Hỗ trợ giao hàng toàn quốc nhanh chóng và an toàn.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="home-service-card home-animate home-delay-2">
              <span className="home-service-icon home-service-icon-success">
                <FontAwesomeIcon icon={["fas", "shield-alt"]} />
              </span>
              <h5>Bảo hành chính hãng</h5>
              <p>Cam kết sản phẩm chất lượng và bảo hành uy tín.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="home-service-card home-animate home-delay-3">
              <span className="home-service-icon home-service-icon-danger">
                <FontAwesomeIcon icon={["fas", "credit-card"]} />
              </span>
              <h5>Thanh toán QR</h5>
              <p>Hỗ trợ thanh toán nhanh bằng mã QR chuyển khoản.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-intro text-center home-animate">
        <div className="container">
          <span className="home-intro-eyebrow">Cửa hàng công nghệ chính hãng</span>
          <h2 className="home-title fw-bold">ElectroShop</h2>

          <p className="home-description mt-3 text-muted mx-auto">
            Website bán đồ điện tử hiện đại với các sản phẩm công nghệ,
            điện thoại, laptop, phụ kiện và linh kiện chất lượng cao.
          </p>

          <div className="home-trust-strip">
            <div>
              <strong>24h</strong>
              <span>giao nhanh nội thành</span>
            </div>
            <div>
              <strong>12 tháng</strong>
              <span>bảo hành rõ ràng</span>
            </div>
            <div>
              <strong>0%</strong>
              <span>hỗ trợ trả góp</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Landing;
