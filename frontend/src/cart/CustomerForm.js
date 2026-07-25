import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

function CustomerForm({ onNext }) {
  const { session } = useAuth(); // Lấy thông tin session từ AuthContext

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    // 1. Kiểm tra nếu ĐÃ ĐĂNG NHẬP
    if (session) {
      const savedInfo = JSON.parse(localStorage.getItem("customer-info")) || {};
      const user = session.user || session;

      setForm({
        fullName:
          savedInfo.fullName ||
          user.fullName ||
          user.user_full_name ||
          user.fullName ||
          user.name ||
          "",
        // Thêm user.phone_number và user.phoneNumber vào kiểm tra
        phone:
          savedInfo.phone ||
          user.phone ||
          user.phone_number ||
          user.phoneNumber ||
          user.user_phone ||
          "",
        email: savedInfo.email || user.email || user.user_email || "",
        address: savedInfo.address || "",
        note: savedInfo.note || "",
      });
    } else {
      // 2. Nếu CHƯA/ĐÃ ĐĂNG XUẤT -> Reset form
      localStorage.removeItem("customer-info");
      setForm({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        note: "",
      });
    }
  }, [session]);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.fullName || !form.phone || !form.email || !form.address) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    localStorage.setItem("customer-info", JSON.stringify(form));

    onNext();
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <h3>Thông tin khách hàng</h3>

      <input
        type="text"
        name="fullName"
        placeholder="Họ và tên"
        value={form.fullName}
        onChange={handleChange}
      />

      <input
        type="text"
        name="phone"
        placeholder="Số điện thoại"
        value={form.phone}
        onChange={handleChange}
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />

      <input
        type="text"
        name="address"
        placeholder="Địa chỉ"
        value={form.address}
        onChange={handleChange}
      />

      <textarea
        name="note"
        placeholder="Ghi chú"
        rows="4"
        value={form.note}
        onChange={handleChange}
      />

      <div className="checkout-buttons">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => window.history.back()}
        >
          Quay lại
        </button>

        <button type="submit" className="btn btn-warning">
          Tiếp tục
        </button>
      </div>
    </form>
  );
}

export default CustomerForm;
