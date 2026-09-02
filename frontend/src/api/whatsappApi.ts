import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export interface WhatsAppConversation {
  _id: string;
  conversationId: string;
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
  leadId?: {
    _id: string;
    name: string;
    contactNumber: string;
    leadScore?: string;
    status?: string;
    businessType?: string;
  };
  participantWaId: string;
  phoneNumberId: string;
  state: string;
  automationMode: "AUTOMATED" | "HUMAN";
  humanHandoffRequested: boolean;
  marketingOptIn: boolean;
  windowStatus: {
    isOpen: boolean;
    windowStatus: "OPEN" | "CLOSED";
    remainingMinutes: number;
    requiresTemplate: boolean;
    expiresAt?: string;
  };
  qualificationSummary?: {
    intent?: string;
    serviceInterest?: string;
    urgency?: string;
    purchaseTimeline?: string;
    qualificationScore?: number;
    humanEscalationRecommended?: boolean;
    nextRecommendedAction?: string;
  };
  lastMessageAt: string;
}

export interface WhatsAppMessage {
  _id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  sender: string;
  recipient: string;
  messageType: "TEXT" | "INTERACTIVE" | "TEMPLATE" | "MEDIA";
  text: string;
  interactive?: any;
  template?: {
    name: string;
    language: string;
    components?: any;
  };
  status: "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  failureCode?: string;
  failureReason?: string;
  approvalId?: {
    approvalId: string;
    status: string;
    riskLevel: string;
  };
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface WhatsAppTemplateItem {
  _id: string;
  name: string;
  language: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  status: "APPROVED" | "PENDING" | "REJECTED";
  parameterSchema?: any;
}

export const getWhatsAppConversations = async (params: { customerId?: string; state?: string } = {}) => {
  const res = await axios.get(`${API_URL}/api/whatsapp/conversations`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const getWhatsAppConversationDetail = async (conversationId: string) => {
  const res = await axios.get(`${API_URL}/api/whatsapp/conversations/${conversationId}`, {
    headers: getHeaders(),
  });
  return res.data;
};

export const sendWhatsAppOutboundMessage = async (conversationId: string, payload: any) => {
  const res = await axios.post(`${API_URL}/api/whatsapp/conversations/${conversationId}/messages`, payload, {
    headers: getHeaders(),
  });
  return res.data;
};

export const pauseWhatsAppAutomation = async (conversationId: string) => {
  const res = await axios.post(`${API_URL}/api/whatsapp/conversations/${conversationId}/pause-automation`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const resumeWhatsAppAutomation = async (conversationId: string) => {
  const res = await axios.post(`${API_URL}/api/whatsapp/conversations/${conversationId}/resume-automation`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const getWhatsAppTemplates = async (params: { customerId?: string; status?: string } = {}) => {
  const res = await axios.get(`${API_URL}/api/whatsapp/templates`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const syncWhatsAppTemplates = async (payload: { customerId: string; wabaId?: string }) => {
  const res = await axios.post(`${API_URL}/api/whatsapp/templates/sync`, payload, {
    headers: getHeaders(),
  });
  return res.data;
};

export const getWhatsAppStatus = async () => {
  const res = await axios.get(`${API_URL}/api/whatsapp/status`, {
    headers: getHeaders(),
  });
  return res.data;
};

export interface FollowUpPolicyItem {
  _id: string;
  policyId: string;
  name: string;
  enabled: boolean;
  version: number;
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  steps: Array<{
    stepNumber: number;
    delayMinutes: number;
    messageType: string;
    templateName?: string;
    serviceWindowText?: string;
  }>;
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    timezone: string;
  };
  maxAttempts: number;
}

export interface FollowUpSequenceItem {
  _id: string;
  sequenceId: string;
  leadId?: {
    _id: string;
    name: string;
    contactNumber: string;
  };
  policyId?: {
    _id: string;
    name: string;
    version: number;
  };
  status: string;
  currentStep: number;
  nextScheduledAt?: string;
  lastExecutionAt?: string;
  stopReason?: string;
  steps: Array<{
    stepNumber: number;
    scheduledFor: string;
    status: string;
    skipReason?: string;
    sentAt?: string;
  }>;
}

export const getFollowUpPolicies = async (params: { customerId?: string } = {}) => {
  const res = await axios.get(`${API_URL}/api/whatsapp/followup/policies`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const createFollowUpPolicy = async (payload: any) => {
  const res = await axios.post(`${API_URL}/api/whatsapp/followup/policies`, payload, {
    headers: getHeaders(),
  });
  return res.data;
};

export const approveFollowUpPolicy = async (policyId: string) => {
  const res = await axios.put(`${API_URL}/api/whatsapp/followup/policies/${policyId}/approve`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const getFollowUpSequences = async (params: { customerId?: string; status?: string } = {}) => {
  const res = await axios.get(`${API_URL}/api/whatsapp/followup/sequences`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const stopFollowUpSequence = async (sequenceId: string) => {
  const res = await axios.post(`${API_URL}/api/whatsapp/followup/sequences/${sequenceId}/stop`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const pauseFollowUpSequence = async (sequenceId: string) => {
  const res = await axios.post(`${API_URL}/api/whatsapp/followup/sequences/${sequenceId}/pause`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const resumeFollowUpSequence = async (sequenceId: string) => {
  const res = await axios.post(`${API_URL}/api/whatsapp/followup/sequences/${sequenceId}/resume`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const getFollowUpAnalytics = async (params: { customerId?: string } = {}) => {
  const res = await axios.get(`${API_URL}/api/whatsapp/followup/analytics`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

