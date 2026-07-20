import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  increaseQuantity,
  decreaseQuantity,
  removeCartItem,
} from "../utils/cartStorage";

function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

function CartItem({ product }) {
  return (
    <div className="cart-item">

      {/* Checkbox */}

      <div className="cart-check">
        <input type="checkbox" defaultChecked />
      </div>

      {/* Ảnh */}

      <div className="cart-image">

        <img
          src={product.image}
          alt={product.name}
        />

      </div>

      {/* Thông tin */}

      <div className="cart-info">

        <h4>{product.name}</h4>

        <p className="brand">
          {product.brand}
        </p>

        <div className="price-box">

          <span className="new-price">
            {formatPrice(product.price)}
          </span>

          <span className="old-price">
            {formatPrice(product.oldPrice)}
          </span>

        </div>

        <div className="cart-bottom">

          <div className="quantity-box">
            <button
            onClick={() => {
                decreaseQuantity(product.id);
                window.location.reload();
            }}
            >
            <FontAwesomeIcon icon={["fas", "minus"]} />
            </button>

           

            <span>{product.quantity}</span>

            <button
            onClick={() => {
                increaseQuantity(product.id);
                window.location.reload();
            }}
            >
            <FontAwesomeIcon icon={["fas", "plus"]} />
            </button>

          </div>

          <button
            className="delete-btn"
            onClick={() => {
                removeCartItem(product.id);
                window.location.reload();
            }}
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