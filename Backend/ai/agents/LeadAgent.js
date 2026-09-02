/**
 * LeadAgent.js
 * Specialist AI Agent for Inbound Lead Qualification, Intent Classification & Safe Routing.
 * 
 * Strict Governance Rules:
 * 1. Read/Analysis Only: Never directly dispatches external messages.
 * 2. Never accesses CredentialVault or raw WhatsApp tokens.
 * 3. Never promises discounts, refunds, or financial guarantees.
 * 4. Treats all incoming text as UNTRUSTED_EXTERNAL_CONTENT.
 * 5. Supports English, Telugu, and Hindi code-mixed messages with deterministic intent mapping.
 */

const BaseAgent = require("./BaseAgent");
const { buildAgentContext } = require("../../services/agentContextService");
const whatsAppInputSanitizer = require("../whatsapp/WhatsAppInputSanitizer");

class LeadAgent extends BaseAgent {
  constructor() {
    super("LeadAgent");
  }

  /**
   * Classifies inbound customer message into structured qualification data
   */
  async classifyInboundMessage({
    text = "",
    customerId = null,
    locationId = null,
    existingLead = null,
    conversationState = "NEW",
  }) {
    // 1. Sanitize untrusted input
    const sanitized = whatsAppInputSanitizer.sanitizeForAnalysis(text);
    const cleaned = sanitized.sanitizedText.toLowerCase();

    // 2. Intent & Escalation Pattern Detection (English, Telugu, Hindi)
    let intent = "GENERAL_INQUIRY";
    let serviceInterest = null;
    let urgency = "NORMAL";
    let purchaseTimeline = "EXPLORING";
    let humanEscalationRecommended = false;
    let escalationReason = null;
    let languageDetected = "en";

    // Human Request Patterns
    if (
      /human|agent|person|representative|executive|support|talk\s+to/i.test(cleaned) ||
      /manager\s+tho\s+matladali|call\s+cheyandi|manishi\s+kavali/i.test(cleaned) || // Telugu
      /baat\s+karni\s+hai|kisi\s+se\s+baat|insan\s+se/i.test(cleaned) // Hindi
    ) {
      intent = "TALK_TO_HUMAN";
      humanEscalationRecommended = true;
      escalationReason = "Customer explicitly requested human assistance.";
    }
    // Complaints or Disputes
    else if (
      /complaint|terrible|worst|bad\s+service|refund|dispute|fraud|cheated/i.test(cleaned) ||
      /baledu|waste|dabulu\s+ivvandi/i.test(cleaned) || // Telugu
      /bekar|paise\s+wapas/i.test(cleaned) // Hindi
    ) {
      intent = "COMPLAINT_DISPUTE";
      urgency = "HIGH";
      humanEscalationRecommended = true;
      escalationReason = "High-urgency customer complaint or refund inquiry detected.";
    }
    // Booking / Consultation
    else if (
      /book|appointment|consultation|visit|slot|schedule|timing/i.test(cleaned) ||
      /appointment\s+kavali|epudu\s+ravali|book\s+chey/i.test(cleaned) || // Telugu
      /milna\s+hai|booking\s+chahiye|kab\s+aau/i.test(cleaned) // Hindi
    ) {
      intent = "BOOK_APPOINTMENT";
      urgency = "HIGH";
      purchaseTimeline = "IMMEDIATE";
    }
    // Pricing Inquiry
    else if (
      /price|cost|charges|rate|package|fees|how\s+much|quotation/i.test(cleaned) ||
      /price\s+entha|cost\s+entha|charges\s+enni/i.test(cleaned) || // Telugu
      /kitna\s+hai|kya\s+rate\s+hai|kharcha\s+kitna/i.test(cleaned) // Hindi
    ) {
      intent = "PRICE_INQUIRY";
      purchaseTimeline = "THIS_MONTH";
    }
    // Greeting
    else if (/^(hi|hello|hey|namaste|good\s+morning|good\s+evening|gm|ge)\b/i.test(cleaned)) {
      intent = "GREETING";
    }

    // Language identification
    if (/entha|kavali|matladali|cheyandi|ravali|vaddu|baledu/i.test(cleaned)) {
      languageDetected = "te"; // Telugu or Tel-English
    } else if (/karna|chahiye|baat|kitna|karo|hoga|aau/i.test(cleaned)) {
      languageDetected = "hi"; // Hindi or Hinglish
    }

    // Hostile injection protection
    if (sanitized.isSuspicious) {
      humanEscalationRecommended = true;
      escalationReason = "Suspicious prompt injection pattern neutralized. Escalated for safety.";
      intent = "SUSPICIOUS_INPUT";
    }

    // 3. Lead Qualification Score Calculation (0 to 100)
    let score = 20; // Base presence
    if (intent === "BOOK_APPOINTMENT") score += 40;
    if (intent === "PRICE_INQUIRY") score += 30;
    if (urgency === "HIGH") score += 20;
    if (purchaseTimeline === "IMMEDIATE") score += 15;
    if (existingLead) score += 10;
    score = Math.min(100, Math.max(0, score));

    // High value auto-escalation
    if (score >= 85 && !humanEscalationRecommended) {
      humanEscalationRecommended = true;
      escalationReason = "High-intent prospect score reached.";
    }

    // 4. Next Recommended Action
    let nextRecommendedAction = "SHOW_WELCOME_MENU";
    if (intent === "BOOK_APPOINTMENT") nextRecommendedAction = "SHOW_BOOKING_SLOTS";
    else if (intent === "PRICE_INQUIRY") nextRecommendedAction = "SHOW_SERVICE_PRICING";
    else if (humanEscalationRecommended) nextRecommendedAction = "ESCALATE_HUMAN_HANDOFF";

    return {
      trustLevel: sanitized.trustLevel,
      intent,
      serviceInterest,
      urgency,
      purchaseTimeline,
      qualificationScore: score,
      humanEscalationRecommended,
      escalationReason,
      languageDetected,
      nextRecommendedAction,
      isSuspicious: sanitized.isSuspicious,
      isOptOut: sanitized.isOptOut,
      suggestedReplyDraft: humanEscalationRecommended
        ? "A team member will assist you shortly."
        : "Thank you for reaching out! How can we assist you today?",
    };
  }

  /**
   * Generates agent context and follow-up copy blueprints (Draft Mode Only)
   */
  async execute(plan, ctx = {}) {
    const leadContext = await buildAgentContext({
      customerId: plan.customerId,
      locationId: plan.locationId,
      agentType: "Lead",
    });

    const clientName = leadContext.clientIdentity?.companyName || leadContext.clientIdentity?.name || "Client";

    return {
      agentTarget: "Lead Nurturing Agent (Draft Mode)",
      qualificationRules: leadContext.leadStrategy?.qualificationRules || "Budget > ₹2000, located within service radius",
      followUpDrafts: {
        whatsappMessage: `Hello! Thank you for inquiring about ${clientName}. We would love to book your appointment. Would tomorrow 11:00 AM work for you?`,
        emailSubject: `Your Exclusive Consultation at ${clientName}`,
        emailBody: `Dear Client,\n\nThank you for reaching out to ${clientName}. Our team is ready to deliver an exceptional experience tailored to your needs.`,
      },
      restrictionsNote: "Draft Mode Only: WhatsApp/Email messages are drafted as CRM records only.",
    };
  }
}

module.exports = new LeadAgent();
