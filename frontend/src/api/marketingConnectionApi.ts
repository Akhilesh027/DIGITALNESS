import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/marketing-connections`;

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

export interface ConnectionHealth {
  healthy: boolean;
  status: "CONNECTED" | "EXPIRED" | "REAUTH_REQUIRED" | "ERROR" | "DISCONNECTED" | "REVOKED";
  issues: string[];
  tokenExpiresAt?: string | null;
  lastHealthCheckAt?: string;
  platform?: string;
  accountType?: string;
  platformAccountName?: string;
}

export interface MarketingConnectionItem {
  _id: string;
  customerId: string;
  locationId?: any;
  platform: string;
  accountType: string;
  platformAccountId: string;
  platformAccountName: string;
  status: "CONNECTED" | "EXPIRED" | "REAUTH_REQUIRED" | "ERROR" | "DISCONNECTED" | "REVOKED" | "Connected" | "Expired" | "Error" | "Disconnected";
  scopes?: string[];
  metadata?: Record<string, any>;
  lastError?: {
    code?: string | null;
    message?: string | null;
    occurredAt?: string | null;
  };
  lastHealthCheckAt?: string;
  lastSuccessfulApiCallAt?: string | null;
  reauthRequired?: boolean;
  tokenExpiresAt?: string | null;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const getMarketingConnections = async (
  customerId: string,
  locationId?: string,
  platform?: string
): Promise<MarketingConnectionItem[]> => {
  const params = new URLSearchParams({ customerId });
  if (locationId) params.append("locationId", locationId);
  if (platform) params.append("platform", platform);

  const response = await axios.get(`${API_URL}?${params.toString()}`, getAuthHeaders());
  return response.data.data;
};

export const connectPlatformAccount = async (payload: {
  customerId: string;
  locationId?: string;
  platform: string;
  accountType: string;
  platformAccountId: string;
  platformAccountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scopes?: string[];
  metadata?: any;
}) => {
  const response = await axios.post(`${API_URL}/connect`, payload, getAuthHeaders());
  return response.data.data;
};

export const disconnectPlatformAccount = async (connectionId: string) => {
  const response = await axios.post(`${API_URL}/${connectionId}/disconnect`, {}, getAuthHeaders());
  return response.data;
};

export const checkConnectionHealth = async (connectionId: string): Promise<ConnectionHealth> => {
  const response = await axios.get(`${API_URL}/${connectionId}/health`, getAuthHeaders());
  return response.data.data;
};

export const startMetaOAuth = async (customerId: string, locationId?: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const params = new URLSearchParams({ customerId });
  if (locationId) params.append("locationId", locationId);
  const response = await axios.get(`${baseUrl}/integrations/meta/connect?${params.toString()}`, getAuthHeaders());
  return response.data.data;
};

export const getMetaDiscoverySession = async (sessionId: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const response = await axios.get(`${baseUrl}/integrations/meta/discovery/${sessionId}`, getAuthHeaders());
  return response.data.data;
};

export const confirmMetaAssets = async (payload: {
  discoverySessionId: string;
  customerId: string;
  locationId?: string;
  selectedAssets: {
    facebookPageId?: string;
    instagramBusinessAccountId?: string;
    metaAdAccountId?: string;
  };
}) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const response = await axios.post(`${baseUrl}/integrations/meta/confirm-assets`, payload, getAuthHeaders());
  return response.data.data;
};

export const startGoogleBusinessOAuth = async (customerId: string, locationId?: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const params = new URLSearchParams({ customerId });
  if (locationId) params.append("locationId", locationId);
  const response = await axios.get(`${baseUrl}/integrations/google-business/connect?${params.toString()}`, getAuthHeaders());
  return response.data;
};

export const getGoogleBusinessDiscoverySession = async (sessionId: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const response = await axios.get(`${baseUrl}/integrations/google-business/discovery/${sessionId}`, getAuthHeaders());
  return response.data;
};

export const confirmGoogleBusinessLocation = async (payload: {
  sessionId: string;
  customerId: string;
  crmLocationId?: string;
  googleAccountId: string;
  googleLocationId: string;
}) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const response = await axios.post(`${baseUrl}/integrations/google-business/confirm-location`, payload, getAuthHeaders());
  return response.data;
};
