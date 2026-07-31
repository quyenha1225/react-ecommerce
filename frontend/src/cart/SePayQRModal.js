import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function SePayQRModal({ show, orderData, onClose, onSuccess }) {
  const orderId = orderData?.id || orderData?.orderId;
  const orderCode = orderData?.orderCode || orderData?.code;
  const amount = Number(
    orderData?.totalAmount || orderData?.amount || orderData?.total || 0,
  );

  // Thêm chữ "SEVQR " vào trước mã đơn hàng để VietinBank/SePay kích hoạt webhook
  const rawCode = orderCode || `ESH${orderId}`;
  const transferContent = rawCode.startsWith("SEVQR")
    ? rawCode
    : `SEVQR ${rawCode}`;

  // Cấu hình VietinBank với số tài khoản của bạn
  const bank = {
    name: "VietinBank",
    account: "101886339075",
    owner: "ELECTROSHOP",
    amount: amount,
    code: transferContent,
  };

  // URL tạo QR chuẩn VietinBank theo yêu cầu của SePay kèm tiền tố SEVQR
  const qr = `https://qr.sepay.vn/img?bank=VietinBank&acc=${bank.account}&template=compact&amount=${bank.amount}&des=${encodeURIComponent(bank.code)}`;

  // 🔄 CƠ CHẾ POLLING TỰ ĐỘNG KIỂM TRA THANH TOÁN QUA SEPAY WEBHOOK
  useEffect(() => {
    if (!show || !orderId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/payments/status/${orderId}`,
        );
        const data = await res.json();

        if (isMounted && data && data.isPaid) {
          clearInterval(interval);
          localStorage.setItem("payment-method", "sepay");
          onSuccess(orderData); // Tự động chuyển trang khi SePay webhook gửi tín hiệu thành công về!
        }
      } catch (err) {
        console.error("Lỗi kiểm tra trạng thái thanh toán:", err);
      }
    }, 3000); // Kiểm tra mỗi 3 giây

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [show, orderId, orderData, onSuccess]);

  if (!show || !orderData) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,.65)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-center p-3 rounded-4 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-primary">
              <FontAwesomeIcon icon={["fas", "qrcode"]} className="me-2" />
              Thanh toán chuyển khoản VietQR
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-2">
              Quét mã bằng ứng dụng ngân hàng và giữ nguyên nội dung chuyển
              khoản. Hệ thống sẽ tự động chuyển trang khi nhận được tiền!
            </p>
            <div className="my-2 p-2 bg-light rounded-3 d-inline-block border">
              <img
                src={qr}
                alt="Mã QR thanh toán"
                className="img-fluid rounded"
                style={{ maxHeight: 260 }}
              />
            </div>
            <div className="bg-light p-3 rounded-3 text-start small mt-2">
              {[
                ["Ngân hàng", bank.name],
                ["Số tài khoản", bank.account],
                ["Chủ tài khoản", bank.owner],
              ].map(([k, v]) => (
                <div className="d-flex justify-content-between mb-1" key={k}>
                  <span className="text-muted">{k}:</span>
                  <b>{v}</b>
                </div>
              ))}
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Số tiền:</span>
                <b className="text-danger">
                  {bank.amount.toLocaleString("vi-VN")} đ
                </b>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Nội dung CK:</span>
                <span className="badge bg-warning text-dark fs-6">
                  {bank.code}
                </span>
              </div>
            </div>
          </div>
          <div className="modal-footer border-0 pt-0 flex-column">
            <div className="text-muted small mb-3 fst-italic">
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Đang chờ giao dịch chuyển khoản từ SePay...
            </div>
            <button
              className="btn btn-outline-secondary w-100"
              onClick={onClose}
            >
              Đóng / Hủy giao dịch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SePayQRModal;
