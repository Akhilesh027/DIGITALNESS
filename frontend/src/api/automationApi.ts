import { authHeaders } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

export interface AutomationPolicy {
  _id?: string;
  key: string;
  name: string;
  description: string;
  engine: string;
  enabled: boolean;
  mode: "DISABLED" | "SUGGEST_ONLY" | "DRAFT" | "APPROVAL_REQUIRED" | "AUTO_EXECUTE";
  rolesAllowed: string[];
  maxActionsPerRun: number;
  lastTriggeredAt?: string;
}

export interface AutomationRun {
  _id: string;
  runId: string;
  engine: string;
  triggerType: "EVENT" | "SCHEDULE" | "COMMAND" | "MANUAL";
  triggerReference?: string;
  status: "QUEUED" | "RUNNING" | "WAITING_APPROVAL" | "COMPLETED" | "PARTIAL" | "FAILED" | "SKIPPED";
  summary?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  actionsPlanned?: any[];
  actionsExecuted?: any[];
}

export interface AutomationSummary {
  counts: {
    totalRuns: number;
    completed: number;
    waitingApproval: number;
    failed: number;
  };
  highlights: {
    engine: string;
    summary: string;
    time: string;
    status: string;
  }[];
  runs: AutomationRun[];
}

export const getAutomationPolicies = async (): Promise<AutomationPolicy[]> => {
  const res = await fetch(`${API_URL}/ai/automation/policies`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch automation policies");
  return data.data || [];
};

export const updateAutomationPolicy = async (
  key: string,
  updates: Partial<AutomationPolicy>
): Promise<AutomationPolicy> => {
  const res = await fetch(`${API_URL}/ai/automation/policies/${key}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update policy");
  return data.data;
};

export const getAutomationRuns = async (limit = 20): Promise<AutomationRun[]> => {
  const res = await fetch(`${API_URL}/ai/automation/runs?limit=${limit}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch automation runs");
  return data.data || [];
};

export const getAutomationSummary = async (): Promise<AutomationSummary> => {
  const res = await fetch(`${API_URL}/ai/automation/summary`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch automation summary");
  return data.data;
};

export const triggerAutomationJob = async (jobType: string, metadata?: any): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/trigger`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ jobType, metadata }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to trigger automation job");
  return data;
};

// ----------------------------------------------------
// PHASE 5B: CLIENT PIPELINE & WORKLOAD INTERFACES & APIS
// ----------------------------------------------------
export interface ServicePackage {
  _id: string;
  name: string;
  code: string;
  description: string;
  industryTags: string[];
  deliverables: {
    type: string;
    title: string;
    quantity: number;
    cadence: string;
    preferredRole: string;
    slaHours: number;
    schedulingStrategy: string;
    requiresApproval: boolean;
  }[];
}

export interface EmployeeCapacity {
  employeeId: string;
  employeeName: string;
  email: string;
  role: string;
  department: string;
  activeTasks: number;
  urgentTasks: number;
  overdueTasks: number;
  todayDueTasks: number;
  isOnLeave: boolean;
  capacityPercent: number;
  score: number;
}

export interface PipelinePreview {
  client: {
    id: string;
    name: string;
    companyName: string;
    city: string;
  };
  package: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
  period: {
    month: number;
    year: number;
    formatted: string;
  };
  deliverables: {
    title: string;
    type: string;
    workType: string;
    dueDate: string;
    preferredRole: string;
    slaHours: number;
    requiresApproval: boolean;
    assignedTo: string | null;
    assignedToName: string;
    assignedToRole: string;
    capacityPercent: number;
  }[];
  teamAllocation: {
    employeeId: string;
    name: string;
    role: string;
    capacityPercent: number;
    taskCount: number;
    types: string[];
  }[];
  summary: {
    totalDeliverables: number;
    employeesUsed: number;
    firstDeadline: string;
    finalDeadline: string;
  };
  warnings: string[];
  idempotencyKey: string;
}

export const getServicePackages = async (): Promise<ServicePackage[]> => {
  const res = await fetch(`${API_URL}/ai/automation/packages`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch service packages");
  return data.data || [];
};

export const getTeamWorkload = async (department?: string): Promise<EmployeeCapacity[]> => {
  const url = department ? `${API_URL}/ai/automation/workload?department=${department}` : `${API_URL}/ai/automation/workload`;
  const res = await fetch(url, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch team workload");
  return data.data || [];
};

export const previewClientPipeline = async (params: {
  customerId: string;
  packageId?: string;
  month?: number;
  year?: number;
}): Promise<PipelinePreview> => {
  const res = await fetch(`${API_URL}/ai/automation/pipeline/preview`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to preview pipeline");
  return data.data;
};

export const generateClientPipeline = async (params: {
  customerId: string;
  packageId?: string;
  month?: number;
  year?: number;
  deliverables?: any[];
}): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/pipeline/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to generate pipeline");
  return data;
};

export const regenerateClientPipeline = async (params: {
  customerId: string;
  packageId?: string;
  month?: number;
  year?: number;
}): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/pipeline/regenerate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to regenerate pipeline");
  return data;
};

export const convertAndOnboardLead = async (
  leadId: string,
  params?: { packageId?: string; month?: number; year?: number }
): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/leads/${leadId}/convert-onboard`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to convert and onboard lead");
  return data;
};

// ----------------------------------------------------
// PHASE 5C: CONTENT INTELLIGENCE & CALENDAR INTERFACES
// ----------------------------------------------------
export interface CalendarItem {
  _id?: string;
  itemKey: string;
  plannedDate: string;
  contentType: "SOCIAL_POST" | "REEL" | "CAROUSEL" | "GBP_POST" | "AD_CREATIVE" | "STORY";
  sourceType: "FESTIVAL" | "SEASONAL" | "INDUSTRY" | "SERVICE" | "OFFER" | "EVERGREEN" | "CAMPAIGN";
  occasion: string;
  objective: string;
  headline: string;
  subheadline?: string;
  caption: string;
  hashtags: string[];
  creativeBrief: string;
  visualPrompt: string;
  cta: string;
  platformTargets: string[];
  status: "DRAFT" | "APPROVED" | "REJECTED" | "GENERATED" | "SCHEDULED" | "PUBLISHED";
  reasoningTags?: string[];
  workId?: string;
}

export interface ContentCalendarData {
  _id: string;
  clientId: string;
  period: {
    startDate: string;
    endDate: string;
    month: number;
    year: number;
    formatted: string;
  };
  items: CalendarItem[];
  summary: {
    totalItems: number;
    festivalItems: number;
    seasonalItems: number;
    serviceItems: number;
    posters: number;
    reels: number;
    gbpPosts: number;
    approved: number;
    pending: number;
  };
  status: "DRAFT" | "PARTIALLY_APPROVED" | "APPROVED" | "GENERATING" | "SCHEDULED" | "COMPLETED";
}

export interface ContentPreviewResponse {
  client: {
    id: string;
    name: string;
    industry: string;
    city: string;
  };
  period: {
    startDate: string;
    endDate: string;
    month: number;
    year: number;
    formatted: string;
  };
  summary: any;
  items: CalendarItem[];
  festivalsAvailable: number;
  seasonalOpportunities: number;
}

export const getOpportunities = async (
  days = 30,
  industry = "GENERAL",
  month = new Date().getMonth() + 1
): Promise<any> => {
  const res = await fetch(
    `${API_URL}/ai/automation/content/opportunities?days=${days}&industry=${industry}&month=${month}`,
    { headers: authHeaders() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch opportunities");
  return data.data;
};

export const getClientCalendar = async (clientId: string): Promise<ContentCalendarData[]> => {
  const res = await fetch(`${API_URL}/ai/automation/content/calendar/${clientId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch client calendar");
  return data.data || [];
};

export const previewContentCalendar = async (params: {
  customerId: string;
  month?: number;
  year?: number;
  duration?: number;
}): Promise<ContentPreviewResponse> => {
  const res = await fetch(`${API_URL}/ai/automation/content/calendar/preview`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to preview calendar");
  return data.data;
};

export const generateContentCalendar = async (params: {
  customerId: string;
  month?: number;
  year?: number;
  items?: CalendarItem[];
}): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/content/calendar/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to generate calendar");
  return data;
};

export const batchApproveCalendarItems = async (
  calendarId: string,
  itemKeys?: string[]
): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/content/calendar/${calendarId}/batch-approve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ itemKeys }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to batch approve items");
  return data;
};

export const regenerateContentCalendar = async (
  calendarId: string,
  params: { customerId: string; month?: number; year?: number }
): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/content/calendar/${calendarId}/regenerate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to regenerate calendar");
  return data;
};

// ----------------------------------------------------
// PHASE 5D: SLA GUARDIAN INTERFACES & APIS
// ----------------------------------------------------
export interface SLAIncidentData {
  _id: string;
  incidentKey: string;
  workId: {
    _id: string;
    title: string;
    workType: string;
    priority: string;
    dueDate: string;
    status: string;
  };
  clientId: {
    _id: string;
    name: string;
    companyName: string;
    city: string;
  };
  type: "UPCOMING_DEADLINE" | "AT_RISK" | "SLA_BREACH" | "STALLED_REVIEW" | "WORKLOAD_RISK" | "DEPENDENCY_BLOCKED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  status: "OPEN" | "ACKNOWLEDGED" | "REMEDIATING" | "RESOLVED" | "IGNORED";
  responsibility: "INTERNAL" | "CLIENT" | "MANAGER" | "EXTERNAL";
  deadline: string;
  riskFactors: {
    key: string;
    label: string;
    scoreContribution: number;
    details: string;
  }[];
  primaryRootCause: string;
  rootCauses: string[];
  recommendations: {
    action: string;
    label: string;
    confidence: number;
    payload: any;
  }[];
  assignedTo?: {
    _id: string;
    name: string;
    role: string;
    email: string;
  };
  createdAt: string;
}

export interface SLAScanSummary {
  agencyHealthScore: number;
  scannedCount: number;
  criticalCount: number;
  highCount: number;
  atRiskCount: number;
  overdueCount: number;
  incidentsCreated: number;
  incidentsUpdated: number;
  incidentsResolved: number;
  summary: string;
}

export const getSLASummary = async (): Promise<SLAScanSummary> => {
  const res = await fetch(`${API_URL}/ai/automation/sla/summary`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch SLA summary");
  return data.data;
};

export const getSLAIncidents = async (limit = 20): Promise<SLAIncidentData[]> => {
  const res = await fetch(`${API_URL}/ai/automation/sla/incidents?limit=${limit}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch SLA incidents");
  return data.data || [];
};

export const getCriticalTasks = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/ai/automation/sla/critical`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch critical tasks");
  return data.data || [];
};

export const getWorkRiskDetails = async (workId: string): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/sla/work/${workId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch risk details");
  return data.data;
};

export const triggerSLAScan = async (): Promise<SLAScanSummary> => {
  const res = await fetch(`${API_URL}/ai/automation/sla/scan`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to trigger SLA scan");
  return data.data;
};

export const rebalanceSLAWorkload = async (incidentIds?: string[]): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/sla/rebalance`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ incidentIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to rebalance workload");
  return data;
};

export const acknowledgeSLAIncident = async (id: string): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/sla/incidents/${id}/acknowledge`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to acknowledge incident");
  return data;
};

export const recoverSLAIncident = async (
  id: string,
  action: string,
  payload?: any
): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/sla/incidents/${id}/recover`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to apply recovery action");
  return data;
};

// ----------------------------------------------------
// PHASE 5E: CASH-FLOW & PAYMENT RECOVERY INTERFACES & APIS
// ----------------------------------------------------
export interface PaymentAgingRollup {
  totalOutstanding: number;
  upcoming: number;
  dueToday: number;
  overdue1_3: number;
  overdue4_7: number;
  overdue8_15: number;
  overdue16_30: number;
  overdue30Plus: number;
  count: number;
}

export interface CollectionFollowupData {
  _id: string;
  followupKey: string;
  invoiceId: {
    _id: string;
    invoiceNumber: string;
    originalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    dueDate: string;
    paymentStatus: string;
  };
  clientId: {
    _id: string;
    name: string;
    companyName: string;
    contactNumbers: string[];
  };
  status: "OPEN" | "PROMISE_TO_PAY" | "DISPUTED" | "PAID" | "ESCALATED" | "CLOSED";
  agingBucket: string;
  balanceAtDetection: number;
  priorityScore: number;
  recoveryStage: string;
  lastContactAt?: string;
  nextFollowupAt?: string;
  contactAttempts: {
    timestamp: string;
    channel: string;
    type: string;
    status: string;
    subject: string;
    message: string;
  }[];
  promises: {
    promiseId: string;
    amount: number;
    date: string;
    status: "PENDING" | "FULFILLED" | "BROKEN";
    notes?: string;
  }[];
  dispute?: {
    active: boolean;
    reason: string;
  };
}

export interface FinanceSummaryData {
  status: string;
  scannedCount: number;
  totalOutstanding: number;
  expectedTodayTotal: number;
  overdueTotal: number;
  criticalCount: number;
  brokenPromisesCount: number;
  agingRollup: PaymentAgingRollup;
  summary: string;
}

export const getFinanceSummary = async (): Promise<FinanceSummaryData> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/summary`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch finance summary");
  return data.data;
};

export const getAgingSummary = async (): Promise<PaymentAgingRollup> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/aging`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch aging summary");
  return data.data.aging;
};

export const getExpectedCollections = async (): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/expected`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch expected collections");
  return data.data;
};

export const getOverdueInvoices = async (): Promise<CollectionFollowupData[]> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/overdue`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch overdue invoices");
  return data.data.overdueAccounts || [];
};

export const getCriticalCollections = async (): Promise<CollectionFollowupData[]> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/critical`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch critical collections");
  return data.data.criticalAccounts || [];
};

export const triggerFinanceScan = async (): Promise<FinanceSummaryData> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/scan`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to trigger finance scan");
  return data.data;
};

export const generateReminderDraft = async (
  invoiceId: string,
  channel = "WHATSAPP"
): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/reminder/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ invoiceId, channel }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to generate reminder");
  return data.data;
};

export const recordPromiseToPay = async (params: {
  invoiceId: string;
  promisedAmount: number;
  promisedDate: string;
  notes?: string;
}): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/promise`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to record promise");
  return data;
};

export const markInvoiceDisputed = async (
  invoiceId: string,
  reason: string
): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/dispute`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ invoiceId, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to mark disputed");
  return data;
};

export const resolveInvoiceDispute = async (invoiceId: string): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/dispute/resolve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ invoiceId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to resolve dispute");
  return data;
};

export const getPaymentLink = async (invoiceId: string): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/finance/payment-link/${invoiceId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch payment link");
  return data.data;
};

// ----------------------------------------------------
// PHASE 5F: EXECUTIVE BRIEFING INTERFACES & APIS
// ----------------------------------------------------
export interface ExecutivePriorityItem {
  id: string;
  category: "DELIVERY" | "COLLECTION" | "SALES" | "CONTENT" | "TEAM" | "AUTOMATION";
  title: string;
  description: string;
  clientId?: string;
  clientName?: string;
  referenceType?: string;
  referenceId?: string;
  score: number;
  severity: "INFO" | "WATCH" | "HIGH" | "CRITICAL";
  reason: string;
  recommendedAction: {
    command: string;
    label: string;
    payload: any;
  };
  deadline?: string;
}

export interface BriefingSnapshotData {
  _id: string;
  briefingId: string;
  type: "MORNING" | "EOD" | "ON_DEMAND";
  date: string;
  agencyHealth: {
    score: number;
    level: "EXCELLENT" | "HEALTHY" | "WATCH" | "AT_RISK" | "CRITICAL";
    deductions?: {
      category: string;
      amount: number;
      reason: string;
    }[];
  };
  delivery: {
    dueToday: number;
    overdue: number;
    atRisk: number;
    critical: number;
    completedToday: number;
    awaitingApproval: number;
  };
  finance: {
    expectedToday: number;
    receivedToday: number;
    overdueAmount: number;
    dueThisWeek: number;
    criticalAccounts: number;
    promisesDue: number;
    brokenPromises: number;
  };
  sales: {
    newLeads: number;
    hotLeads: number;
    callbacksDue: number;
    proposalsPending: number;
    conversionsToday: number;
  };
  content: {
    postsDue: number;
    approved: number;
    awaitingApproval: number;
    scheduled: number;
    published: number;
    creativeGenerationPending: number;
  };
  team: {
    activeMembers: number;
    availableMembers: number;
    overloadedMembers: number;
    unassignedWork: number;
    averageCapacity: number;
  };
  automation: {
    runsToday: number;
    executed: number;
    awaitingApproval: number;
    failed: number;
    reliability: number;
  };
  narrative: {
    headline: string;
    summary: string;
    focusPoints: string[];
  };
  priorities: ExecutivePriorityItem[];
  accomplishments?: string[];
  tomorrowRisks?: string[];
  createdAt: string;
}

export const getLiveBriefing = async (): Promise<{
  timestamp: string;
  date: string;
  agencyHealth: any;
  metrics: any;
  priorities: ExecutivePriorityItem[];
  narrative: any;
  tomorrowPlan: any;
}> => {
  const res = await fetch(`${API_URL}/ai/automation/briefing/live`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch live briefing");
  return data.data;
};

export const getMorningBrief = async (date?: string): Promise<BriefingSnapshotData> => {
  const url = date
    ? `${API_URL}/ai/automation/briefing/morning?date=${date}`
    : `${API_URL}/ai/automation/briefing/morning`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch morning brief");
  return data.data;
};

export const getEodWrap = async (date?: string): Promise<BriefingSnapshotData> => {
  const url = date
    ? `${API_URL}/ai/automation/briefing/eod?date=${date}`
    : `${API_URL}/ai/automation/briefing/eod`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch EOD wrap");
  return data.data;
};

export const getExecutivePriorities = async (): Promise<ExecutivePriorityItem[]> => {
  const res = await fetch(`${API_URL}/ai/automation/briefing/priorities`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch priorities");
  return data.data || [];
};

export const getAgencyHealth = async (): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/briefing/health`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch agency health");
  return data.data;
};

export const getBriefingHistory = async (limit = 14): Promise<BriefingSnapshotData[]> => {
  const res = await fetch(`${API_URL}/ai/automation/briefing/history?limit=${limit}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch briefing history");
  return data.data || [];
};

export const triggerMorningBriefGeneration = async (date?: string): Promise<BriefingSnapshotData> => {
  const res = await fetch(`${API_URL}/ai/automation/briefing/generate-morning`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ date }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to generate morning brief");
  return data.data;
};

export const triggerEodWrapGeneration = async (date?: string): Promise<BriefingSnapshotData> => {
  const res = await fetch(`${API_URL}/ai/automation/briefing/generate-eod`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ date }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to generate EOD wrap");
  return data.data;
};

// ----------------------------------------------------
// PHASE 5G: UNIFIED DECISION INBOX INTERFACES & APIS
// ----------------------------------------------------
export interface DecisionItem {
  id: string;
  type: string;
  domain: "CONTENT" | "DELIVERY" | "COLLECTION" | "AUTOMATION" | "SALES";
  title: string;
  summary: string;
  clientName: string;
  clientId?: string;
  referenceId: string;
  riskLevel: "SAFE" | "MODERATE" | "HIGH_IMPACT";
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  impactScore: number;
  payload: any;
  itemsPreview?: {
    title: string;
    pillar: string;
    plannedDate: string;
  }[];
  createdAt: string;
}

export const getDecisionInbox = async (): Promise<{
  count: number;
  safeCount: number;
  data: DecisionItem[];
}> => {
  const res = await fetch(`${API_URL}/ai/automation/decisions`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch decision inbox");
  return data;
};

export const approveDecisionItem = async (
  decisionId: string,
  decisionType: string,
  payload: any = {}
): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/decisions/${decisionId}/approve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ decisionType, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve decision");
  return data;
};

export const rejectDecisionItem = async (
  decisionId: string,
  decisionType: string,
  reason: string,
  payload: any = {}
): Promise<any> => {
  const res = await fetch(`${API_URL}/ai/automation/decisions/${decisionId}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ decisionType, reason, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reject decision");
  return data;
};

export const batchApproveSafeDecisions = async (): Promise<{
  totalSafeCount: number;
  approvedCount: number;
  results: any[];
  message: string;
}> => {
  const res = await fetch(`${API_URL}/ai/automation/decisions/batch-approve-safe`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to execute batch approval");
  return data.data;
};






