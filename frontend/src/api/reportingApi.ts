import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export interface AgencyOverviewDTO {
  period: { startDate: string; endDate: string };
  topKpis: {
    activeClients: number;
    scheduledToday: number;
    publishedThisMonth: number;
    totalLeads: number;
    qualifiedLeads: number;
    wonLeads: number;
    pendingApprovals: number;
    slaAtRisk: number;
    slaBreached: number;
  };
  adPerformance: {
    metaSpend: number;
    googleSpend: number;
    totalAdSpend: number;
    metaPrimaryResults: number;
    googlePrimaryResults: number;
    totalPrimaryResults: number;
    blendedCPL: number | null;
    currency: string;
  };
  operationsBarometer: {
    contentDeliveryRate: number;
    slaComplianceRate: number;
    totalInboxItems: number;
    resolvedInboxItems: number;
  };
}

export interface ClientScorecardDTO {
  customer: {
    _id: string;
    name: string;
    brandName?: string;
    companyName?: string;
    industry?: string;
  };
  period: { startDate: string; endDate: string };
  healthScore: {
    score: number;
    status: string;
    breakdown: any;
  };
  narrative: {
    summaryText: string;
    highlights: string[];
    risks: string[];
    recommendations: any[];
  };
  contentDelivery: {
    planned: number;
    published: number;
    deliveryRate: number;
    reelsPublished: number;
    gbpPostsPublished: number;
    hasGaps: boolean;
    gaps: any[];
  };
  metaAds: {
    status: string;
    spend: number | null;
    impressions?: number;
    clicks?: number;
    leads: number | null;
    costPerLead: number | null;
  };
  googleAds: {
    status: string;
    spend: number | null;
    impressions?: number;
    clicks?: number;
    primaryResults: number | null;
    costPerResult: number | null;
  };
  leadPipeline: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    won: number;
    conversionRate: number;
  };
  whatsapp: {
    conversations: number;
    followUpsSent: number;
    responsesAfterFollowUp: number;
  };
  reputation: {
    reviewsReceived: number;
    averageRating: number;
    repliesCompleted: number;
    replyRate: number;
  };
}

export const getAgencyOverview = async (params: any = {}) => {
  const res = await axios.get(`${API_URL}/api/reporting/agency`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const getClientsReportingSummary = async () => {
  const res = await axios.get(`${API_URL}/api/reporting/clients`, {
    headers: getHeaders(),
  });
  return res.data;
};

export const getClientScorecard = async (customerId: string, params: any = {}) => {
  const res = await axios.get(`${API_URL}/api/reporting/client/${customerId}`, {
    headers: getHeaders(),
    params,
  });
  return res.data;
};

export const generateReportSnapshot = async (customerId: string, data: any = {}) => {
  const res = await axios.post(`${API_URL}/api/reporting/client/${customerId}/generate`, data, {
    headers: getHeaders(),
  });
  return res.data;
};
