import Image from "../nillkin-case.webp";
import { Link } from "react-router-dom";

function FeatureProduct() {
  return (
    <div className="col">
      <div className="card shadow-sm home-product-card home-animate">
        <Link to="/products/1" className="home-product-media" replace>
          <span className="home-product-badge">Bán chạy</span>
          <img
            className="card-img-top bg-dark cover responsive-product-image"
            alt="Ốp lưng Nillkin cho iPhone X"
            src={Image}
          />
        </Link>
        <div className="card-body">
          <h5 className="card-title text-center">Nillkin iPhone X cover</h5>
          <p className="card-text text-center text-muted">10.000.000 đ</p>
          <div className="d-grid gap-2">
            <Link to="/products/1" className="btn btn-outline-dark" replace>
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureProduct;
