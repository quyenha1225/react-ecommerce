import { useState } from "react";
import SePayQRModal from "./SePayQRModal";
import { useAuth } from "../auth/AuthContext";

function PaymentForm({ total, products, onBack, onFinish }) {
  const [method, setMethod] = useState("cod");
  const [showQRModal, setShowQRModal] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { api } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    localStorage.setItem("payment-method", method);

    try {
      const customer = JSON.parse(localStorage.getItem("customer-info")) || {};
      const response = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: products.map((item) => ({
            productId: Number(item.id),
            quantity: Number(item.quantity),
            ...(item.variantId ? { variantId: Number(item.variantId) } : {}),
          })),
          paymentMethod: method === "sepay" ? "QR_BANKING" : "COD",
          shipping: {
            receiverName: customer.fullName,
            receiverPhone: customer.phone,
            province: customer.province || "Chưa cập nhật",
            district: customer.district || "Chưa cập nhật",
            ward: customer.ward || "Chưa cập nhật",
            street: customer.address,
          },
          note: customer.note || "",
        }),
      });

      const resOrder = response.order || response;
      const validOrderId = resOrder.order_id || resOrder.id;
      const validOrderCode =
        resOrder.order_code ||
        resOrder.code ||
        (validOrderId ? `ESH${validOrderId}` : "");
      const validAmount = Number(
        resOrder.total_amount || resOrder.total || total,
      );

      const formattedOrder = {
        ...resOrder,
        id: validOrderId,
        order_id: validOrderId,
        orderId: validOrderId,
        code: validOrderCode,
        orderCode: validOrderCode,
        amount: validAmount,
        totalAmount: validAmount,
      };

      if (method === "sepay") {
        setOrderData(formattedOrder);
        setShowQRModal(true);
      } else {
        onFinish(formattedOrder);
      }
    } catch (err) {
      setError(err.message || "Tạo đơn hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="payment-wrapper">
      <div className="payment-left">
        <h2>Phương thức thanh toán</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}
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
          <label className="payment-item">
            <input
              type="radio"
              name="payment-method"
              checked={method === "sepay"}
              onChange={() => setMethod("sepay")}
            />
            <div>
              <strong>Thanh toán quét mã QR</strong>
              <p>Quét VietQR với đúng số tiền và nội dung đơn hàng.</p>
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
              disabled={submitting}
            >
              {submitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
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
      <SePayQRModal
        show={showQRModal}
        orderData={orderData}
        onClose={() => setShowQRModal(false)}
        onSuccess={(paidOrder) => {
          setShowQRModal(false);
          onFinish(paidOrder || orderData);
        }}
      />
    </div>
  );
}

export default PaymentForm;
