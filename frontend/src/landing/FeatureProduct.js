import Image from "../nillkin-case.webp";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { addToCart } from "../utils/cartStorage";

function FeatureProduct() {
  const [isAdded, setIsAdded] = useState(false);

  function handleAddToCart() {
    addToCart({
      id: 1,
      name: "Nillkin iPhone X cover",
      brand: "Phụ kiện",
      price: 10000000,
      oldPrice: 10000000,
      quantity: 1,
      image: Image,
    });

    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 1400);
  }

  return (
    <div className="col">
      <div className="card shadow-sm home-product-card home-animate">
        <Link to="/products/1" className="home-product-media" replace>
          <span className="home-product-badge">Bán chạy</span>

          <img
            className="card-img-top bg-dark cover responsive-product-image"
            src={Image}
            alt="Ốp lưng Nillkin cho iPhone X"
          />
        </Link>

        <div className="card-body">
          <div className="eshop-product-meta mb-2">
            <span>Phụ kiện</span>

            <span>
              <FontAwesomeIcon icon={["fas", "star"]} />
              {" "}
              4.8 · 1.2k bán
            </span>
          </div>

          <h5 className="card-title">
            Nillkin iPhone X cover
          </h5>

          <p className="card-text text-muted">
            10.000.000 đ
          </p>

          <div className="home-product-actions">
            <Link
              to="/products/1"
              className="btn btn-outline-dark"
              replace
            >
              Xem chi tiết
            </Link>

            <button
              type="button"
              className={`btn eshop-add-cart-btn ${
                isAdded ? "is-added" : ""
              }`}
              onClick={handleAddToCart}
            >
              <FontAwesomeIcon
                icon={[
                  "fas",
                  isAdded ? "check" : "cart-plus",
                ]}
              />

              <span>
                {isAdded ? "Đã thêm" : "Thêm giỏ"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureProduct;