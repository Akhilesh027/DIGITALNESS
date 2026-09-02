// ==================== Token Management ====================

const TOKEN_KEY = "token";
const USER_KEY = "user";

const decodeJwtPayload = (token: string): any => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isTokenValid = (token?: string | null): boolean => {
  if (!token || typeof token !== "string" || token.trim() === "") return false;
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return false;
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false; // Token expired
    }
    return true;
  } catch {
    return false;
  }
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("currentUser");
  localStorage.removeItem("todayAttendance");
};

export const handleAuthError = (redirectTo = "/"): void => {
  clearAuth();
  if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
    window.location.href = redirectTo;
  }
};

export const getToken = (): string | null => {
  const token =
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (!token || typeof token !== "string" || token.trim() === "") {
    return null;
  }
  return token;
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("authToken", token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");
};

// ==================== User Management ====================

export interface User {
  _id: string;
  id?: string; // fallback
  name: string;
  email?: string;
  role: string;
  branchId?: string;
  department?: string;
  status?: string;
}

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_KEY) || localStorage.getItem("currentUser");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return {
      _id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      department: user.department,
      status: user.status,
    };
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem("currentUser", JSON.stringify(user));
};

export const removeCurrentUser = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("currentUser");
};

// ==================== Auth Headers ====================

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const jsonHeaders = (): Record<string, string> => {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
};

// ==================== Role Helpers ====================

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Admin";
};

export const isOperationalManager = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Operational Manager";
};

export const isAdminOrManager = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Admin" || user?.role === "Operational Manager";
};

export const isTelecaller = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Telecaller";
};

export const isBDE = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "BDE";
};

export const isSupport = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Support";
};

export const hasRole = (allowedRoles: string[]): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return allowedRoles.includes(user.role);
};

// ==================== Logout ====================

export const logout = (redirectTo = "/"): void => {
  clearAuth();
  window.location.href = redirectTo;
};