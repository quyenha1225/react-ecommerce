import { useState } from "react";
import SePayQRModal from "./SePayQRModal";

function PaymentForm({ total, onBack, onFinish }) {
  const [method, setMethod] = useState("cod");
  const [showQRModal, setShowQRModal] = useState(false);
  const [orderData, setCreatedOrderData] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();

    localStorage.setItem("payment-method", method);

    // Nếu chọn SePay VietQR -> Sinh thông tin đơn hàng & mở Modal QR
    if (method === "sepay") {
      const generatedOrderId =
        "ESH" + Math.floor(Math.random() * 900000 + 100000);
      const customer = JSON.parse(localStorage.getItem("customer-info")) || {};

      const currentOrder = {
        orderId: generatedOrderId,
        orderCode: generatedOrderId,
        amount: total,
        customerName: customer.fullName || "Khách hàng",
      };

      setCreatedOrderData(currentOrder);
      setShowQRModal(true);
    } else {
      // Nếu chọn COD -> Hoàn tất ngay sang Bước 4
      onFinish();
    }
  }

  return (
    <div className="payment-wrapper">
      <div className="payment-left">
        <h2>Phương thức thanh toán</h2>

        <form onSubmit={handleSubmit}>
          {/* Lựa chọn 1: COD */}
          <label className="payment-item">
            <input
              type="radio"
              name="payment-method"
              checked={method === "cod"}
              onChange={() => setMethod("cod")}
            />
            <div>
              <strong>Thanh toán khi nhận hàng (COD)</strong>
              <p>Thanh toán trực tiếp cho nhân viên giao hàng.</p>
            </div>
          </label>

          {/* Lựa chọn 2: SePay VietQR */}
          <label className="payment-item">
            <input
              type="radio"
              name="payment-method"
              checked={method === "sepay"}
              onChange={() => setMethod("sepay")}
            />
            <div>
              <strong>Thanh toán quét mã QR</strong>
              <p>Thanh toán mượt mà qua mã QR ngân hàng tự động.</p>
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

            <button type="submit" className="btn btn-warning">
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

      {/* MODAL POPUP HIỂN THỊ MÃ QR SEPAY */}
      <SePayQRModal
        show={showQRModal}
        orderData={orderData}
        onClose={() => setShowQRModal(false)}
        onSuccess={() => {
          setShowQRModal(false);
          onFinish(); // Chuyển sang trang Success (Hoàn tất)
        }}
      />
    </div>
  );
}

export default PaymentForm;
