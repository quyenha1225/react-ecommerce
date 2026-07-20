import Image from "../nillkin-case-1.jpg";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { addToCart } from "../utils/cartStorage";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function Product({ product = {}, percentOff }) {
  const [isAdded, setIsAdded] = useState(false);

  const price = product.price || 10000000;
  const productName = product.name || "Nillkin iPhone X cover";
  const category = product.category || "Phụ kiện";
  const rating = product.rating || 4.8;
  const sold = product.sold || "1.2k";

  const discount = percentOff || product.percentOff;

  const finalPrice = discount
    ? price - (discount * price) / 100
    : price;

  function handleAddToCart() {
    addToCart({
      id: product.id,
      name: productName,
      brand: category,
      price: finalPrice,
      oldPrice: price,
      quantity: 1,
      image: Image,
    });

    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  }

  return (
    <div className="col product-grid-item">
      <article
        className={`card shadow-sm eshop-product-card ${
          isAdded ? "is-added" : ""
        }`}
      >
        <Link
          to={`/products/${product.id}`}
          className="eshop-product-media"
        >
          {discount ? (
            <span className="eshop-product-sale-badge">
              -{discount}%
            </span>
          ) : (
            <span className="eshop-product-sale-badge eshop-product-new-badge">
              New
            </span>
          )}

          <img
            src={Image}
            alt={productName}
            className="card-img-top bg-dark cover"
          />

          <span className="eshop-product-quick-view">
            <FontAwesomeIcon icon={["fas", "eye"]} />
            Xem nhanh
          </span>
        </Link>

        <div className="card-body eshop-product-body">

          <div className="eshop-product-meta">
            <span>{category}</span>

            <span>
              <FontAwesomeIcon icon={["fas", "star"]} />
              {" "}
              {rating} · {sold} bán
            </span>
          </div>

          <h5 className="card-title text-dark text-truncate">
            {productName}
          </h5>

          <p className="eshop-product-desc">
            Phụ kiện công nghệ bền đẹp, giao nhanh và bảo hành rõ ràng.
          </p>

          <div className="eshop-product-price-row">
            <strong>{formatCurrency(finalPrice)}</strong>

            {discount && (
              <del>{formatCurrency(price)}</del>
            )}
          </div>

          <div className="eshop-product-actions">

            <Link
              to={`/products/${product.id}`}
              className="btn eshop-detail-btn"
            >
              Chi tiết
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
      </article>
    </div>
  );
}

export default Product;