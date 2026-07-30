import ScrollToTopOnMount from "../template/ScrollToTopOnMount";
import "./landing-premium.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import DealImage from "../nillkin-case.webp";
import PremiumImageOne from "../nillkin-case.webp";
import PremiumImageTwo from "../nillkin-case.jpg";
import PremiumImageThree from "../nillkin-case-1.jpg";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const featuredPageSize = 8;
const premiumShowcase = [
  { image: PremiumImageOne, name: "Phụ kiện bảo vệ thế hệ mới", note: "Thiết kế chắc chắn với chiều sâu vật liệu nổi bật." },
  { image: PremiumImageTwo, name: "Phong cách công nghệ hiện đại", note: "Hoàn thiện tinh tế, bền bỉ và tối giản trong từng đường nét." },
  { image: PremiumImageThree, name: "Sẵn sàng cho mọi chuyển động", note: "Phiên bản cá tính dành cho người yêu công nghệ khác biệt." },
];
const flipDuration = 1400;

function PremiumIntro({ products }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState("right");
  const swapTimer = useRef(null);
  const finishTimer = useRef(null);
  const autoTimer = useRef(null);
  const animationLock = useRef(false);
  const showcaseProducts = useMemo(() => {
    const available = products.filter(product => product.imageUrl).slice(0, 10).map(product => ({
      image: product.imageUrl,
      name: product.name,
      note: `${product.brand || product.category} · Sản phẩm nổi bật tại ElectroShop`,
      price: product.price,
      category: product.category,
      slug: product.slug,
    }));
    return available.length ? available : premiumShowcase.map((item,index) => ({...item,price:0,category:"Phụ kiện",slug:String(index + 1)}));
  }, [products]);
  const activeProduct = showcaseProducts[activeIndex % showcaseProducts.length];

  useEffect(() => () => {
    window.clearTimeout(swapTimer.current);
    window.clearTimeout(finishTimer.current);
    window.clearTimeout(autoTimer.current);
  }, []);

  const flipProduct = useCallback(() => {
    if (animationLock.current) return;
    animationLock.current = true;
    setIsFlipping(true);
    setDirection((current) => current === "right" ? "left" : "right");
    swapTimer.current = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % showcaseProducts.length);
    }, flipDuration / 2);
    finishTimer.current = window.setTimeout(() => {
      animationLock.current = false;
      setIsFlipping(false);
    }, flipDuration);
  }, [showcaseProducts.length]);

  useEffect(() => {
    if (isFlipping) return undefined;
    autoTimer.current = window.setTimeout(flipProduct, 3200);
    return () => window.clearTimeout(autoTimer.current);
  }, [activeIndex, isFlipping, flipProduct]);

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      flipProduct();
    }
  }

  return (
    <section className="premium-intro" aria-labelledby="premium-title">
      <div className="premium-space-orb premium-space-orb-one" />
      <div className="premium-space-orb premium-space-orb-two" />
      <header className="premium-intro-copy">
        <span className="premium-kicker">Công nghệ chuyển động cùng bạn</span>
        <h1 id="premium-title">Khám phá sản phẩm <span>theo cách sống động hơn</span></h1>
        <p>Sản phẩm tự động chuyển động và thay đổi để bạn khám phá trọn vẹn từng thiết kế.</p>
      </header>
      <div className={`premium-live-scene premium-layout-${direction} ${isFlipping ? "is-flipping" : ""}`}>
      <div
        className={`premium-stage premium-slide-${direction} ${isFlipping ? "is-flipping" : ""}`}
        role="button"
        tabIndex="0"
        aria-label={`Đổi sản phẩm, hiện tại là ${activeProduct.name}`}
        aria-busy={isFlipping}
        onClick={flipProduct}
        onKeyDown={handleKeyDown}
        onAnimationEnd={() => { animationLock.current = false; setIsFlipping(false); }}
      >
        <div className="premium-stage-glow" />
        <article className="premium-3d-card">
          <img key={activeProduct.image} src={activeProduct.image} alt={activeProduct.name} draggable="false" />
          <div className="premium-card-shine" />
          <div className="premium-card-label"><span>{activeProduct.category || "ElectroShop Selection"}</span><strong>{String(activeIndex + 1).padStart(2, "0")}</strong></div>
        </article>
        <span className="premium-click-hint"><i /> Nhấn để đổi sản phẩm</span>
      </div>
      <div className="premium-info-stage">
      <div key={activeProduct.name} className="premium-product-copy">
        <span className="premium-scene-category">{activeProduct.category}</span>
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(showcaseProducts.length).padStart(2, "0")}</span>
        <h2>{activeProduct.name}</h2>
        <p>{activeProduct.note}</p>
        {activeProduct.price > 0 && <strong className="premium-live-price">{formatPrice(activeProduct.price)} đ</strong>}
        <div className="premium-dots">{showcaseProducts.map((product, index) => <i key={`${product.slug}-${index}`} className={index === activeIndex ? "active" : ""} />)}</div>
        <Link to={`/products/${activeProduct.slug}`} className="premium-contact-cta"><span>Mua ngay</span><b>→</b></Link>
      </div>
      </div>
      </div>
    </section>
  );
}

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

      <PremiumIntro products={products} />

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
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
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
                            <span className="home-rating-stars" aria-label={`${product.rating.toFixed(1)} trên 5 sao`}>
                              {[1,2,3,4,5].map(star => <FontAwesomeIcon key={star} icon={[star <= Math.round(product.rating) ? "fas" : "far", "star"]}/>)}
                            </span>
                            <b>{product.rating.toFixed(1)}</b>
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

      {/* SẢN PHẨM ƯU ĐÃI */}
      {!loading && !error && products.length > 0 && (
        <section className="home-offer-products">
          <div className="container px-lg-5">
            <div className="home-offer-heading">
              <div><span className="home-intro-eyebrow">Giá tốt trong hôm nay</span><h2>Sản phẩm đang được ưu đãi</h2><p>Những lựa chọn nổi bật với mức giá hấp dẫn và số lượng có hạn.</p></div>
              <Link to="/products" className="home-offer-link">Xem tất cả <FontAwesomeIcon icon={["fas","arrow-right"]}/></Link>
            </div>
            <div className="home-offer-grid">
              {(products.filter(item => item.percentOff > 0).length ? products.filter(item => item.percentOff > 0) : products).slice(0, 4).map((product, index) => (
                <Link to={`/products/${product.slug}`} className="home-offer-card" key={product.id} style={{"--offer-index":index}}>
                  <div className="home-offer-image"><img src={product.imageUrl} alt={product.name} loading="lazy" onError={event => { event.currentTarget.src="https://placehold.co/600x600?text=ElectroShop"; }}/><span>{product.percentOff > 0 ? `-${product.percentOff}%` : "Giá tốt"}</span></div>
                  <div className="home-offer-info"><small>{product.brand || product.category}</small><h3>{product.name}</h3><strong>{formatPrice(product.price)} đ</strong><span className="home-offer-cta">Xem ưu đãi <FontAwesomeIcon icon={["fas","arrow-right"]}/></span></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
