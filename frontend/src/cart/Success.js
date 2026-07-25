import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

function Success({ total, onHome }) {
  const customer = JSON.parse(localStorage.getItem("customer-info")) || {};

  const payment = localStorage.getItem("payment-method") || "cod";

  // Sử dụng useState với callback để mã đơn hàng chỉ khởi tạo duy nhất 1 lần khi mount
  const [orderId] = useState(
    () => "ESH" + Math.floor(Math.random() * 900000 + 100000),
  );

  const paymentName = {
    cod: "Thanh toán khi nhận hàng (COD)",
    sepay: "Chuyển khoản SePay VietQR",
  };

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">
          <FontAwesomeIcon icon={["fas", "circle-check"]} />
        </div>

        <h2>Đặt hàng thành công!</h2>

        <p>Cảm ơn bạn đã mua sắm tại ElectroShop.</p>

        <div className="success-info">
          <div className="info-row">
            <span>Mã đơn hàng</span>
            <strong>{orderId}</strong>
          </div>

          <div className="info-row">
            <span>Khách hàng</span>
            <strong>{customer.fullName || "Khách hàng"}</strong>
          </div>

          <div className="info-row">
            <span>Số điện thoại</span>
            <strong>{customer.phone || "Chưa cung cấp"}</strong>
          </div>

          <div className="info-row">
            <span>Địa chỉ</span>
            <strong>{customer.address || "Chưa cung cấp"}</strong>
          </div>

          <div className="info-row">
            <span>Thanh toán</span>
            <strong>{paymentName[payment] || paymentName.cod}</strong>
          </div>

          <div className="info-row">
            <span>Tổng tiền</span>
            <strong>{(total || 0).toLocaleString("vi-VN")}đ</strong>
          </div>
        </div>

        <button className="checkout-btn" onClick={onHome}>
          Tiếp tục mua sắm
        </button>
      </div>
    </div>
  );
}

export default Success;
