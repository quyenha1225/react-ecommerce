import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import {
  increaseQuantity,
  decreaseQuantity,
  removeCartItem,
  toggleCartItemSelect,
} from "../utils/cartStorage";

function formatPrice(price) {
  return (Number(price) || 0).toLocaleString("vi-VN") + "đ";
}

function CartItem({ product }) {
  const isSelected = product.selected !== false;
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="cart-item">
      {/* Checkbox */}
      <div className="cart-check">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleCartItemSelect(product.id)}
        />
      </div>

      {/* Ảnh */}
      <div className={`cart-image ${imageFailed || !product.image ? "no-image" : ""}`}>
        {imageFailed || !product.image ? <FontAwesomeIcon icon={["fas","image"]}/> : <img src={product.image} alt={product.name} onError={() => setImageFailed(true)} />}
      </div>

      {/* Thông tin */}
      <div className="cart-info">
        <h4>{product.name}</h4>

        <p className="brand">{product.brand}</p>

        <div className="price-box">
          <span className="new-price">{formatPrice(product.price)}</span>

          {Number(product.oldPrice) > Number(product.price) && (
            <span className="old-price">{formatPrice(product.oldPrice)}</span>
          )}
        </div>

        <div className="cart-bottom">
          <div className="quantity-box">
            <button onClick={() => decreaseQuantity(product.id)}>
              <FontAwesomeIcon icon={["fas", "minus"]} />
            </button>

            <span>{product.quantity}</span>

            <button onClick={() => increaseQuantity(product.id)}>
              <FontAwesomeIcon icon={["fas", "plus"]} />
            </button>
          </div>

          <button
            className="delete-btn"
            onClick={() => removeCartItem(product.id)}
          >
            <FontAwesomeIcon icon={["fas", "trash"]} />
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
