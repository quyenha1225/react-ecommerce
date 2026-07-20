import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Login({ show, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  if (!show) return null;

  return (
    <div className="login-overlay" onClick={onClose}>
      <div
        className="login-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="login-header">
          <h3>{isLogin ? "Đăng nhập" : "Đăng ký"}</h3>

          <button className="login-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="login-tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => setIsLogin(true)}
          >
            Đăng nhập
          </button>

          <button
            className={!isLogin ? "active" : ""}
            onClick={() => setIsLogin(false)}
          >
            Đăng ký
          </button>
        </div>

        <form>
          {!isLogin && (
            <>
              <label>Họ và tên</label>
              <input type="text" placeholder="Nhập họ tên" />
            </>
          )}

          <label>Email</label>
          <input type="email" placeholder="Email" />

          {!isLogin && (
            <>
              <label>Số điện thoại</label>
              <input type="text" placeholder="Số điện thoại" />
            </>
          )}

          <label>Mật khẩu</label>

          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon
                icon={[
                  "fas",
                  showPassword ? "eye-slash" : "eye",
                ]}
              />
            </button>
          </div>

          {!isLogin && (
            <>
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
              />
            </>
          )}

          {isLogin && (
            <div className="forgot-password">
              Quên mật khẩu?
            </div>
          )}

          <button type="submit" className="login-btn">
            {isLogin ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}
          </button>

          <div className="divider">
            <span>Hoặc</span>
          </div>

          <div className="social-login">
            <button
              type="button"
              className="google-btn"
            >
              Google
            </button>

            <button
              type="button"
              className="facebook-btn"
            >
              Facebook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;