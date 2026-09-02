const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

const getToken = () => localStorage.getItem("token");

export const getContentItems = async (params: { customerId?: string; status?: string; approvalStatus?: string; publishStatus?: string; contentType?: string } = {}) => {
  const queryParams = new URLSearchParams();
  if (params.customerId) queryParams.append("customerId", params.customerId);
  if (params.status) queryParams.append("status", params.status);
  if (params.approvalStatus) queryParams.append("approvalStatus", params.approvalStatus);
  if (params.publishStatus) queryParams.append("publishStatus", params.publishStatus);
  if (params.contentType) queryParams.append("contentType", params.contentType);

  const res = await fetch(`${API_URL}/content-items?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to fetch content items");
  const data = await res.json();
  return data.items || [];
};

export const createContentItem = async (payload: any) => {
  const res = await fetch(`${API_URL}/content-items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create content item");
  }

  return await res.json();
};

export const updateContentItem = async (id: string, payload: any) => {
  const res = await fetch(`${API_URL}/content-items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update content item");
  }

  return await res.json();
};

export const submitContentForApproval = async (id: string, reviewMessage?: string) => {
  const res = await fetch(`${API_URL}/content-items/${id}/submit-approval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ reviewMessage }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to submit content for approval");
  }

  return await res.json();
};

export const approveContentItem = async (id: string, remark?: string) => {
  const res = await fetch(`${API_URL}/content-items/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ remark }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to approve content item");
  }

  return await res.json();
};

export const requestContentRevision = async (id: string, remark?: string) => {
  const res = await fetch(`${API_URL}/content-items/${id}/request-revision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ remark }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to request content revision");
  }

  return await res.json();
};

export const scheduleContent = async (id: string, scheduledFor: string, timezone = "Asia/Kolkata") => {
  const res = await fetch(`${API_URL}/content-items/${id}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ scheduledFor, timezone }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to schedule content item");
  }

  return await res.json();
};

export const cancelContentSchedule = async (id: string) => {
  const res = await fetch(`${API_URL}/content-items/${id}/cancel-schedule`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to cancel content schedule");
  }

  return await res.json();
};
