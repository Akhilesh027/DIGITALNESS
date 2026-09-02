const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function authHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchAdCampaigns(params: { customerId?: string; status?: string; platform?: string } = {}) {
  const query = new URLSearchParams();
  if (params.customerId) query.append("customerId", params.customerId);
  if (params.status) query.append("status", params.status);
  if (params.platform) query.append("platform", params.platform);

  const res = await fetch(`${API_BASE}/ads/campaigns?${query.toString()}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.campaigns || [];
}

export async function fetchAdCampaignById(id: string) {
  const res = await fetch(`${API_BASE}/ads/campaigns/${id}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.campaign;
}

export async function synthesizeAdCampaign(payload: {
  customerId: string;
  objective?: string;
  platform?: string;
  dailyBudget?: number;
  customPrompt?: string;
  targetLocation?: string;
  posterPrompt?: string;
  headline?: string;
  primaryText?: string;
  offerBadge?: string;
  ctaText?: string;
  theme?: string;
}) {
  const res = await fetch(`${API_BASE}/ads/campaigns/synthesize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function createManualAdCampaign(payload: any) {
  const res = await fetch(`${API_BASE}/ads/campaigns/create-manual`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function generateAdPoster(id: string, payload: { prompt?: string; headline?: string; subheadline?: string; offerBadge?: string; theme?: string }) {
  const res = await fetch(`${API_BASE}/ads/campaigns/${id}/generate-poster`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function approveAdCampaign(id: string) {
  const res = await fetch(`${API_BASE}/ads/campaigns/${id}/approve`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.json();
}

export async function toggleAdCampaignStatus(id: string) {
  const res = await fetch(`${API_BASE}/ads/campaigns/${id}/toggle-status`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.json();
}

export async function updateAdCampaign(id: string, updates: any) {
  const res = await fetch(`${API_BASE}/ads/campaigns/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function attachCreativeToAdCampaign(id: string, data: { creativeProjectId: string; variantIndex?: number; headline?: string }) {
  const res = await fetch(`${API_BASE}/ads/campaigns/${id}/attach-creative`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function scanAdCampaignPerformance() {
  const res = await fetch(`${API_BASE}/ads/campaigns/scan-performance`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.json();
}

export async function dispatchAdCampaign(id: string, payload: any = {}) {
  const res = await fetch(`${API_BASE}/ads/campaigns/${id}/dispatch`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function reviseAdCampaign(id: string, updates: any) {
  const res = await fetch(`${API_BASE}/ads/campaigns/${id}/revise`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  return res.json();
}
