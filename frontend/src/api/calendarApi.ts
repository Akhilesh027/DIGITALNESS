import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export interface MarketingCalendarItemDTO {
  _id: string;
  calendarItemId: string;
  customerId: {
    _id: string;
    name: string;
    brandName?: string;
    companyName?: string;
    logoUrl?: string;
  };
  locationId?: {
    _id: string;
    name: string;
    city?: string;
  };
  sourceType: string;
  sourceId: string;
  itemType: string;
  channel: "INSTAGRAM" | "FACEBOOK" | "GOOGLE_BUSINESS" | "META_ADS" | "GOOGLE_ADS" | "INTERNAL";
  title: string;
  caption?: string;
  status: string;
  scheduledStartAt: string;
  timezone: string;
  ownerId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  creativeAssetId?: any;
  pinnedCreativeVersion: number;
  approvalId?: any;
  readinessState: string;
  readinessScorePercent: number;
  blockers: {
    code: string;
    severity: string;
    message: string;
    sourceId?: string;
  }[];
  campaignGroupId?: any;
  providerReceipts?: any[];
}

export interface DailyOperationsDTO {
  date: string;
  totalCount: number;
  lanes: {
    OVERDUE: MarketingCalendarItemDTO[];
    NEEDS_CREATIVE: MarketingCalendarItemDTO[];
    NEEDS_APPROVAL: MarketingCalendarItemDTO[];
    READY: MarketingCalendarItemDTO[];
    SCHEDULED: MarketingCalendarItemDTO[];
    PUBLISHED: MarketingCalendarItemDTO[];
    FAILED: MarketingCalendarItemDTO[];
  };
}

export const getCalendarItems = async (params: any = {}) => {
  const res = await axios.get(`${API_URL}/api/calendar`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const getDailyOperations = async (params: any = {}) => {
  const res = await axios.get(`${API_URL}/api/calendar/day`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const getCalendarCampaigns = async (params: any = {}) => {
  const res = await axios.get(`${API_URL}/api/calendar/campaigns`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const getCalendarGaps = async (customerId: string) => {
  const res = await axios.get(`${API_URL}/api/calendar/gaps`, {
    headers: getHeaders(),
    params: { customerId },
  });
  return res.data;
};

export const getCalendarItemDetail = async (id: string) => {
  const res = await axios.get(`${API_URL}/api/calendar/${id}`, {
    headers: getHeaders(),
  });
  return res.data;
};

export const rescheduleCalendarItem = async (id: string, newStartAt: string, timezone: string = "Asia/Kolkata") => {
  const res = await axios.post(
    `${API_URL}/api/calendar/${id}/reschedule`,
    { newStartAt, timezone },
    { headers: getHeaders() }
  );
  return res.data;
};

export const attachCreativeToCalendarItem = async (id: string, creativeAssetId: string, pinnedVersion: number = 1) => {
  const res = await axios.post(
    `${API_URL}/api/calendar/${id}/attach-creative`,
    { creativeAssetId, pinnedVersion },
    { headers: getHeaders() }
  );
  return res.data;
};
