import BannerZero from "./banner-0.jpg";
import BannerOne from "./banner-1.jpg";
import BannerTwo from "./banner-2.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

function BannerIndicator(props) {
  return (
    <button
      type="button"
      data-bs-target="#bannerIndicators"
      data-bs-slide-to={props.index}
      className={props.active ? "active" : ""}
      aria-current={props.active}
    />
  );
}

function BannerImage(props) {
  return (
    <div
      className={"carousel-item " + (props.active ? "active" : "")}
      data-bs-interval="5000"
    >
      <div className="ratio home-banner-ratio">
        <img
          className="d-block w-100 h-100 bg-dark cover"
          alt={props.alt}
          src={props.image}
        />
      </div>
    </div>
  );
}

function Banner() {
  return (
    <div
      id="bannerIndicators"
      className="carousel slide home-banner"
      data-bs-ride="carousel"
    >
      <div className="carousel-indicators">
        <BannerIndicator index="0" active={true} />
        <BannerIndicator index="1" />
        <BannerIndicator index="2" />
      </div>
      <div className="carousel-inner">
        <BannerImage
          image={BannerZero}
          alt="Bộ sưu tập thiết bị công nghệ ElectroShop"
          active={true}
        />
        <BannerImage image={BannerOne} alt="Laptop và phụ kiện cao cấp" />
        <BannerImage image={BannerTwo} alt="Điện thoại và thiết bị thông minh" />
      </div>

      <div className="home-banner-overlay">
        <div className="container home-banner-content">
          <div className="home-banner-copy">
            <span className="home-banner-kicker">Tech deals 2026</span>
            <h1>ElectroShop</h1>
            <p>
              Laptop, điện thoại và phụ kiện chính hãng với giao diện mua sắm
              nhanh, gọn và hiện đại.
            </p>
            <div className="home-banner-actions">
              <Link to="/products" className="btn btn-warning btn-lg" replace>
                Mua ngay
              </Link>
              <Link
                to="/category/laptop"
                className="btn btn-outline-light btn-lg"
                replace
              >
                Xem laptop
              </Link>
            </div>
          </div>

          <div className="home-banner-highlights" aria-hidden="true">
            <div className="home-banner-highlight-card">
              <FontAwesomeIcon icon={["fas", "bolt"]} />
              <div>
                <strong>Flash sale</strong>
                <span>Giảm đến 35%</span>
              </div>
            </div>
            <div className="home-banner-highlight-card">
              <FontAwesomeIcon icon={["fas", "headset"]} />
              <div>
                <strong>Tư vấn 24/7</strong>
                <span>Chọn đúng cấu hình</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#bannerIndicators"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Trước</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#bannerIndicators"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Sau</span>
      </button>
    </div>
  );
}

export default Banner;
