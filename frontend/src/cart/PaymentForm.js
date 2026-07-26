import { useState } from "react";
import SePayQRModal from "./SePayQRModal";

function PaymentForm({ total, selectedProducts, onBack, onFinish }) {
  const [method, setMethod] = useState("cod");
  const [showQRModal, setShowQRModal] = useState(false);
  const [orderData, setCreatedOrderData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    localStorage.setItem("payment-method", method);

    const customer = JSON.parse(localStorage.getItem("customer-info")) || {};
    const token = localStorage.getItem("token") || "";

    setLoading(true);

    try {
      // 1. TẠO ĐƠN HÀNG THẬT DƯỚI DATABASE TRƯỚC
      const orderPayload = {
        customerInfo: customer,
        items: selectedProducts || [],
        totalAmount: total,
        paymentMethod: method,
      };

      const res = await fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      let realOrder = {};
      if (res.ok) {
        realOrder = await res.json();
      }

      // Lấy orderId và orderCode thật từ DB (nếu API chưa tạo kịp thì dùng fallback)
      const realOrderId =
        realOrder.orderId || realOrder.order_id || realOrder.id || Date.now();
      const realOrderCode =
        realOrder.orderCode || realOrder.order_code || `ESH${realOrderId}`;

      const currentOrder = {
        orderId: realOrderId,
        orderCode: realOrderCode,
        amount: total,
        customerName: customer.fullName || "Khách hàng",
      };

      setCreatedOrderData(currentOrder);

      // 2. XỬ LÝ THEO PHƯƠNG THỨC THANH TOÁN
      if (method === "sepay") {
        // Nếu chọn QR -> Mở Modal QR với thông tin đơn hàng THẬT
        setShowQRModal(true);
      } else {
        // Nếu chọn COD -> Sang ngay trang Hoàn tất
        onFinish();
      }
    } catch (err) {
      console.error("Lỗi tạo đơn hàng:", err);
      // Fallback vẫn mở modal nếu vướng lỗi mạng nhẹ
      const fallbackId = Date.now();
      setCreatedOrderData({
        orderId: fallbackId,
        orderCode: `ESH${fallbackId}`,
        amount: total,
      });
      if (method === "sepay") setShowQRModal(true);
      else onFinish();
    } finally {
      setLoading(false);
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
              disabled={loading}
            >
              Quay lại
            </button>

            <button
              type="submit"
              className="btn btn-warning"
              disabled={loading}
            >
              {loading ? "Đang tạo đơn hàng..." : "Xác nhận đặt hàng"}
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
