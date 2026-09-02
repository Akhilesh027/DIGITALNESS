import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export interface InboxItemDTO {
  _id: string;
  inboxItemId: string;
  customerId: {
    _id: string;
    name: string;
    companyName?: string;
    brandName?: string;
    logoUrl?: string;
  };
  locationId?: {
    _id: string;
    name: string;
    city?: string;
  };
  sourceType: string;
  sourceId: string;
  channel: "WHATSAPP" | "GOOGLE_BUSINESS" | "META_LEAD" | "GOOGLE_ADS_LEAD" | "WEBSITE" | "PHONE" | "MANUAL" | "INTERNAL";
  category: string;
  status: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "WAITING_INTERNAL" | "SNOOZED" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedTeam?: {
    _id: string;
    name: string;
  };
  assignmentSource: "AUTO" | "MANUAL";
  unread: boolean;
  unreadCount: number;
  title: string;
  snippet: string;
  participantName?: string;
  participantPhone?: string;
  lastActivityAt: string;
  firstResponseDueAt?: string;
  firstResponseHandledAt?: string;
  slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED" | "PAUSED" | "COMPLETED";
  liveSlaStatus?: string;
  remainingMinutes?: number;
  tags: string[];
}

export interface InboxMetricsDTO {
  totalOpen: number;
  unreadCount: number;
  unassignedCount: number;
  slaBreachedCount: number;
  atRiskCount: number;
  whatsAppCount: number;
  reviewsCount: number;
  hotLeadsCount: number;
}

export const getInboxItems = async (params: any = {}) => {
  const res = await axios.get(`${API_URL}/api/inbox`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const getInboxMetrics = async (params: any = {}) => {
  const res = await axios.get(`${API_URL}/api/inbox/metrics`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const getInboxItemDetail = async (id: string) => {
  const res = await axios.get(`${API_URL}/api/inbox/${id}`, {
    headers: getHeaders(),
  });
  return res.data;
};

export const assignInboxItem = async (id: string, payload: { assignedTo?: string; assignedTeam?: string }) => {
  const res = await axios.post(`${API_URL}/api/inbox/${id}/assign`, payload, {
    headers: getHeaders(),
  });
  return res.data;
};

export const unassignInboxItem = async (id: string) => {
  const res = await axios.post(`${API_URL}/api/inbox/${id}/unassign`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const updateInboxItemStatus = async (id: string, status: string) => {
  const res = await axios.post(`${API_URL}/api/inbox/${id}/status`, { status }, {
    headers: getHeaders(),
  });
  return res.data;
};

export const updateInboxItemPriority = async (id: string, priority: string) => {
  const res = await axios.post(`${API_URL}/api/inbox/${id}/priority`, { priority }, {
    headers: getHeaders(),
  });
  return res.data;
};

export const addInboxInternalNote = async (id: string, payload: { body: string; mentions?: any[] }) => {
  const res = await axios.post(`${API_URL}/api/inbox/${id}/note`, payload, {
    headers: getHeaders(),
  });
  return res.data;
};

export const takeOverInboxConversation = async (id: string) => {
  const res = await axios.post(`${API_URL}/api/inbox/${id}/takeover`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const resumeInboxAutomation = async (id: string) => {
  const res = await axios.post(`${API_URL}/api/inbox/${id}/resume-automation`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const generateInboxAIDraft = async (id: string) => {
  const res = await axios.post(`${API_URL}/api/inbox/${id}/ai-draft`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};
