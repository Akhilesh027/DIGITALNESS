import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export interface CertificationGateDTO {
  gateId: string;
  domain: string;
  status: "PASS" | "FAIL" | "BLOCKED" | "NOT_RUN" | "NOT_IN_SCOPE";
  testedAt?: string;
  evidenceRefs?: any;
  failureReason?: string;
}

export interface CertificationStatusDTO {
  certificationId: string;
  status: string;
  environment: string;
  passedCount: number;
  totalCount: number;
  failedCount: number;
  notRunCount: number;
  completionRate: number;
  gates: CertificationGateDTO[];
  blockingIssues: string[];
  openIncidentsCount: number;
  openIncidents: any[];
  pilotConfig: {
    externalWritesEnabled: boolean;
    domainWrites: Record<string, boolean>;
  };
}

export const getCertificationStatus = async () => {
  const res = await axios.get(`${API_URL}/api/system/certification`, {
    headers: getHeaders(),
  });
  return res.data;
};

export const signOffPilotGoLive = async () => {
  const res = await axios.post(`${API_URL}/api/system/certification/sign-off`, {}, {
    headers: getHeaders(),
  });
  return res.data;
};

export const toggleKillSwitch = async (domain: string, enabled: boolean) => {
  const res = await axios.post(
    `${API_URL}/api/system/certification/kill-switch`,
    { domain, enabled },
    { headers: getHeaders() }
  );
  return res.data;
};
