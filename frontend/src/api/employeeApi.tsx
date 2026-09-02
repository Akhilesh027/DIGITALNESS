import { authHeaders } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getEmployees = async () => {
  const res = await fetch(`${API_URL}/users`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch employees");
  // Backend may return array directly or { users: [] }
  return Array.isArray(data) ? data : data.users || [];
};