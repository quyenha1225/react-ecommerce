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

function ProductH(props) {
  const [isAdded, setIsAdded] = useState(false);
  const product = props.product || {};
  const price = Number(product.price || 0);
  const productName = product.name || "Sản phẩm";
  const category = product.category || "Chưa phân loại";
  const rating = Number(product.rating || 0);
  const sold = product.sold || 0;
  const percentOff = props.percentOff || product.percentOff;
  const finalPrice = percentOff
    ? price - (percentOff * price) / 100
    : price;

  function handleAddToCart() {
    addToCart({id:product.id,name:productName,brand:product.brand||category,price:finalPrice,oldPrice:price,image:product.image_url});
    setIsAdded(true);

    window.setTimeout(() => {
      setIsAdded(false);
    }, 1400);
  }

  return (
    <div className="col">
      <article className={"card shadow-sm eshop-product-card eshop-product-card-horizontal " + (isAdded ? "is-added" : "")}>
        <div className="row g-0">
          <div className="col-4 eshop-product-horizontal-media-wrap">
            <Link to={`/products/${product.slug || product.id}`} className="eshop-product-media h-100">
              {percentOff ? (
                <span className="eshop-product-sale-badge">-{percentOff}%</span>
              ) : null}
              <img
                className="rounded-start bg-dark cover w-100 h-100"
                alt={productName}
                src={product.image_url}
              />
            </Link>
          </div>
          <div className="col-8">
            <div className="card-body h-100">
              <div className="d-flex flex-column h-100">
                <div className="eshop-product-meta mb-2">
                  <span>{category}</span>
                  <span>
                    <FontAwesomeIcon icon={["fas", "star"]} />
                    {rating} · {sold} bán
                  </span>
                </div>

                <h5 className="card-title text-dark text-truncate mb-1">
                  {productName}
                </h5>

                <p className="eshop-product-desc mb-2">
                  Thiết kế gọn, dễ dùng, phù hợp nhu cầu công nghệ hằng ngày.
                </p>

                <div className="eshop-product-price-row mb-3">
                  <strong>{formatCurrency(finalPrice)}</strong>
                  {percentOff ? <del>{formatCurrency(price)}</del> : null}
                </div>

                <div className="mt-auto d-flex gap-2 justify-content-end">
                  <Link to={`/products/${product.slug || product.id}`} className="btn eshop-detail-btn">
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
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default ProductH;
