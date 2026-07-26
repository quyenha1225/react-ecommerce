import { useState } from "react";
import SePayQRModal from "./SePayQRModal";
import { useAuth } from "../auth/AuthContext";

<<<<<<< HEAD
function PaymentForm({ total, products, onBack, onFinish }) {
  const [method, setMethod] = useState("cod");
  const [showQRModal, setShowQRModal] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { api } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault(); setSubmitting(true); setError("");
    localStorage.setItem("payment-method", method);
    try {
      const customer = JSON.parse(localStorage.getItem("customer-info")) || {};
      const order = await api("/orders", { method: "POST", body: JSON.stringify({
        items: products.map(item => ({ productId: Number(item.id), quantity: Number(item.quantity), ...(item.variantId ? { variantId: Number(item.variantId) } : {}) })),
        paymentMethod: method === "sepay" ? "QR_BANKING" : "COD",
        shipping: { receiverName: customer.fullName, receiverPhone: customer.phone, province: "Chưa cập nhật", district: "Chưa cập nhật", ward: "Chưa cập nhật", street: customer.address },
        note: customer.note || "",
      }) });
      if (method === "sepay") {
        setOrderData({ ...order, orderId: order.id, orderCode: order.code, amount: Number(order.total) });
        setShowQRModal(true);
      } else onFinish(order);
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  }

  return <div className="payment-wrapper">
    <div className="payment-left"><h2>Phương thức thanh toán</h2><form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <label className="payment-item"><input type="radio" name="payment-method" checked={method === "cod"} onChange={() => setMethod("cod")}/><div><strong>Thanh toán khi nhận hàng (COD)</strong><p>Thanh toán trực tiếp cho nhân viên giao hàng.</p></div></label>
      <label className="payment-item"><input type="radio" name="payment-method" checked={method === "sepay"} onChange={() => setMethod("sepay")}/><div><strong>Thanh toán quét mã QR</strong><p>Quét VietQR với đúng số tiền và nội dung đơn hàng.</p></div></label>
      <div className="checkout-buttons"><button type="button" className="btn btn-secondary" onClick={onBack}>Quay lại</button><button type="submit" className="btn btn-warning" disabled={submitting}>{submitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}</button></div>
    </form></div>
    <div className="payment-right"><h3>Tóm tắt đơn hàng</h3><div className="summary-row"><span>Tạm tính</span><strong>{total.toLocaleString("vi-VN")}đ</strong></div><div className="summary-row"><span>Phí vận chuyển</span><strong>0đ</strong></div><hr/><div className="summary-total"><span>Tổng cộng</span><strong>{total.toLocaleString("vi-VN")}đ</strong></div></div>
    <SePayQRModal show={showQRModal} orderData={orderData} onClose={() => setShowQRModal(false)} onSuccess={(paidOrder) => { setShowQRModal(false); onFinish(paidOrder || orderData); }}/>
  </div>;
=======
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
      // 1. CHUẨN BỊ PAYLOAD GỬI LÊN BACKEND
      const orderPayload = {
        recipient_name: customer.fullName || "Khách hàng",
        recipient_phone: customer.phone || "0386960699",
        shipping_address: customer.address || "Hà Nội",
        payment_method: method === "sepay" ? "QR_BANKING" : "COD",
        note: customer.note || "",
        items: (selectedProducts || []).map((p) => ({
          variant_id: Number(p.variant_id || p.id || 130), // ÉP KIỂU NUMBER CHÍNH XÁC
          quantity: Number(p.quantity || 1),              // ÉP KIỂU NUMBER CHÍNH XÁC
        })),
      };

      // 2. GỌI CHÍNH XÁC ENDPOINT /api/orders/checkout
      const res = await fetch("http://localhost:3001/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const createdOrderInfo = {
          orderId: result.order.order_id,
          orderCode: result.order.order_code,
          amount: result.order.total_amount || total,
          customerName: customer.fullName || "Khách hàng",
        };

        setCreatedOrderData(createdOrderInfo);

        if (method === "sepay") {
          setShowQRModal(true);
        } else {
          onFinish();
        }
      } else {
        alert(result.message || "Lỗi tạo đơn hàng!");
      }
    } catch (err) {
      console.error("Lỗi kết nối Checkout:", err);
      alert("Không thể kết nối đến máy chủ thanh toán!");
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
          onFinish();
        }}
      />
    </div>
  );
>>>>>>> ed9005cbd35251de2aec3528645f9f2c84897783
}

export default PaymentForm;
