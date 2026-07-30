import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login({ show = true, onClose = () => {} }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [state, setState] = useState({ loading: false, error: "" });
  const { login, register } = useAuth();
  const navigate = useNavigate();
  if (!show) return null;

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setState({ loading: true, error: "" });
    try {
      if (!isLogin && form.password !== form.confirm) throw new Error("Mật khẩu xác nhận chưa trùng khớp");
      const result = isLogin ? await login(form.email, form.password) : await register(form);
      onClose();
      navigate(["ADMIN", "STAFF"].includes(result.user.role) ? "/admin" : "/");
    } catch (error) { setState({ loading: false, error: error.message }); }
  };

  return <div className="login-overlay" onClick={onClose}>
    <div className="login-modal auth-modern" onClick={(e) => e.stopPropagation()}>
      <div className="login-header"><div><small>CHÀO MỪNG ĐẾN ELECTROSHOP</small><h3>{isLogin ? "Đăng nhập" : "Tạo tài khoản khách hàng"}</h3></div><button className="login-close" onClick={onClose}>×</button></div>
      <div className="login-tabs"><button className={isLogin ? "active" : ""} onClick={() => setIsLogin(true)}>Đăng nhập</button><button className={!isLogin ? "active" : ""} onClick={() => setIsLogin(false)}>Đăng ký</button></div>
      <form onSubmit={submit}>
        {!isLogin && <><label>Họ và tên</label><input required name="name" value={form.name} onChange={update} placeholder="Nguyễn Văn An"/><label>Số điện thoại</label><input required name="phone" value={form.phone} onChange={update} placeholder="09xxxxxxxx"/></>}
        <label>Email</label><input required type="email" name="email" value={form.email} onChange={update} placeholder="ban@email.com" />
        <label>Mật khẩu</label><div className="password-box"><input required minLength={isLogin ? 1 : 10} name="password" value={form.password} onChange={update} type={showPassword ? "text" : "password"} placeholder={isLogin ? "Nhập mật khẩu" : "Ít nhất 10 ký tự, chữ hoa, số và ký hiệu"}/><button type="button" onClick={() => setShowPassword(!showPassword)}><FontAwesomeIcon icon={["fas", showPassword ? "eye-slash" : "eye"]}/></button></div>
        {!isLogin && <><label>Xác nhận mật khẩu</label><input required name="confirm" value={form.confirm} onChange={update} type="password"/><p className="customer-only-note"><FontAwesomeIcon icon={["fas","shield-alt"]}/> Đăng ký công khai chỉ tạo tài khoản khách hàng. Nhân viên do quản trị viên cấp.</p></>}
        {state.error && <div className="auth-error">{state.error}</div>}
        <button disabled={state.loading} type="submit" className="login-btn">{state.loading ? "ĐANG XỬ LÝ..." : isLogin ? "ĐĂNG NHẬP" : "TẠO TÀI KHOẢN"}</button>
      </form>
    </div>
  </div>;
}
