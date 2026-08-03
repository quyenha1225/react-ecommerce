import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { mergeGuestCartToUser } from "../utils/cartStorage";

const AuthContext = createContext(null);
const API = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("eshop_session")) || null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No active session");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const restored = { success: true, user: data.user };
        localStorage.setItem("eshop_session", JSON.stringify(restored));
        setSession(restored);
        mergeGuestCartToUser();
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("eshop_session");
        setSession(null);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const request = async (path, payload) => {
    const response = await fetch(`${API}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Không thể kết nối máy chủ",
      );
    }

    const userObj = data.user || data.data || data;
    const formattedSession = {
      ...data,
      user: {
        ...userObj,
        fullName:
          userObj.fullName ||
          userObj.user_full_name ||
          userObj.name ||
          payload.fullName ||
          "",
        phone:
          userObj.phone ||
          userObj.phone_number ||
          userObj.phoneNumber ||
          userObj.user_phone ||
          payload.phone ||
          "",
        email: userObj.email || userObj.user_email || payload.email || "",
      },
    };

    localStorage.setItem("eshop_session", JSON.stringify(formattedSession));
    setSession(formattedSession);

    mergeGuestCartToUser();

    return formattedSession;
  };

  const logout = () => {
    fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    localStorage.removeItem("eshop_session");
    localStorage.removeItem("customer-info");
    localStorage.removeItem("payment-method");
    setSession(null);
    window.location.href = "/";
  };

  const value = useMemo(
    () => ({
      session,
      authReady,
      login: (email, password) => request("/auth/login", { email, password }),
      register: ({ confirm, confirmPassword, confirm_password, ...payload }) =>
        request("/auth/register", payload),
      logout,
      updateSessionUser: (user) => {
        const next = { ...session, user: { ...session?.user, ...user } };
        localStorage.setItem("eshop_session", JSON.stringify(next));
        setSession(next);
      },
      api: async (path, options = {}) => {
        const response = await fetch(`${API}${path}`, {
          ...options,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
          },
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          logout();
        }
        if (!response.ok)
          throw new Error(
            Array.isArray(data.message)
              ? data.message.join(", ")
              : data.message || "Yêu cầu thất bại",
          );
        return data;
      },
    }),
    [session, authReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
