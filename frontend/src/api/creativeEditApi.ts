import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export interface InterpretedOperation {
  intent: string;
  targetRole: string;
  elementId?: string;
  parameters?: any;
  managerProvidedValue?: string;
}

export interface UnsupportedOperation {
  intent: string;
  requestedText: string;
  reasonCode: string;
  explanation: string;
  suggestedManualAction: string;
}

export interface CreativeEditRequestDTO {
  _id: string;
  editRequestId: string;
  customerId: string;
  creativeAssetId: string;
  canvaDesignId: string;
  sourceVersion: number;
  rawManagerFeedback: string;
  interpretedOperations: InterpretedOperation[];
  unsupportedOperations: UnsupportedOperation[];
  executionMode: "CANVA_TRANSACTION" | "NATIVE_RENDERER" | "MANUAL_REQUIRED";
  status: string;
  previewReference?: {
    beforePreviewUrl: string;
    afterPreviewUrl: string;
    changedPages: number[];
  };
  approvalId?: string;
}

export const submitCreativeEditRequest = async (creativeAssetId: string, rawFeedback: string) => {
  const res = await axios.post(
    `${API_URL}/api/creatives/${creativeAssetId}/edit-request`,
    { rawFeedback },
    { headers: getHeaders() }
  );
  return res.data;
};

export const getCreativeEditRequest = async (editRequestId: string) => {
  const res = await axios.get(`${API_URL}/api/creatives/edit-requests/${editRequestId}`, {
    headers: getHeaders(),
  });
  return res.data;
};

export const approveAndCommitCanvaEdit = async (editRequestId: string) => {
  const res = await axios.post(
    `${API_URL}/api/creatives/edit-requests/${editRequestId}/approve-commit`,
    {},
    { headers: getHeaders() }
  );
  return res.data;
};

export const cancelCanvaEdit = async (editRequestId: string) => {
  const res = await axios.post(
    `${API_URL}/api/creatives/edit-requests/${editRequestId}/cancel`,
    {},
    { headers: getHeaders() }
  );
  return res.data;
};
