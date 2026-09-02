import { getToken, authHeaders, jsonHeaders } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

export const getCreativeProjects = async (params: { customerId?: string; approvalStatus?: string; assetType?: string } = {}) => {
  const queryParams = new URLSearchParams();
  if (params.customerId) queryParams.append("customerId", params.customerId);
  if (params.approvalStatus) queryParams.append("approvalStatus", params.approvalStatus);
  if (params.assetType) queryParams.append("assetType", params.assetType);

  const res = await fetch(`${API_URL}/creative-projects?${queryParams.toString()}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch creative projects");
  }
  const data = await res.json();
  return data.projects || [];
};

export const createCreativeProject = async (payload: any) => {
  const res = await fetch(`${API_URL}/creative-projects`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create creative project");
  }

  return await res.json();
};

export const addCreativeVersion = async (
  id: string,
  payload: {
    fileUrl?: string;
    bgImageUrl?: string;
    heroImageUrl?: string;
    headline?: string;
    subheadline?: string;
    offerText?: string;
    ctaText?: string;
    primaryColor?: string;
    accentColor?: string;
    phone?: string;
    website?: string;
    locationName?: string;
    showLogo?: boolean;
    logoUrl?: string | null;
    prompt?: string;
    notes?: string;
  }
) => {
  const res = await fetch(`${API_URL}/creative-projects/${id}/versions`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to add creative version");
  }

  return await res.json();
};

export const scheduleCreativeProject = async (
  id: string,
  payload: {
    scheduledFor?: string | Date;
    platforms?: string[];
    headline?: string;
    caption?: string;
    hashtags?: string[];
    posterData?: any;
    notes?: string;
  }
) => {
  const res = await fetch(`${API_URL}/creative-projects/${id}/schedule`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to schedule creative");
  }

  return await res.json();
};

export const submitCreativeForApproval = async (id: string, reviewMessage?: string) => {
  const res = await fetch(`${API_URL}/creative-projects/${id}/submit-approval`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ reviewMessage }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit creative for approval");
  }

  return await res.json();
};

export const approveCreative = async (id: string, remark?: string) => {
  const res = await fetch(`${API_URL}/creative-projects/${id}/approve`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ remark }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to approve creative");
  }

  return await res.json();
};

export const requestCreativeRevision = async (id: string, remark?: string) => {
  const res = await fetch(`${API_URL}/creative-projects/${id}/request-revision`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ remark }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to request creative revision");
  }

  return await res.json();
};

export const synthesizeAICreativePrompt = async (payload: {
  customerId: string;
  occasion?: string;
  customPrompt?: string;
  topic?: string;
}) => {
  const res = await fetch(`${API_URL}/creatives/synthesize-prompt`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to synthesize AI prompt");
  }

  return await res.json();
};

export const generateAICreative = async (payload: {
  customerId: string;
  locationId?: string;
  occasion?: string;
  customPrompt?: string;
}) => {
  const res = await fetch(`${API_URL}/creatives/generate`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to generate AI creative");
  }

  return await res.json();
};

export const requestAICreativeRevision = async (payload: {
  creativeAssetId: string;
  feedback: string;
  changes?: any;
}) => {
  const res = await fetch(`${API_URL}/creatives/revision`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to request revision");
  }

  return await res.json();
};

