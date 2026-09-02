const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

export const getScheduledJobs = async (params: { status?: string; customerId?: string } = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.customerId) queryParams.append("customerId", params.customerId);

  const res = await fetch(`${API_URL}/scheduled-jobs?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to fetch scheduled jobs");
  const data = await res.json();
  return data.jobs || [];
};

export const cancelScheduledJob = async (id: string) => {
  const res = await fetch(`${API_URL}/scheduled-jobs/${id}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to cancel scheduled job");
  }

  return await res.json();
};

export const retryScheduledJob = async (id: string) => {
  const res = await fetch(`${API_URL}/scheduled-jobs/${id}/retry`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to retry scheduled job");
  }

  return await res.json();
};

export const getQueueHealth = async () => {
  const res = await fetch(`${API_URL}/scheduled-jobs/health`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to fetch queue health");
  return await res.json();
};

export const reconcileQueue = async () => {
  const res = await fetch(`${API_URL}/scheduled-jobs/reconcile`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to reconcile queue");
  return await res.json();
};
