import Banner from "./Banner";
import ScrollToTopOnMount from "../template/ScrollToTopOnMount";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import DealImage from "../nillkin-case.webp";
import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

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

const featuredPageSize = 6;

function normalizeProduct(item) {
  const imageUrl =
    item.image_url ||
    item.imageUrl ||
    item.image ||
    item.thumbnail ||
    "";

  return {
    id: item.id ?? item.product_id,

    slug:
      item.slug ??
      item.product_slug ??
      String(item.id ?? item.product_id ?? ""),

    name:
      item.name ??
      item.product_name ??
      "Sản phẩm chưa có tên",

    price: Number(
      item.price ??
      item.base_price ??
      0
    ),

    category:
      item.category ??
      item.category_name ??
      item.category_slug ??
      "Sản phẩm",

    brand:
      item.brand ??
      item.brand_name ??
      "",

    imageUrl,

    rating: Number(
      item.rating ??
      item.average_rating ??
      0
    ),

    reviewCount: Number(
      item.reviewCount ??
      item.review_count ??
      0
    ),

    percentOff: Number(
      item.percent_off ??
      item.percentOff ??
      item.discount_percent ??
      0
    ),
  };
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function Landing() {
  const [products, setProducts] = useState([]);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/products`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Backend trả về lỗi ${response.status}`
          );
        }

        const result = await response.json();

        const rawProducts = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];

        setProducts(rawProducts.map(normalizeProduct));
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error(
          "Lỗi tải sản phẩm trang chủ:",
          err
        );

        setError(
          err.message ||
            "Không thể tải sản phẩm từ backend."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, []);

  const featuredPageCount = Math.max(
    1,
    Math.ceil(products.length / featuredPageSize)
  );

  const featuredProductsOnPage = useMemo(() => {
    const start =
      (featuredPage - 1) * featuredPageSize;

    return products.slice(
      start,
      start + featuredPageSize
    );
  }, [products, featuredPage]);

  useEffect(() => {
    if (featuredPage > featuredPageCount) {
      setFeaturedPage(featuredPageCount);
    }
  }, [featuredPage, featuredPageCount]);

  function goToFeaturedPage(page) {
    setFeaturedPage(
      Math.min(
        Math.max(page, 1),
        featuredPageCount
      )
    );
  }

  return (
    <>
      <ScrollToTopOnMount />

      <Banner />

      {/* SẢN PHẨM NỔI BẬT */}
      <section className="home-products home-products-priority home-tech-grid">
        <div className="home-tech-orb home-tech-orb-one" />
        <div className="home-tech-orb home-tech-orb-two" />

        <div className="container px-lg-5 position-relative">
          <div className="home-section-heading d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4 home-reveal">
            <div>
              <span className="home-intro-eyebrow">
                Đang được xem nhiều
              </span>

              <h2 className="fw-bold mb-1">
                Sản phẩm nổi bật
              </h2>

              <p className="text-muted mb-0">
                Dữ liệu sản phẩm được lấy trực tiếp từ
                backend và database.
              </p>
            </div>

            <Link
              to="/products"
              className="btn btn-outline-dark"
            >
              Xem tất cả
            </Link>
          </div>

          {loading ? (
            <div className="home-loading-state">
              <div className="home-loader-ring" />

              <p className="mb-0">
                Đang đồng bộ sản phẩm...
              </p>
            </div>
          ) : error ? (
            <div className="alert alert-danger home-error-card">
              <strong>
                Không tải được sản phẩm
              </strong>

              <div>{error}</div>

              <small>
                Kiểm tra backend tại:
                http://localhost:3001/api/products
              </small>
            </div>
          ) : featuredProductsOnPage.length === 0 ? (
            <div className="home-empty-state">
              Chưa có sản phẩm trong database.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {featuredProductsOnPage.map(
                (product, index) => (
                  <div
                    className="col home-product-fall"
                    style={{
                      "--fall-index": index,
                    }}
                    key={product.id}
                  >
                    <article className="home-product-card home-tech-product-card card border-0 shadow-sm">
                      <Link
                        to={`/products/${product.slug}`}
                        className="home-product-media"
                      >
                        <span className="home-product-badge">
                          {product.percentOff > 0
                            ? `-${product.percentOff}%`
                            : "Nổi bật"}
                        </span>

                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src =
                              "https://placehold.co/800x600?text=No+Image";
                          }}
                        />

                        <span className="home-product-scanline" />
                      </Link>

                      <div className="card-body d-flex flex-column">
                        <div className="home-product-meta-row">
                          <span>
                            {product.category}
                          </span>

                          <span>
                            <FontAwesomeIcon
                              icon={["fas", "star"]}
                            />

                            {product.rating.toFixed(1)}
                          </span>
                        </div>

                        <h3 className="card-title">
                          {product.name}
                        </h3>

                        {product.brand && (
                          <p className="home-product-brand">
                            {product.brand}
                          </p>
                        )}

                        <div className="home-product-price">
                          {formatPrice(product.price)} đ
                        </div>

                        <div className="home-product-actions mt-auto">
                          <Link
                            to={`/products/${product.slug}`}
                            className="btn btn-outline-dark"
                          >
                            Xem chi tiết
                          </Link>

                          <button
                            type="button"
                            className="btn home-add-cart-btn"
                          >
                            <FontAwesomeIcon
                              icon={[
                                "fas",
                                "cart-plus",
                              ]}
                            />

                            Thêm giỏ
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                )
              )}
            </div>
          )}

          {!loading &&
            !error &&
            products.length > featuredPageSize && (
              <nav
                className="home-featured-pagination"
                aria-label="Phân trang sản phẩm nổi bật"
              >
                <button
                  type="button"
                  className="home-page-btn"
                  disabled={featuredPage === 1}
                  onClick={() =>
                    goToFeaturedPage(
                      featuredPage - 1
                    )
                  }
                >
                  <FontAwesomeIcon
                    icon={[
                      "fas",
                      "chevron-left",
                    ]}
                  />
                </button>

                {Array.from(
                  {
                    length: featuredPageCount,
                  },
                  (_, index) => {
                    const page = index + 1;

                    return (
                      <button
                        key={page}
                        type="button"
                        className={
                          "home-page-number " +
                          (featuredPage === page
                            ? "is-active"
                            : "")
                        }
                        onClick={() =>
                          goToFeaturedPage(page)
                        }
                      >
                        {page}
                      </button>
                    );
                  }
                )}

                <button
                  type="button"
                  className="home-page-btn"
                  disabled={
                    featuredPage ===
                    featuredPageCount
                  }
                  onClick={() =>
                    goToFeaturedPage(
                      featuredPage + 1
                    )
                  }
                >
                  <FontAwesomeIcon
                    icon={[
                      "fas",
                      "chevron-right",
                    ]}
                  />
                </button>
              </nav>
            )}
        </div>
      </section>

      {/* KHUYẾN MÃI */}
      <section className="home-deal-spotlight">
        <div className="container">
          <div className="home-deal-layout home-shape-drop">
            <div className="home-deal-copy">
              <span className="home-intro-eyebrow">
                Ưu đãi đáng xem
              </span>

              <h2>
                Combo phụ kiện bảo vệ thiết bị
              </h2>

              <p>
                Chọn nhanh các món cần thiết cho
                điện thoại và laptop: ốp bảo vệ,
                sạc nhanh, tai nghe và phụ kiện
                làm việc hằng ngày.
              </p>

              <div className="home-deal-points">
                <span>
                  <FontAwesomeIcon
                    icon={["fas", "check"]}
                  />
                  Hàng sẵn kho
                </span>

                <span>
                  <FontAwesomeIcon
                    icon={["fas", "check"]}
                  />
                  Đổi trả dễ dàng
                </span>
              </div>

              <Link
                to="/products"
                className="btn btn-warning btn-lg"
              >
                Xem ưu đãi
              </Link>
            </div>

            <div className="home-deal-product">
              <span className="home-product-badge">
                Hot pick
              </span>

              <img
                src={DealImage}
                alt="Ốp lưng Nillkin đang có ưu đãi"
              />
            </div>
          </div>
        </div>
      </section>

      {/* DANH MỤC */}
      <section className="home-category-showcase">
        <div className="container">
          <div className="home-section-heading d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4 home-reveal">
            <div>
              <span className="home-intro-eyebrow">
                Mua nhanh theo nhu cầu
              </span>

              <h2 className="fw-bold mb-1">
                Danh mục nổi bật
              </h2>
            </div>

            <Link
              to="/products"
              className="btn btn-outline-dark"
            >
              Xem cửa hàng
            </Link>
          </div>

          <div className="home-category-grid">
            {categoryHighlights.map(
              (item, index) => (
                <Link
                  key={item.slug}
                  to={item.slug}
                  className="home-category-tile home-shape-drop"
                  style={{
                    "--tile-index": index,
                  }}
                >
                  <span className="home-category-icon">
                    <FontAwesomeIcon
                      icon={[
                        "fas",
                        item.icon,
                      ]}
                    />
                  </span>

                  <span>
                    <strong>
                      {item.title}
                    </strong>

                    <small>{item.note}</small>
                  </span>

                  <FontAwesomeIcon
                    icon={[
                      "fas",
                      "chevron-right",
                    ]}
                    className="home-category-arrow"
                  />
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* DỊCH VỤ */}
      <section className="container home-services">
        <div className="row text-center g-4">
          <div className="col-md-4">
            <div className="home-service-card home-shape-drop">
              <span className="home-service-icon home-service-icon-primary">
                <FontAwesomeIcon
                  icon={["fas", "truck"]}
                />
              </span>

              <h5>Giao hàng nhanh</h5>

              <p>
                Hỗ trợ giao hàng toàn quốc nhanh
                chóng và an toàn.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="home-service-card home-shape-drop">
              <span className="home-service-icon home-service-icon-success">
                <FontAwesomeIcon
                  icon={[
                    "fas",
                    "shield-alt",
                  ]}
                />
              </span>

              <h5>Bảo hành chính hãng</h5>

              <p>
                Cam kết sản phẩm chất lượng và bảo
                hành uy tín.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="home-service-card home-shape-drop">
              <span className="home-service-icon home-service-icon-danger">
                <FontAwesomeIcon
                  icon={[
                    "fas",
                    "credit-card",
                  ]}
                />
              </span>

              <h5>Thanh toán QR</h5>

              <p>
                Hỗ trợ thanh toán nhanh bằng mã QR
                chuyển khoản.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GIỚI THIỆU */}
      <section className="home-intro text-center home-reveal">
        <div className="container">
          <span className="home-intro-eyebrow">
            Cửa hàng công nghệ chính hãng
          </span>

          <h2 className="home-title fw-bold">
            ElectroShop
          </h2>

          <p className="home-description mt-3 text-muted mx-auto">
            Website bán đồ điện tử hiện đại với
            các sản phẩm công nghệ, điện thoại,
            laptop, phụ kiện và linh kiện chất
            lượng cao.
          </p>

          <div className="home-trust-strip">
            <div>
              <strong>24h</strong>
              <span>
                giao nhanh nội thành
              </span>
            </div>

            <div>
              <strong>12 tháng</strong>
              <span>
                bảo hành rõ ràng
              </span>
            </div>

            <div>
              <strong>0%</strong>
              <span>
                hỗ trợ trả góp
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Landing;