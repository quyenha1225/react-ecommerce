import Image from "../nillkin-case-1.jpg";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { addProductToCart } from "../utils/cartEvents";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function Product(props) {
  const [isAdded, setIsAdded] = useState(false);
  const product = props.product || {};
  const price = product.price || 10000000;
  const productName = product.name || "Nillkin iPhone X cover";
  const category = product.category || "Phụ kiện";
  const rating = product.rating || 4.8;
  const sold = product.sold || "1.2k";
  const percentOff = props.percentOff || product.percentOff;
  const finalPrice = percentOff
    ? price - (percentOff * price) / 100
    : price;

  function handleAddToCart() {
    addProductToCart();
    setIsAdded(true);

    window.setTimeout(() => {
      setIsAdded(false);
    }, 1400);
  }

  return (
    <div className="col product-grid-item">
      <article className={"card shadow-sm eshop-product-card " + (isAdded ? "is-added" : "")}>
        <Link to="/products/1" className="eshop-product-media" replace>
          {percentOff ? (
            <span className="eshop-product-sale-badge">-{percentOff}%</span>
          ) : (
            <span className="eshop-product-sale-badge eshop-product-new-badge">
              New
            </span>
          )}
          <img
            className="card-img-top bg-dark cover"
            alt={productName}
            src={Image}
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
            {percentOff ? <del>{formatCurrency(price)}</del> : null}
          </div>

          <div className="eshop-product-actions">
            <Link to="/products/1" className="btn eshop-detail-btn" replace>
              Chi tiết
            </Link>
            <button
              type="button"
              className={"btn eshop-add-cart-btn " + (isAdded ? "is-added" : "")}
              onClick={handleAddToCart}
            >
              <FontAwesomeIcon icon={["fas", isAdded ? "check" : "cart-plus"]} />
              <span>{isAdded ? "Đã thêm" : "Thêm giỏ"}</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

export default Product;
