export type WorkspaceState =
  | "IDLE"
  | "UNDERSTANDING"
  | "AWAITING_ENTITY"
  | "COLLECTING_INPUT"
  | "AWAITING_APPROVAL"
  | "EXECUTING"
  | "COMPLETED"
  | "ERROR";

export type EntityCandidate = {
  id: string;
  name: string;
  companyName?: string;
  industry?: string;
  city?: string;
  logoUrl?: string;
};

export type EntityPickerBlock = {
  type: "entity_picker";
  pendingCommandId: string;
  entityType: "Customer" | "Location" | "Employee";
  reason: "CUSTOMER_NOT_SPECIFIED" | "MULTIPLE_MATCHES";
  promptText: string;
  candidates: EntityCandidate[];
  allowSearch?: boolean;
  totalCandidatesCount?: number;
};

export type IntakeQuestionBlock = {
  type: "intake_question";
  pendingCommandId: string;
  field: string;
  question: string;
  options?: string[];
  allowSkip?: boolean;
  currentEntityName?: string;
  collectedSummary?: Record<string, any>;
  remainingFieldsCount?: number;
};

export type ExecutionBlueprintBlock = {
  type: "execution_blueprint";
  pendingCommandId: string;
  command: string;
  intent: string;
  customerId?: string;
  customerName?: string;
  riskLevel: string;
  actions: Array<{ step: number; action: string; command?: string }>;
  parameters?: Record<string, any>;
  brandContextSummary?: {
    hasLogo: boolean;
    brandColors?: string[];
    phone?: string;
    industry?: string;
    toneOfVoice?: string;
  } | null;
  estimatedImpact?: string;
  supportsRollback?: boolean;
};

export type GeneratedAssetBlock = {
  type: "generated_asset";
  creativeRunId: string;
  version: number;
  imageUrl?: string;
  headline?: string;
  caption?: string;
  tags?: string[];
  clientName?: string;
  imagePrompt?: string;
  platformVariants?: Record<string, { captionText: string }>;
  status: "APPROVED_FOR_REVIEW" | "FINAL_APPROVED" | "REVISION_REQUESTED";
};

export type MorningBriefingBlock = {
  type: "morning_briefing";
  briefingData: any;
};

export type DecisionInboxBlock = {
  type: "decision_inbox";
  decisions: any[];
  count: number;
  safeCount: number;
};

export type SLABlock = {
  type: "sla_alerts";
  slaData: any;
};

export type ExecutionResultBlock = {
  type: "execution_result";
  executionId: string;
  command: string;
  result: any;
  verification?: any;
  supportsRollback?: boolean;
};

export type CreativeBriefBlock = {
  type: "creative_brief";
  pendingCommandId?: string;
  client: {
    name: string;
    industry: string;
    brandStyle: string;
    primaryColors: string;
    colorPalette?: { primary: string; secondary: string; accent: string; text: string };
    logoStatus: string;
    website: string;
  };
  campaign: {
    type: string;
    event: string;
    launchDate: string;
    platform: string;
    posterSize: string;
    aspectRatio: string;
  };
  communication: {
    headline: string;
    supportingLine: string;
    dateHighlight: string;
    cta: string;
  };
  creativeConcept: {
    name: string;
    description: string;
  };
  visualComposition: {
    logoBranding: string;
    heroVisual: string;
    headlineDate: string;
    ctaWebsite: string;
  };
  finalPrompt: string;
  verifiedChecklist: Array<{ label: string; verified: boolean }>;
};

export type PosterPreviewQABlock = {
  type: "poster_preview_qa";
  creativeRunId: string;
  client: {
    name: string;
    industry?: string;
    primaryColors?: string;
    colorPalette?: { primary: string; secondary: string; accent: string; text: string };
    website?: string;
  };
  campaign: {
    event: string;
    launchDate: string;
    headline: string;
    supportingLine: string;
    website: string;
    aspectRatio?: string;
  };
  socialCopy?: {
    caption: string;
    instagramCaption?: string;
    facebookCaption?: string;
    hashtags: string[];
  };
  qaPassed: boolean;
  status: "WAITING_MANAGER_REVIEW" | "FINAL_APPROVED" | "REVISION_REQUESTED";
};

export type DeliveryScheduleBlock = {
  type: "delivery_schedule";
  creativeRunId: string;
  destination: string;
  approvedVersionStatus: string;
  immediateOption: string;
  scheduledOption: string;
  options: string[];
};

export type ErrorCardBlock = {
  type: "error_card";
  errorMessage: string;
  technicalDetails?: string;
  pendingCommandId?: string;
  canRetry?: boolean;
};

export type WorkspaceUIBlock =
  | EntityPickerBlock
  | IntakeQuestionBlock
  | ExecutionBlueprintBlock
  | GeneratedAssetBlock
  | MorningBriefingBlock
  | DecisionInboxBlock
  | SLABlock
  | ExecutionResultBlock
  | ErrorCardBlock
  | CreativeBriefBlock
  | PosterPreviewQABlock
  | DeliveryScheduleBlock;

export type WorkspaceMessage = {
  turnId: string;
  role: "user" | "assistant" | "system";
  text?: string;
  state?: WorkspaceState;
  uiBlocks?: WorkspaceUIBlock[];
  metadata?: Record<string, any>;
  timestamp?: string | Date;
};

export type WorkspaceResponse = {
  conversationId: string;
  turnId: string;
  state: WorkspaceState;
  message: {
    role: "assistant";
    text: string;
  };
  uiBlocks: WorkspaceUIBlock[];
  context?: {
    intent?: string;
    command?: string;
    customerId?: string;
    customerName?: string;
    pendingCommandId?: string;
    executionId?: string;
    state?: WorkspaceState;
  };
};
