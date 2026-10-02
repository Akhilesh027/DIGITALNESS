// Auto-detect API base URL based on environment and hostname
const getDetectedApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
      return "https://server.digitalness.co.in/api";
    }
  }
  return "https://server.digitalness.co.in/api";
};

export const API_BASE_URL = getDetectedApiBaseUrl();

// Base backend URL for static files (/uploads/...)
export const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const getMediaUrl = (path) => {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

export const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("clientToken") || localStorage.getItem("token");
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const safeJsonParse = (val, fallback = null) => {
  try {
    if (!val || val === "null" || val === "undefined") return fallback;
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

export const extractCustomerId = (client, customer) => {
  return (
    customer?._id ||
    customer?.id ||
    customer?.customerId?._id ||
    customer?.customerId ||
    client?.customerId?._id ||
    client?.customerId ||
    client?.customer?._id ||
    client?.customer ||
    client?.customerData?._id ||
    client?.customerData?.id ||
    null
  );
};
