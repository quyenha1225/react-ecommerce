import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Success({ total, onHome }) {
  const customer =
    JSON.parse(localStorage.getItem("customer-info")) || {};

  const payment =
    localStorage.getItem("payment-method") || "cod";

  const orderId =
    "ESH" + Math.floor(Math.random() * 900000 + 100000);

  const paymentName = {
    cod: "Thanh toán khi nhận hàng",
    bank: "Chuyển khoản ngân hàng",
    momo: "Ví MoMo",
    vnpay: "VNPay",
  };

  return (
    <div className="success-page">

      <div className="success-card">

        <div className="success-icon">
          <FontAwesomeIcon icon={["fas", "circle-check"]} />
        </div>

        <h2>Đặt hàng thành công!</h2>

        <p>
          Cảm ơn bạn đã mua sắm tại ElectroShop.
        </p>

        <div className="success-info">

          <div className="info-row">
            <span>Mã đơn hàng</span>
            <strong>{orderId}</strong>
          </div>

          <div className="info-row">
            <span>Khách hàng</span>
            <strong>{customer.fullName}</strong>
          </div>

          <div className="info-row">
            <span>Số điện thoại</span>
            <strong>{customer.phone}</strong>
          </div>

          <div className="info-row">
            <span>Địa chỉ</span>
            <strong>{customer.address}</strong>
          </div>

          <div className="info-row">
            <span>Thanh toán</span>
            <strong>{paymentName[payment]}</strong>
          </div>

          <div className="info-row">
            <span>Tổng tiền</span>
            <strong>
              {total.toLocaleString("vi-VN")}đ
            </strong>
          </div>

        </div>

        <button
          className="checkout-btn"
          onClick={onHome}
        >
          Tiếp tục mua sắm
        </button>

      </div>

    </div>
  );
}

export default Success;