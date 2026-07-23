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

  const price = Number(product.price || 0);
  const productName = product.name || "Sản phẩm";
  const category = product.category || "Chưa phân loại";
  const rating = Number(product.rating || 0);
  const sold = product.sold || 0;
  const imageUrl = product.image_url;

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
      image: imageUrl,
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
          to={`/products/${product.slug || product.id}`}
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
            src={imageUrl}
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
            {product.brand ? `Thương hiệu ${product.brand}` : "Thông tin sản phẩm được đồng bộ từ hệ thống."}
          </p>

          <div className="eshop-product-price-row">
            <strong>{formatCurrency(finalPrice)}</strong>

            {discount && (
              <del>{formatCurrency(price)}</del>
            )}
          </div>

          <div className="eshop-product-actions">

            <Link
              to={`/products/${product.slug || product.id}`}
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
