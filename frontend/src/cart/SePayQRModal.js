import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function SePayQRModal({ show, orderData, onClose, onSuccess }) {
  const [checking, setChecking] = useState(false);

  // Lấy chính xác mã/ID đơn hàng để gọi Polling
  const pollTargetId =
    orderData?.orderCode || orderData?.orderId || orderData?.id || "";

  const bankInfo = {
    bankName: "VietinBank",
    accountNo: "101886339075",
    accountName: "NGAN THAI THUONG",
    amount: orderData?.totalAmount || orderData?.amount || 0,
    orderCode: `SEVQR ${pollTargetId}`,
  };

  // Link sinh mã QR VietinBank
  const qrUrl = `https://qr.sepay.vn/img?bank=${bankInfo.bankName}&acc=${bankInfo.accountNo}&template=compact&amount=${bankInfo.amount}&des=${encodeURIComponent(bankInfo.orderCode)}`;

  // 🔴 VÒNG LẶP POLLING TỰ ĐỘNG CHỜ THANH TOÁN (MỖI 2 GIÂY/LẦN)
  useEffect(() => {
    if (!show || !pollTargetId) return;

    const checkStatus = async () => {
      try {
        setChecking(true);
        const res = await fetch(
          `http://localhost:3001/api/payments/status/${pollTargetId}`,
        );

        if (res.ok) {
          const data = await res.json();
          // Ngay khi Backend báo matches PAID -> Chuyển trang thành công ngay lập tức!
          if (data?.isPaid) {
            localStorage.setItem("payment-method", "sepay");
            onSuccess();
          }
        }
      } catch (err) {
        console.error("Lỗi kiểm tra trạng thái thanh toán:", err);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, [show, pollTargetId, onSuccess]);

  if (!show || !orderData) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-center p-3 rounded-4 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-primary">
              <FontAwesomeIcon icon={["fas", "qrcode"]} className="me-2" />
              Thanh toán chuyển khoản VietQR (VietinBank)
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            <p className="text-muted small mb-2">
              Mở App Ngân hàng bất kỳ quét mã QR dưới đây để thanh toán:
            </p>

            <div className="my-2 p-2 bg-light rounded-3 d-inline-block border">
              <img
                src={qrUrl}
                alt="Mã QR SePay VietQR"
                className="img-fluid rounded"
                style={{ maxHeight: "260px" }}
              />
            </div>

            <div className="text-success small my-2 fw-bold">
              <FontAwesomeIcon
                icon={["fas", "spinner"]}
                spin
                className="me-2"
              />
              Hệ thống đang tự động chờ giao dịch của bạn...
            </div>

            <div className="bg-light p-3 rounded-3 text-start small mt-2">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Ngân hàng:</span>
                <span className="fw-bold">{bankInfo.bankName}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Số tài khoản:</span>
                <span className="fw-bold text-dark">{bankInfo.accountNo}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Chủ tài khoản:</span>
                <span className="fw-bold">{bankInfo.accountName}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Số tiền:</span>
                <span className="fw-bold text-danger">
                  {bankInfo.amount.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Nội dung CK:</span>
                <span className="badge bg-warning text-dark fs-6">
                  {bankInfo.orderCode}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={onClose}
            >
              Đóng / Thanh toán sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SePayQRModal;
