import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

export type ApprovalDomain =
  | "CREATIVE"
  | "SOCIAL_POST"
  | "META_ADS"
  | "GOOGLE_ADS"
  | "GBP"
  | "WHATSAPP"
  | "PAYMENT"
  | "LEAD"
  | "CONTENT"
  | "INTERNAL";

export type ApprovalRiskLevel = "R0" | "R1" | "R2" | "R3";

export type ApprovalStatus =
  | "DRAFT"
  | "AI_GENERATED"
  | "WAITING_APPROVAL"
  | "CHANGES_REQUESTED"
  | "REGENERATING"
  | "APPROVED"
  | "REJECTED"
  | "QUEUED"
  | "EXECUTING"
  | "EXECUTED"
  | "FAILED"
  | "CANCELLED";

export interface ApprovalVersion {
  _id?: string;
  versionNumber: number;
  createdAt: string;
  generatedByType: string;
  generatedBy: string;
  blueprintPayload: any;
  executionPayload: any;
  previewUrl?: string | null;
  assetIds?: string[];
  managerFeedback?: string | null;
  feedbackBy?: any;
  feedbackAt?: string | null;
  superseded: boolean;
}

export interface ApprovalAuditItem {
  _id: string;
  approvalId: string;
  fromStatus: string;
  toStatus: string;
  action: string;
  actorType: string;
  actorRole: string;
  actorId?: any;
  remarks?: string;
  version: number;
  createdAt: string;
}

export interface UnifiedApprovalItem {
  _id: string;
  approvalId: string;
  title: string;
  description?: string;
  domain: ApprovalDomain;
  actionType?: string;
  riskLevel: ApprovalRiskLevel;
  status: ApprovalStatus;
  customer?: any;
  clientLocation?: any;
  sourceAgent?: string;
  sourceCommand?: string;
  currentVersion: number;
  versions?: ApprovalVersion[];
  executionIntent?: {
    connector?: string;
    service?: string;
    action?: string;
    payload?: any;
  };
  submittedByType?: string;
  submittedBy?: any;
  decidedBy?: any;
  decisionRemarks?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  queuedAt?: string;
  executionStartedAt?: string;
  executedAt?: string;
  failedAt?: string;
  failureReason?: string;
  isLegacy?: boolean;
  auditHistory?: ApprovalAuditItem[];
  createdAt: string;
  updatedAt: string;
}

export const fetchApprovals = async (params: {
  status?: string;
  domain?: string;
  riskLevel?: string;
  customer?: string;
  page?: number;
  limit?: number;
  includeLegacy?: boolean;
}) => {
  const res = await axios.get(`${API_BASE_URL}/approvals`, {
    ...getAuthHeaders(),
    params: {
      ...params,
      includeLegacy: params.includeLegacy !== false ? "true" : "false",
    },
  });
  return res.data;
};

export const fetchApprovalById = async (id: string) => {
  const res = await axios.get(`${API_BASE_URL}/approvals/${id}`, getAuthHeaders());
  return res.data;
};

export const createApprovalRequest = async (payload: Partial<UnifiedApprovalItem>) => {
  const res = await axios.post(`${API_BASE_URL}/approvals`, payload, getAuthHeaders());
  return res.data;
};

export const submitApproval = async (id: string, remarks?: string) => {
  const res = await axios.post(`${API_BASE_URL}/approvals/${id}/submit`, { remarks }, getAuthHeaders());
  return res.data;
};

export const approveApproval = async (id: string, remarks?: string) => {
  const res = await axios.post(`${API_BASE_URL}/approvals/${id}/approve`, { remarks }, getAuthHeaders());
  return res.data;
};

export const rejectApproval = async (id: string, reason: string) => {
  const res = await axios.post(`${API_BASE_URL}/approvals/${id}/reject`, { reason }, getAuthHeaders());
  return res.data;
};

export const requestApprovalChanges = async (id: string, feedback: string) => {
  const res = await axios.post(`${API_BASE_URL}/approvals/${id}/request-changes`, { feedback }, getAuthHeaders());
  return res.data;
};

export const cancelApproval = async (id: string, reason?: string) => {
  const res = await axios.post(`${API_BASE_URL}/approvals/${id}/cancel`, { reason }, getAuthHeaders());
  return res.data;
};

export const addApprovalVersion = async (id: string, payload: any) => {
  const res = await axios.post(`${API_BASE_URL}/approvals/${id}/version`, payload, getAuthHeaders());
  return res.data;
};

export const fetchApprovalHistory = async (id: string) => {
  const res = await axios.get(`${API_BASE_URL}/approvals/${id}/history`, getAuthHeaders());
  return res.data;
};
