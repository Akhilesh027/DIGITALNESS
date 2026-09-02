const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

export const getAuditLogs = async (params: { customerId?: string; actorType?: string; action?: string; status?: string } = {}) => {
  const queryParams = new URLSearchParams();
  if (params.customerId) queryParams.append("customerId", params.customerId);
  if (params.actorType) queryParams.append("actorType", params.actorType);
  if (params.action) queryParams.append("action", params.action);
  if (params.status) queryParams.append("status", params.status);

  const res = await fetch(`${API_URL}/audit-logs?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to fetch audit logs");
  const data = await res.json();
  return data.logs || [];
};
