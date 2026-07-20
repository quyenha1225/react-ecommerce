import { useState } from "react";

function PaymentForm({ total, onBack, onFinish }) {
  const [method, setMethod] = useState("cod");

  function handleSubmit(e) {
    e.preventDefault();

    localStorage.setItem("payment-method", method);

    onFinish();
  }

  return (
    <div className="payment-wrapper">

      <div className="payment-left">

        <h2>Phương thức thanh toán</h2>

        <form onSubmit={handleSubmit}>

          <label className="payment-item">
            <input
              type="radio"
              checked={method === "cod"}
              onChange={() => setMethod("cod")}
            />
            <div>
              <strong>Thanh toán khi nhận hàng (COD)</strong>
              <p>Thanh toán trực tiếp cho nhân viên giao hàng.</p>
            </div>
          </label>

          <label className="payment-item">
            <input
              type="radio"
              checked={method === "bank"}
              onChange={() => setMethod("bank")}
            />
            <div>
              <strong>Chuyển khoản ngân hàng</strong>
              <p>Chuyển khoản trước khi giao hàng.</p>
            </div>
          </label>

          <label className="payment-item">
            <input
              type="radio"
              checked={method === "momo"}
              onChange={() => setMethod("momo")}
            />
            <div>
              <strong>Ví MoMo</strong>
              <p>Thanh toán nhanh bằng MoMo.</p>
            </div>
          </label>

          <label className="payment-item">
            <input
              type="radio"
              checked={method === "vnpay"}
              onChange={() => setMethod("vnpay")}
            />
            <div>
              <strong>VNPay</strong>
              <p>Thanh toán qua cổng VNPay.</p>
            </div>
          </label>

          <div className="checkout-buttons">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBack}
            >
              Quay lại
            </button>

            <button
              type="submit"
              className="btn btn-warning"
            >
              Xác nhận đặt hàng
            </button>

          </div>

        </form>

      </div>

      <div className="payment-right">

        <h3>Tóm tắt đơn hàng</h3>

        <div className="summary-row">
          <span>Tạm tính</span>
          <strong>{total.toLocaleString("vi-VN")}đ</strong>
        </div>

        <div className="summary-row">
          <span>Phí vận chuyển</span>
          <strong>0đ</strong>
        </div>

        <hr />

        <div className="summary-total">
          <span>Tổng cộng</span>
          <strong>{total.toLocaleString("vi-VN")}đ</strong>
        </div>

      </div>

    </div>
  );
}

export default PaymentForm;