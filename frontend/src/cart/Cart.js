import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import CartItem from "./CartItem";
import CheckoutStepper from "./CheckoutStepper";
import CustomerForm from "./CustomerForm";
import { clearCart, getCart } from "../utils/cartStorage";
import PaymentForm from "./PaymentForm";
import Success from "./Success";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

function Cart() {
  const [products, setProducts] = useState([]);
  const [step, setStep] = useState(1);
  const [finalTotal, setFinalTotal] = useState(0);
  const [completedOrder, setCompletedOrder] = useState(null);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    function loadCart() {
      setProducts(getCart());
    }

    loadCart();

    window.addEventListener("eshop:cart-updated", loadCart);

    return () => {
      window.removeEventListener("eshop:cart-updated", loadCart);
    };
  }, []);

  const total = products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-back" onClick={() => navigate("/")}>
          <FontAwesomeIcon icon={["fas", "arrow-left"]} />
          <span>Tiếp tục mua hàng</span>
        </div>

        <h2 className="cart-title">GIỎ HÀNG</h2>

        <CheckoutStepper step={step} />

        {/* =================== BƯỚC 1 =================== */}
        {step === 1 && (
          <div className="cart-wrapper">
            <div className="cart-list">
              {products.length === 0 ? (
                <div className="empty-cart">
                  <h3>🛒 Giỏ hàng đang trống</h3>
                  <p>Hãy thêm sản phẩm để bắt đầu mua sắm.</p>
                </div>
              ) : (
                products.map((product) => (
                  <CartItem key={product.id} product={product} />
                ))
              )}
            </div>

            <div className="cart-summary">
              <h3>Tóm tắt đơn hàng</h3>

              <div className="summary-row">
                <span>Tạm tính</span>
                <b>{formatPrice(total)}</b>
              </div>

              <div className="voucher-box">
                <input type="text" placeholder="Nhập mã giảm giá" />
                <button>Áp dụng</button>
              </div>

              <div className="summary-total">
                <span>Tổng cộng</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <button
                className="checkout-btn"
                onClick={() => {
                  if (products.length === 0) {
                    alert("Giỏ hàng đang trống!");
                    return;
                  }

                  if (!session) {
                    alert("Vui lòng đăng nhập để đặt hàng và theo dõi đơn trong tài khoản.");
                    return;
                  }

                  setStep(2);
                }}
              >
                ĐẶT HÀNG NGAY
              </button>
            </div>
          </div>
        )}

        {/* =================== BƯỚC 2 =================== */}
        {step === 2 && <CustomerForm onNext={() => setStep(3)} />}

        {/* =================== BƯỚC 3 =================== */}
        {step === 3 && (
          <PaymentForm
            total={total}
            products={products}
            onBack={() => setStep(2)}
            onFinish={(order) => {
              setCompletedOrder(order);
              setFinalTotal(total); // Lưu lại tổng tiền trước khi xoá giỏ hàng
              clearCart();
              setProducts([]);
              setStep(4);
            }}
          />
        )}

        {/* =================== BƯỚC 4 =================== */}
        {step === 4 && (
          <Success
            total={finalTotal}
            order={completedOrder}
            onHome={() => {
              localStorage.removeItem("customer-info");
              localStorage.removeItem("payment-method");
              navigate("/");
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Cart;
