import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const API = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("eshop_session")) || null; } catch { return null; }
  });

  const request = async (path, payload) => {
    const response = await fetch(`${API}${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Không thể kết nối máy chủ");
    localStorage.setItem("eshop_session", JSON.stringify(data));
    setSession(data);
    return data;
  };

  const value = useMemo(() => ({
    session, login: (email, password) => request("/auth/login", { email, password }),
    register: (payload) => request("/auth/register", payload),
    logout: () => { localStorage.removeItem("eshop_session"); setSession(null); },
    api: async (path, options = {}) => {
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token || ""}`, ...(options.headers || {}) },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { localStorage.removeItem("eshop_session"); setSession(null); }
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "Yêu cầu thất bại");
      return data;
    },
  }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
