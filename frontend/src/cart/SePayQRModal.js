import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function SePayQRModal({ show, orderData, onClose, onSuccess }) {
  const [loadingMock, setLoadingMock] = useState(false);

  if (!show || !orderData) return null;

  // Cấu hình thông tin ngân hàng hiển thị
  const bankInfo = {
    bankName: "MBBank (MB)",
    accountNo: "0385416387",
    accountName: "ELECTROSHOP",
    amount: orderData.totalAmount || orderData.amount || 0,
    orderCode: orderData.orderCode || orderData.orderId || `ESH${Date.now()}`,
  };

  // Link sinh mã QR SePay VietQR chuẩn
  const qrUrl = `https://qr.sepay.vn/img?bank=MBBank&acc=${bankInfo.accountNo}&template=compact&amount=${bankInfo.amount}&des=${bankInfo.orderCode}`;

  // Hàm giả lập thanh toán thành công trực tiếp phía Frontend
  const handleMockPayment = () => {
    setLoadingMock(true);

    setTimeout(() => {
      // 1. Lưu phương thức thanh toán vào localStorage để trang Success hiển thị
      localStorage.setItem("payment-method", "sepay");

      setLoadingMock(false);

      // 2. Thông báo & Chuyển sang bước Hoàn tất
      alert("🎉 [DEMO] Hệ thống đã ghi nhận thanh toán thành công!");
      onSuccess();
    }, 800); // Tạo độ trễ 0.8s mô phỏng xử lý thực tế
  };

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
              Thanh toán chuyển khoản VietQR
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            <p className="text-muted small mb-2">
              Sử dụng App Ngân hàng hoặc Ví điện tử quét mã QR dưới đây:
            </p>

            {/* Khung chứa ảnh mã QR */}
            <div className="my-2 p-2 bg-light rounded-3 d-inline-block border">
              <img
                src={qrUrl}
                alt="Mã QR SePay VietQR"
                className="img-fluid rounded"
                style={{ maxHeight: "260px" }}
              />
            </div>

            {/* Thông tin chi tiết */}
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

            {/* NÚT MOCKUP GIẢ LẬP DÀNH CHO DEMO */}
            {/* <div className="mt-3 p-2 bg-warning bg-opacity-10 border border-warning rounded-3">
              <div className="text-warning-emphasis small fw-bold mb-2">
                ⚙️ Chế độ Demo / Đồ án (Không cần chuyển tiền thật)
              </div>
              <button
                type="button"
                className="btn btn-success w-100 fw-bold shadow-sm"
                onClick={handleMockPayment}
                disabled={loadingMock}
              >
                {loadingMock ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <span>🚀 [Demo] Kích hoạt Thanh Toán Thành Công</span>
                )}
              </button>
            </div> */}
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
