import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function CustomerForm({ selectedProducts = [], onNext }) {
  const { session, api } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    district: "",
    ward: "",
    note: "",
  });

  const totalAmount = selectedProducts.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    if (session) {
      const user = session.user || session;

      // SỬA LẠI ĐÚNG ENDPOINT API MÀ ACCOUNT.JS ĐANG DÙNG
      api(`/account/addresses`)
        .then((res) => {
          // API /account/addresses trả về thẳng mảng danh sách địa chỉ
          const list = Array.isArray(res) ? res : res.data || [];
          setAddresses(list);

          if (list.length > 0) {
            const defaultAddr = list.find((a) => a.isDefault) || list[0];
            setSelectedAddressId(defaultAddr.id);
            setForm((prev) => ({
              ...prev,
              fullName: defaultAddr.receiverName,
              phone: defaultAddr.receiverPhone,
              address: `${defaultAddr.street}, ${defaultAddr.ward}, ${defaultAddr.district}, ${defaultAddr.province}`,
              province: defaultAddr.province,
              district: defaultAddr.district,
              ward: defaultAddr.ward,
            }));
          }
        })
        .catch((err) => console.error("Lỗi tải sổ địa chỉ:", err));

      const savedInfo = JSON.parse(localStorage.getItem("customer-info")) || {};
      setForm((prev) => ({
        ...prev,
        email: savedInfo.email || user.email || user.user_email || "",
        note: savedInfo.note || "",
      }));
    }
  }, [session, api]);

  function handleSelectAddressChange(e) {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);

    const chosen = addresses.find((a) => String(a.id) === String(addressId));
    if (chosen) {
      setForm((prev) => ({
        ...prev,
        fullName: chosen.receiverName,
        phone: chosen.receiverPhone,
        address: `${chosen.street}, ${chosen.ward}, ${chosen.district}, ${chosen.province}`,
        province: chosen.province,
        district: chosen.district,
        ward: chosen.ward,
      }));
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.address) {
      alert("Vui lòng chọn hoặc thêm địa chỉ nhận hàng.");
      return;
    }

    localStorage.setItem("customer-info", JSON.stringify(form));
    onNext();
  }

  return (
    <div
      className="customer-form-wrapper"
      style={{ maxWidth: "850px", margin: "0 auto" }}
    >
      {/* 1. ĐỊA CHỈ NHẬN HÀNG */}
      <div className="card p-3 shadow-sm mb-3 border-0 rounded-3">
        <h5 className="mb-2 fw-bold text-dark">Địa chỉ nhận hàng</h5>

        {addresses.length > 0 ? (
          <div>
            <label className="form-label text-muted small mb-1">
              Chọn địa chỉ đã lưu trong tài khoản:
            </label>
            <select
              className="form-select shadow-sm py-2"
              value={selectedAddressId}
              onChange={handleSelectAddressChange}
            >
              {addresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.receiverName} | {addr.receiverPhone} — {addr.street},{" "}
                  {addr.ward}, {addr.district}, {addr.province}{" "}
                  {addr.isDefault ? "[Mặc định]" : ""}
                </option>
              ))}
            </select>

            <div className="mt-2 text-end">
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none text-primary p-0"
                onClick={() => {
                  localStorage.setItem("account_active_tab", "addresses");
                  navigate("/account");
                }}
              >
                <FontAwesomeIcon icon={["fas", "cog"]} className="me-1" /> Quản
                lý / Thêm địa chỉ mới trong Sổ địa chỉ
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 bg-white rounded border border-dashed">
            <p className="text-muted small mb-2">
              Bạn chưa có địa chỉ giao hàng nào được lưu trong hệ thống.
            </p>
            <button
              type="button"
              className="btn btn-warning btn-sm fw-bold px-3"
              onClick={() => {
                localStorage.setItem("account_active_tab", "addresses");
                navigate("/account");
              }}
            >
              <FontAwesomeIcon icon={["fas", "plus"]} className="me-1" /> Thêm
              địa chỉ mới
            </button>
          </div>
        )}
      </div>

      {/* 2. THÔNG TIN LIÊN HỆ & GHI CHÚ */}
      <form
        className="card p-3 shadow-sm mb-3 border-0 rounded-3"
        onSubmit={handleSubmit}
      >
        <h5 className="mb-2 fw-bold text-dark">Thông tin liên hệ & Ghi chú</h5>

        <div className="mb-2">
          <label className="form-label text-muted small mb-1">
            Email nhận thông báo đơn hàng
          </label>
          <input
            type="email"
            name="email"
            className="form-control form-control-sm"
            placeholder="Email của bạn"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-2">
          <label className="form-label text-muted small mb-1">
            Ghi chú đơn hàng (Tuỳ chọn)
          </label>
          <textarea
            name="note"
            className="form-control form-control-sm"
            placeholder="Lưu ý cho người bán hoặc shipper..."
            rows="2"
            value={form.note}
            onChange={handleChange}
          />
        </div>

        {/* 3. TÓM TẮT ĐƠN HÀNG THANH TOÁN */}
        <div className="mt-3 pt-3 border-top">
          <h5 className="mb-2 fw-bold text-dark">
            <FontAwesomeIcon
              icon={["fas", "box-open"]}
              className="me-2 text-warning"
            />
            Tóm tắt đơn hàng thanh toán
          </h5>
          <div className="table-responsive">
            <table className="table align-middle mb-2">
              <thead>
                <tr className="text-secondary small border-bottom">
                  <th className="py-1">Sản phẩm</th>
                  <th className="text-center py-1">Số lượng</th>
                  <th className="text-end py-1">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: "1.1rem" }}>
                    <td className="py-2">
                      <div
                        className="fw-bold text-dark text-truncate"
                        style={{ maxWidth: "380px" }}
                      >
                        {item.name}
                      </div>
                    </td>
                    <td className="text-center py-2 text-muted">
                      x{item.quantity}
                    </td>
                    <td className="text-end py-2 fw-bold text-danger">
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center border-top pt-2">
            <span className="small text-muted fw-semibold">
              Tổng tiền hàng:
            </span>
            <span className="fs-6 fw-bold text-danger">
              {totalAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        <div className="checkout-buttons d-flex justify-content-between mt-3">
          <button
            type="button"
            className="btn btn-secondary btn-sm px-3"
            onClick={() => window.history.back()}
          >
            Quay lại
          </button>

          <button
            type="submit"
            className="btn btn-warning btn-sm px-4 fw-bold shadow-sm"
          >
            Tiếp tục thanh toán
          </button>
        </div>
      </form>
    </div>
  );
}

export default CustomerForm;
