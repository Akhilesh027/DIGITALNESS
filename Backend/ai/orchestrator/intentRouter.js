/**
 * intentRouter.js
 * Upgraded Universal Intent Router & Parameter Extraction Engine for Digitalness CRM V2.
 * Classifies manager natural language requests into structured intents, extracts parameters,
 * resolves CRM entities, and enforces safety policies.
 */

const { resolveEntities } = require("../context/entityResolver");
const { evaluateCommandPolicy, RISK_LEVELS } = require("../policies/commandPolicy");
const { validateCommandParams } = require("../commands/commandSchemas");
const commandRegistry = require("../commands/commandRegistry");

// Currency & number extraction helper
function extractAmount(text = "") {
  // Matches ₹25,000, Rs 25000, 25,000 INR, 25k, etc.
  const kMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    return Number(kMatch[1]) * 1000;
  }

  const numMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\s*(?:rs|inr|rupees))?/i);
  if (numMatch) {
    const cleanNum = numMatch[1].replace(/,/g, "");
    const parsed = Number(cleanNum);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return null;
}

// Date / Relative time extraction helper
function extractTargetDate(text = "") {
  const p = text.toLowerCase();
  const now = new Date();

  if (p.includes("tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  }
  if (p.includes("today")) {
    const d = new Date(now);
    d.setHours(18, 0, 0, 0);
    return d;
  }
  if (p.includes("next week")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    d.setHours(10, 0, 0, 0);
    return d;
  }

  return null;
}

/**
 * Classifies prompt into structured intent and maps to CRM command
 */
exports.classifyUniversalIntent = (prompt = "") => {
  const p = prompt.toLowerCase().trim();

  // 1. Destructive / Restricted commands
  if (
    p.startsWith("delete customer") ||
    p.startsWith("delete client") ||
    p.includes("delete toni") ||
    (p.includes("delete") && (p.includes("customer") || p.includes("client")))
  ) {
    return {
      intent: "CUSTOMER_DELETE",
      command: "customer.delete",
      confidence: 0.99,
      category: "CUSTOMER",
    };
  }

  // 1.5. Executive Briefing & Decision Inbox (Phase 5F & 5G)
  if (
    p.includes("briefing") ||
    p.includes("brief") ||
    p.includes("morning") ||
    p.includes("eod") ||
    p.includes("wrap") ||
    p.includes("agency health") ||
    p.includes("health score") ||
    p.includes("decision") ||
    p.includes("inbox") ||
    p.includes("waiting") ||
    p.includes("waiting on me") ||
    p.includes("waiting for me") ||
    p.includes("pending approval") ||
    p.includes("approve safe") ||
    p.includes("approve all safe")
  ) {
    if (p.includes("eod") || p.includes("end of day") || p.includes("wrap")) {
      return { intent: "BRIEFING_GET_EOD", command: "briefing.getEodWrap", confidence: 0.98, category: "GENERAL" };
    }
    if (p.includes("agency health") || p.includes("health score")) {
      return { intent: "BRIEFING_GET_HEALTH", command: "briefing.getAgencyHealth", confidence: 0.98, category: "GENERAL" };
    }
    if (p.includes("tomorrow")) {
      return { intent: "BRIEFING_GET_TOMORROW", command: "briefing.getTomorrowPlan", confidence: 0.98, category: "GENERAL" };
    }
    if (p.includes("priorities") || p.includes("what needs attention") || p.includes("priority")) {
      return { intent: "BRIEFING_GET_PRIORITIES", command: "briefing.getPriorities", confidence: 0.98, category: "GENERAL" };
    }
    if (
      p.includes("decision") ||
      p.includes("inbox") ||
      p.includes("waiting") ||
      p.includes("pending approval") ||
      p.includes("waiting on me") ||
      p.includes("waiting for me")
    ) {
      return { intent: "DECISION_GET_INBOX", command: "decision.getInbox", confidence: 0.98, category: "GENERAL" };
    }
    if (p.includes("approve safe") || p.includes("approve all safe")) {
      return { intent: "DECISION_BATCH_SAFE", command: "decision.batchApproveSafe", confidence: 0.98, category: "GENERAL" };
    }
    // Default briefing
    return { intent: "BRIEFING_GET_MORNING", command: "briefing.getMorningBrief", confidence: 0.98, category: "GENERAL" };
  }

  // 1.6. SLA Guardian & Deadline Risk (Phase 5D)
  if (p.includes("sla") || p.includes("at risk") || p.includes("critical deliverable") || p.includes("deadline risk")) {
    return { intent: "SLA_GET_CRITICAL", command: "sla.getCritical", confidence: 0.96, category: "TASK" };
  }

  // 1.8. CRM Sales Lead Commands (Dedicated high priority for CRM lead creation)
  const isLeadCreation =
    /\b(create|add|new|record)\s+(?:a\s+)?(?:sales\s+|new\s+)?lead\b/i.test(prompt) ||
    /\blead\s+(?:named|for|with)\b/i.test(prompt) ||
    p.startsWith("add lead") ||
    p.startsWith("new lead");

  if (isLeadCreation && !/\b(lead\s+campaign|ad\s+campaign|ads?\s+campaign)\b/i.test(prompt)) {
    return { intent: "LEAD_CREATE", command: "lead.create", confidence: 0.99, category: "LEAD" };
  }

  // 1.9. ADS AGENT INTENTS (Phase 5 - Advertising OS)
  const isAdsCampaign =
    /\b(meta\s+ads?|facebook\s+ads?|instagram\s+ads?|google\s+ads?|ad\s+campaign|lead\s+campaign|ads\s+campaign|run\s+ads?|launch\s+ads?|create\s+ads?|make\s+ads?|audience\s+targeting|targeting\s+tiers)\b/i.test(prompt) ||
    (/\b(ad|ads|campaign)\b/i.test(prompt) && /\b(budget|cpl|flight|audience|targeting|meta|google|instant\s+form)\b/i.test(prompt)) ||
    (/\b(recommend|calculate)\b/i.test(prompt) && /\b(audience|targeting|ad\s+budget)\b/i.test(prompt));

  if (isAdsCampaign) {
    if (p.includes("audience") || p.includes("targeting") || p.includes("tier")) {
      return { intent: "ADS_AUDIENCE_RECOMMEND", command: "ads.audience.recommend", confidence: 0.98, category: "ADS" };
    }
    if (p.includes("budget") && (p.includes("recommend") || p.includes("calculate") || p.includes("how much") || p.includes("cpl") || p.includes("forecast"))) {
      return { intent: "ADS_BUDGET_RECOMMEND", command: "ads.budget.recommend", confidence: 0.98, category: "ADS" };
    }
    if (p.includes("strategy") && !p.includes("create ad") && !p.includes("run ad") && !p.includes("lead campaign")) {
      return { intent: "ADS_STRATEGY_CREATE", command: "ads.strategy.create", confidence: 0.98, category: "ADS" };
    }
    return { intent: "ADS_CAMPAIGN_CREATE", command: "ads.campaign.create", confidence: 0.98, category: "ADS" };
  }

  // 2. Payment Commands
  if (p.includes("payment") || p.includes("revenue") || p.includes("due") || p.includes("overdue") || p.includes("₹") || p.includes("rs.") || p.includes("rupees")) {
    if (p.includes("overdue")) {
      return { intent: "PAYMENT_GET_OVERDUE", command: "payment.getOverdue", confidence: 0.95, category: "PAYMENT" };
    }
    if (p.includes("due") || p.includes("pending payment")) {
      return { intent: "PAYMENT_GET_DUE", command: "payment.getDue", confidence: 0.95, category: "PAYMENT" };
    }
    if (p.includes("record") || p.includes("received") || p.includes("collected") || p.includes("paid")) {
      return { intent: "PAYMENT_RECORD", command: "payment.record", confidence: 0.98, category: "PAYMENT" };
    }
    if (p.includes("revenue") || p.includes("how much revenue") || p.includes("total revenue") || p.includes("collections")) {
      return { intent: "REPORT_REVENUE", command: "report.revenue", confidence: 0.97, category: "REPORT" };
    }
  }

  // 3. Lead & Pipeline Commands (Search, Convert, Followup)
  if (p.includes("lead") || p.includes("pipeline") || p.includes("deal") || p.includes("convert") || p.includes("salespipeline")) {
    if (p.includes("convert") || p.includes("pipeline") || p.includes("deal") || p.includes("qualify") || p.includes("salespipeline")) {
      return { intent: "LEAD_CONVERT", command: "lead.convert", confidence: 0.98, category: "LEAD" };
    }
    if (p.includes("hot") || p.includes("warm") || p.includes("cold") || p.includes("search lead") || p.includes("find lead") || p.includes("list lead") || p.includes("show lead") || p.includes("show all")) {
      return { intent: "LEAD_SEARCH", command: "lead.search", confidence: 0.94, category: "LEAD" };
    }
    if (p.includes("assign")) {
      return { intent: "LEAD_ASSIGN", command: "lead.assign", confidence: 0.96, category: "LEAD" };
    }
    if (p.includes("create") || p.includes("new lead") || p.includes("add lead") || p.includes("record lead")) {
      return { intent: "LEAD_CREATE", command: "lead.create", confidence: 0.96, category: "LEAD" };
    }
    if (p.includes("followup") || p.includes("follow up") || p.includes("call log")) {
      return { intent: "LEAD_FOLLOWUP", command: "lead.followup", confidence: 0.95, category: "LEAD" };
    }
  }

  // 3.2. Proposal & Commercial Quotes
  if (p.includes("proposal") || p.includes("quotation") || p.includes("quote") || p.includes("pitch")) {
    if (p.includes("send") || p.includes("create") || p.includes("generate") || p.includes("draft") || p.includes("for")) {
      return { intent: "PROPOSAL_CREATE", command: "proposal.create", confidence: 0.98, category: "PROPOSAL" };
    }
    return { intent: "PROPOSAL_GET", command: "proposal.get", confidence: 0.96, category: "PROPOSAL" };
  }

  // 3.3. Client Intake & Onboarding Interview
  if (
    p.includes("intake") ||
    p.includes("interview") ||
    p.includes("onboard new") ||
    p.includes("onboard client") ||
    p.includes("onboard customer") ||
    p.includes("start intake") ||
    p.includes("client intake") ||
    p.includes("customer intake") ||
    (p.includes("onboard") && (p.includes("new") || p.includes("start") || p.includes("interview") || p.includes("questions") || p.includes("form") || p.includes("add")))
  ) {
    return {
      intent: "CLIENT_INTAKE",
      command: "client.intake",
      confidence: 0.99,
      category: "CLIENT",
    };
  }

  // 3.4. Client 360 & Onboarding Details (Top Priority for Details, 360, Profile, Overview, Context, Updates)
  if (
    p.includes("context") ||
    p.includes("latest update") ||
    p.includes("updates for") ||
    p.includes("summary for") ||
    p.includes("client info") ||
    p.includes("customer info") ||
    p.includes("account details") ||
    p.includes("client summary") ||
    p.includes("detail") ||
    p.includes("360") ||
    p.includes("profile") ||
    p.includes("readiness") ||
    p.includes("overview")
  ) {
    return {
      intent: "CLIENT_GET_360",
      command: "client.get360",
      confidence: 0.98,
      category: "CLIENT",
    };
  }

  // 3.5. Social Media Agent Commands (Caption, Hashtag, Reel, Content Plan, Strategy)
  if (
    p.includes("caption") ||
    p.includes("hashtag") ||
    p.includes("reel script") ||
    p.includes("reel idea") ||
    p.includes("video script") ||
    p.includes("content plan") ||
    p.includes("content calendar") ||
    p.includes("social strategy") ||
    p.includes("social media plan") ||
    p.includes("social media strategy") ||
    p.includes("posting strategy") ||
    p.includes("posting schedule")
  ) {
    if (p.includes("caption") || p.includes("write caption") || p.includes("generate caption") || p.includes("post caption")) {
      return { intent: "SOCIAL_GENERATE_CAPTION", command: "social.generateCaption", confidence: 0.98, category: "SOCIAL" };
    }
    if (p.includes("hashtag")) {
      return { intent: "SOCIAL_GENERATE_HASHTAGS", command: "social.generateHashtags", confidence: 0.98, category: "SOCIAL" };
    }
    if (p.includes("reel") || p.includes("video script")) {
      return { intent: "SOCIAL_GENERATE_REEL", command: "social.generateReelScript", confidence: 0.98, category: "SOCIAL" };
    }
    if (p.includes("content plan") || p.includes("content calendar") || p.includes("this week content") || p.includes("this month content")) {
      return { intent: "SOCIAL_GET_CONTENT_PLAN", command: "social.getContentPlan", confidence: 0.98, category: "SOCIAL" };
    }
    if (p.includes("strategy") || p.includes("social media plan") || p.includes("posting")) {
      return { intent: "SOCIAL_GENERATE_STRATEGY", command: "social.generateStrategy", confidence: 0.98, category: "SOCIAL" };
    }
    return { intent: "SOCIAL_GENERATE_CAPTION", command: "social.generateCaption", confidence: 0.95, category: "SOCIAL" };
  }

  // 3.6. Creative & Visual Asset Commands (Posters, Banners, Flyers, Graphic Design)
  if (
    p.includes("poster") ||
    p.includes("banner") ||
    p.includes("creative") ||
    p.includes("flyer") ||
    p.includes("graphic")
  ) {
    return {
      intent: "CREATIVE_GENERATE",
      command: "creative.generate",
      confidence: 0.98,
      category: "CREATIVE",
    };
  }

  // 4. Task / Work Commands (Checked before customer search)
  if (p.includes("task") || p.includes("work") || p.includes("deliverable") || p.includes("document") || p.includes("attachment")) {
    if (p.includes("attach") || p.includes("add document") || p.includes("add file") || p.includes("upload deliverable") || p.includes("attachment")) {
      return { intent: "TASK_ADD_ATTACHMENT", command: "task.addAttachment", confidence: 0.98, category: "TASK" };
    }
    const isCompleteAction =
      p.startsWith("complete ") ||
      p.includes("mark complete") ||
      p.includes("mark as complete") ||
      p.includes("mark completed") ||
      p.includes("mark as done") ||
      p.includes("finish task") ||
      p.includes("close task");

    if (isCompleteAction) {
      return { intent: "TASK_COMPLETE", command: "task.complete", confidence: 0.98, category: "TASK" };
    }

    // Check if assigning/moving task to a client/customer
    if (
      (p.includes("assign") || p.includes("move") || p.includes("link") || p.includes("transfer")) &&
      (p.includes("glownest") || p.includes("client") || p.includes("customer") || p.includes("to "))
    ) {
      return { intent: "TASK_ASSIGN_CUSTOMER", command: "task.assignCustomer", confidence: 0.98, category: "TASK" };
    }

    const isMutationAction =
      p.includes("update") ||
      p.includes("change") ||
      p.includes("set") ||
      p.includes("edit");

    if (isMutationAction && (p.includes("status") || p.includes("in progress") || p.includes("review") || p.includes("revision") || p.includes("to "))) {
      return { intent: "TASK_UPDATE_STATUS", command: "task.updateStatus", confidence: 0.98, category: "TASK" };
    }
    if (isMutationAction && (p.includes("priority") || p.includes("deadline") || p.includes("due date"))) {
      return { intent: "TASK_UPDATE", command: "task.update", confidence: 0.96, category: "TASK" };
    }
    if (
      p.includes("create") ||
      p.includes("new task") ||
      p.includes("add task") ||
      p.includes("schedule task") ||
      p.includes("record task") ||
      p.includes("make a task") ||
      p.startsWith("task for ")
    ) {
      return { intent: "TASK_CREATE", command: "task.create", confidence: 0.96, category: "TASK" };
    }
    // All task queries (e.g. "what are todays tasks", "what are todays in progress tasks", "show my tasks", "pending tasks", "tasks today")
    return { intent: "TASK_GET_PENDING", command: "task.getPending", confidence: 0.97, category: "TASK" };
  }

  // 4.5. Employee / Workforce Commands
  if (
    p.includes("employee") ||
    p.includes("team member") ||
    p.includes("staff") ||
    p.includes("worker") ||
    (p.includes("working on") && !p.includes("task"))
  ) {
    if (
      p.includes("create") ||
      p.includes("add") ||
      p.includes("new employee") ||
      p.includes("new team member") ||
      p.includes("hire") ||
      p.includes("onboard")
    ) {
      return { intent: "EMPLOYEE_CREATE", command: "employee.create", confidence: 0.98, category: "EMPLOYEE" };
    }
    if (p.includes("update") || p.includes("change") || p.includes("salary") || p.includes("transfer") || p.includes("promote")) {
      return { intent: "EMPLOYEE_UPDATE", command: "employee.update", confidence: 0.96, category: "EMPLOYEE" };
    }
    if (p.includes("deactivate") || p.includes("delete") || p.includes("remove") || p.includes("fire")) {
      return { intent: "EMPLOYEE_DEACTIVATE", command: "employee.deactivate", confidence: 0.98, category: "EMPLOYEE" };
    }
    if (p.includes("list") || p.includes("show all") || p.includes("all employees") || p.includes("team")) {
      return { intent: "EMPLOYEE_LIST", command: "employee.list", confidence: 0.96, category: "EMPLOYEE" };
    }
    // Default to Employee 360 / Work query
    return { intent: "EMPLOYEE_GET_360", command: "employee.get360", confidence: 0.96, category: "EMPLOYEE" };
  }

  // 5. Customer / Client Commands
  if (p.includes("customer") || p.includes("client")) {
    if (
      p.includes("create customer") ||
      p.includes("add customer") ||
      p.includes("new customer") ||
      p.includes("onboard customer") ||
      p.includes("create client") ||
      p.includes("add client") ||
      p.includes("new client") ||
      p.includes("onboard client")
    ) {
      return { intent: "CUSTOMER_CREATE", command: "customer.create", confidence: 0.96, category: "CUSTOMER" };
    }
    // Any query asking for customer / client / list / all / show
    return { intent: "CUSTOMER_SEARCH", command: "customer.search", confidence: 0.96, category: "CUSTOMER" };
  }

  // 6. Content & Approval Commands
  if (p.includes("content") || p.includes("approve") || p.includes("reject")) {
    if (p.includes("pending") || p.includes("awaiting approval")) {
      return { intent: "CONTENT_GET_PENDING", command: "content.getPending", confidence: 0.94, category: "CONTENT" };
    }
    if (p.includes("approve")) {
      return { intent: "CONTENT_APPROVE", command: "content.approve", confidence: 0.95, category: "CONTENT" };
    }
    if (p.includes("reject")) {
      return { intent: "CONTENT_REJECT", command: "content.reject", confidence: 0.95, category: "CONTENT" };
    }
  }

  // 7. Legacy Phase 3 Marketing Fallbacks
  if (p.includes("social post") || p.includes("instagram post") || p.includes("facebook post")) return { intent: "CREATE_SOCIAL_POST", command: "creative.generate", confidence: 0.90, category: "CREATIVE" };
  if (p.includes("carousel")) return { intent: "CREATE_CAROUSEL", command: "creative.generate", confidence: 0.90, category: "CREATIVE" };
  if (p.includes("reel") || p.includes("video script") || p.includes("reel brief")) return { intent: "CREATE_REEL_BRIEF", command: "creative.generate", confidence: 0.90, category: "CREATIVE" };
  if (p.includes("caption")) return { intent: "CREATE_CAPTION", command: "creative.generate", confidence: 0.90, category: "CREATIVE" };
  if (p.includes("content plan") || p.includes("content calendar")) return { intent: "CREATE_CONTENT_PLAN", command: "creative.generate", confidence: 0.90, category: "CREATIVE" };
  if (p.includes("gbp post") || p.includes("google business post") || p.includes("gmb post")) return { intent: "CREATE_GBP_POST", command: "creative.generate", confidence: 0.90, category: "CREATIVE" };
  if (p.includes("gbp reply") || p.includes("review reply") || p.includes("review response")) return { intent: "CREATE_GBP_REPLY", command: "creative.generate", confidence: 0.90, category: "CREATIVE" };
  if (p.includes("seo") || p.includes("keyword") || p.includes("ranking")) return { intent: "CREATE_SEO_PLAN", command: "creative.generate", confidence: 0.90, category: "CREATIVE" };

  // Default fallback to task search or unknown
  return {
    intent: "UNKNOWN",
    command: "task.search",
    confidence: 0.50,
    category: "GENERAL",
  };
};

/**
 * Universal Command Parser: End-to-end intent, parameter, entity, and policy resolver.
 */
exports.parseCommandRequest = async ({ prompt = "", userRole = "Manager", explicitHints = {} }) => {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Command prompt string is required.");
  }

  // 1. Universal Intent Classification
  const intentMeta = exports.classifyUniversalIntent(prompt);
  const commandName = intentMeta.command;

  // 2. Entity Resolution
  const entityRes = await resolveEntities(prompt, explicitHints);

  // Check for genuine ambiguity
  if (entityRes.isAmbiguous) {
    return {
      status: "AMBIGUOUS_ENTITY",
      intent: intentMeta.intent,
      command: commandName,
      confidence: intentMeta.confidence,
      ambiguity: entityRes.ambiguityDetails,
      message: entityRes.ambiguityDetails?.message || "Multiple entities matched your request. Please specify.",
      resolvedEntities: {},
      parameters: {},
      missingParameters: [],
      riskLevel: RISK_LEVELS.LOW_RISK_WRITE,
      approvalRequired: false,
      isExecutable: false,
    };
  }

  // 3. Parameter Extraction based on command
  const rawParams = { ...explicitHints };

  // Money amount extraction
  const extractedAmount = extractAmount(prompt);
  if (extractedAmount) {
    rawParams.amount = extractedAmount;
    rawParams.currency = "INR";
  }

  // Date extraction
  const extractedDate = extractTargetDate(prompt);
  if (extractedDate) {
    rawParams.dueDate = extractedDate;
    rawParams.scheduledFor = extractedDate;
    rawParams.paymentDate = extractedDate;
  }

  if (/to+m+o+r+o+w/i.test(prompt)) {
    rawParams.isTomorrow = true;
    rawParams.timeframe = "TOMORROW";
  } else if (prompt.toLowerCase().includes("today")) {
    rawParams.isToday = true;
    rawParams.timeframe = "TODAY";
  }

  const lowPrompt = prompt.toLowerCase();
  if (lowPrompt.includes("in progress")) {
    rawParams.status = "In Progress";
  } else if (lowPrompt.includes("completed") || lowPrompt.includes("done")) {
    rawParams.status = "Completed";
  } else if (lowPrompt.includes("review")) {
    rawParams.status = "Review";
  } else if (lowPrompt.includes("revision")) {
    rawParams.status = "Revision";
  } else if (lowPrompt.includes("pending")) {
    rawParams.status = "Pending";
  }

  // Entity link injection
  if (entityRes.customer) {
    rawParams.customerId = String(entityRes.customer._id);
    rawParams.customer = String(entityRes.customer._id);
  }
  if (entityRes.employee) {
    rawParams.assignedTo = String(entityRes.employee._id);
    rawParams.employeeId = String(entityRes.employee._id);
  }
  if (entityRes.task) {
    rawParams.taskId = String(entityRes.task._id);
  }
  if (entityRes.lead) {
    rawParams.leadId = String(entityRes.lead._id);
  }
  if (entityRes.location) {
    rawParams.locationId = String(entityRes.location._id);
    rawParams.clientLocationId = String(entityRes.location._id);
  }

  // Extract lead creation name if applicable (e.g. "Create a new lead for ABC Furniture")
  if (commandName === "lead.create") {
    const forMatch = prompt.match(/(?:for|named|name)\s+([A-Za-z0-9\s&]+?)(?:\s+and|\s+with|\s*$)/i);
    if (forMatch && forMatch[1]) {
      rawParams.name = forMatch[1].trim();
    } else if (!rawParams.name) {
      rawParams.name = prompt.replace(/create\s+(?:a\s+)?(?:new\s+)?lead\s*(?:for)?/i, "").trim() || "New Lead";
    }
    if (!rawParams.contactNumber) {
      // Check phone in prompt
      const phoneMatch = prompt.match(/\b\d{10}\b/);
      rawParams.contactNumber = phoneMatch ? phoneMatch[0] : "9876543210";
    }
    if (prompt.toLowerCase().includes("hot")) rawParams.leadScore = "Hot";
    else if (prompt.toLowerCase().includes("cold")) rawParams.leadScore = "Cold";
  }

  // Extract task creation title if applicable
  if (commandName === "task.create") {
    let clean = prompt
      .replace(/^(?:lets|let's|let\s+us|can\s+you\s+please|can\s+you|please|could\s+you|i\s+want\s+to|i\s+need\s+to|we\s+need\s+to|kindly)\s+/i, "")
      .replace(/^(?:create|add|schedule|assign|start|draft|generate|make|set\s+up)\s+(?:a\s+)?(?:new\s+)?(?:task|deliverable|work|item)\s*(?:for\s+[A-Za-z0-9\s&]+\s+(?:to|for)|on\s+this\s+customer|for\s+this\s+customer|on\s+this\s+client|for\s+this\s+client|for|to|on|about|named|called|title)?\s*/i, "")
      .trim();

    const stopWords = ["lets", "let's", "task", "new task", "a task", "deliverable", "work", "item", "please", "this customer", "this client", "customer", "client", "for", "to", "on"];
    if (clean && !stopWords.includes(clean.toLowerCase()) && clean.length >= 3) {
      rawParams.title = clean;
    } else {
      rawParams.title = entityRes.customer?.name ? `Deliverable for ${entityRes.customer.name}` : "New Deliverable";
    }
  }

  // Extract task mutation params (edit, status update, complete, attach)
  if (
    commandName === "task.update" ||
    commandName === "task.updateStatus" ||
    commandName === "task.complete" ||
    commandName === "task.addAttachment"
  ) {
    let cleanTask = prompt
      .replace(/edit|update|change|complete|mark|finish|attach|add|upload|priority|status|deadline|due\s+date|document|file|to|for|task|deliverable/gi, " ")
      .trim();
    if (cleanTask) {
      rawParams.title = cleanTask;
      rawParams.taskTitle = cleanTask;
      rawParams.query = cleanTask;
    }
    if (prompt.toLowerCase().includes("urgent")) rawParams.priority = "Urgent";
    else if (prompt.toLowerCase().includes("high") || prompt.toLowerCase().includes("p1")) rawParams.priority = "High";
    else if (prompt.toLowerCase().includes("medium") || prompt.toLowerCase().includes("p2")) rawParams.priority = "Medium";
    else if (prompt.toLowerCase().includes("low") || prompt.toLowerCase().includes("p3")) rawParams.priority = "Low";

    if (prompt.toLowerCase().includes("review")) rawParams.status = "Review";
    else if (prompt.toLowerCase().includes("revision")) rawParams.status = "Revision";
    else if (prompt.toLowerCase().includes("completed") || prompt.toLowerCase().includes("done")) rawParams.status = "Completed";
    else if (prompt.toLowerCase().includes("in progress")) rawParams.status = "In Progress";
  }

  // Filter terms for search
  if (commandName === "lead.search" && prompt.toLowerCase().includes("hot")) {
    rawParams.leadScore = "Hot";
  }

  // Extract topic/service for social media commands
  if (commandName.startsWith("social.")) {
    rawParams.prompt = prompt;
    let topicClean = prompt
      .replace(/\b(generate|create|write|make|give\s+me|for|about|on|a|an|the|caption|hashtag|hashtags|reel\s+script|reel\s+idea|video\s+script|content\s+plan|content\s+calendar|social\s+media\s+plan|social\s+strategy|posting\s+strategy|beauty\s+salon|salon|post|customer|client|please|can\s+you|i\s+need|me|\d+-second|\d+s|second|instagram|meta|youtube|shorts?|reels?)\b/gi, " ")
      .trim();
    // Remove customer name and words from topic
    if (entityRes.customer?.name) {
      topicClean = topicClean.replace(new RegExp(`\\b${entityRes.customer.name}\\b`, "gi"), "").trim();
      const words = entityRes.customer.name.split(/\s+/);
      for (const w of words) {
        if (w.length >= 3) {
          topicClean = topicClean.replace(new RegExp(`\\b${w}\\b`, "gi"), "").trim();
        }
      }
    }
    topicClean = topicClean.replace(/\s+/g, " ").trim();
    if (topicClean && topicClean.length > 2) {
      rawParams.topic = topicClean;
      rawParams.service = topicClean;
    }
    rawParams.query = prompt;
  }

  // Extract parameters for Ads commands
  if (commandName.startsWith("ads.")) {
    rawParams.prompt = prompt;
    const lowerP = prompt.toLowerCase();

    // 1. Platform
    if (lowerP.includes("google")) {
      rawParams.platform = lowerP.includes("meta") || lowerP.includes("facebook") || lowerP.includes("instagram") ? "Omnichannel" : "Google";
    } else {
      rawParams.platform = "Meta";
    }

    // 2. Objective
    if (lowerP.includes("lead") || lowerP.includes("enquir") || lowerP.includes("inquir")) {
      rawParams.objective = "LEAD_GENERATION";
    } else if (lowerP.includes("whatsapp") || lowerP.includes("chat") || lowerP.includes("message")) {
      rawParams.objective = "WHATSAPP_MESSAGES";
    } else if (lowerP.includes("call") || lowerP.includes("phone")) {
      rawParams.objective = "CALLS";
    } else if (lowerP.includes("traffic") || lowerP.includes("website") || lowerP.includes("click")) {
      rawParams.objective = "WEBSITE_TRAFFIC";
    } else if (lowerP.includes("awareness") || lowerP.includes("reach") || lowerP.includes("brand")) {
      rawParams.objective = "AWARENESS";
    }

    // 3. Conversion Type
    if (lowerP.includes("whatsapp")) {
      rawParams.conversionType = "WHATSAPP";
    } else if (lowerP.includes("lead form") || lowerP.includes("instant form") || lowerP.includes("form")) {
      rawParams.conversionType = "INSTANT_FORM";
    } else if (lowerP.includes("call")) {
      rawParams.conversionType = "PHONE_CALL";
    } else if (lowerP.includes("landing page") || lowerP.includes("website")) {
      rawParams.conversionType = "LANDING_PAGE";
    }

    // 4. Daily Budget & Duration
    if (extractedAmount) {
      rawParams.dailyBudget = extractedAmount;
      rawParams.budget = extractedAmount;
    }

    const durationMatch = prompt.match(/\b(\d+)\s*(?:days?|day)\b/i);
    if (durationMatch) {
      rawParams.durationDays = Number(durationMatch[1]);
      rawParams.duration = Number(durationMatch[1]);
    }

    // 5. Creative formats
    const formats = [];
    if (lowerP.includes("reel") || lowerP.includes("video")) formats.push("Reel / Story");
    if (lowerP.includes("poster") || lowerP.includes("banner") || lowerP.includes("image") || lowerP.includes("static")) formats.push("Poster / Banner");
    if (lowerP.includes("carousel")) formats.push("Carousel Format");
    if (formats.length > 0) {
      rawParams.creativeFormats = formats;
    }

    // 6. Promoted services
    const promoteMatch = prompt.match(/(?:promoting|for|highlighting)\s+([A-Za-z0-9\s,&]+?)(?:\.\s*|\s+target|\s+use|\s+with|\s+and|\s*$)/i);
    if (promoteMatch && promoteMatch[1] && promoteMatch[1].length > 3) {
      const extractedSvc = promoteMatch[1].split(/,|\band\b/).map((s) => s.trim()).filter(Boolean);
      if (extractedSvc.length > 0) rawParams.promotedServices = extractedSvc;
    }
  }

  // 4. Validate Parameters against Schema
  const validation = validateCommandParams(commandName, rawParams);

  // 5. Evaluate Policy & Risk
  const policy = evaluateCommandPolicy(commandName, userRole);

  const resolvedEntitiesSummary = {
    customerId: entityRes.customer?._id || null,
    clientLocationId: entityRes.location?._id || null,
    employeeId: entityRes.employee?._id || null,
    taskId: entityRes.task?._id || null,
    leadId: entityRes.lead?._id || null,
    customerName: entityRes.customer?.name || "",
    locationName: entityRes.location?.name || "",
    employeeName: entityRes.employee?.name || "",
    taskTitle: entityRes.task?.title || "",
    leadName: entityRes.lead?.name || "",
    totalPending: entityRes.customer?.totalPending !== undefined ? Number(entityRes.customer.totalPending) : null,
    totalPaid: entityRes.customer?.totalPaid !== undefined ? Number(entityRes.customer.totalPaid) : null,
  };

  return {
    status: policy.allowed ? "READY" : "POLICY_BLOCKED",
    intent: intentMeta.intent,
    command: commandName,
    category: intentMeta.category,
    confidence: intentMeta.confidence,
    actionType: policy.actionType,
    riskLevel: policy.riskLevel,
    approvalRequired: policy.approvalRequired,
    requiredRoles: policy.requiredRoles,
    policyReason: policy.reason,
    resolvedEntities: resolvedEntitiesSummary,
    parameters: validation.cleanParams,
    missingParameters: validation.missingParams,
    isValid: validation.isValid,
    validationErrors: validation.errors,
    isExecutable: policy.allowed && validation.isValid,
  };
};

// Legacy exports for backward compatibility with Phase 3
exports.classifyIntent = (prompt = "") => exports.classifyUniversalIntent(prompt).intent;
exports.resolveClientAndLocation = async (prompt = "") => {
  const res = await resolveEntities(prompt);
  return {
    customer: res.customer,
    location: res.location,
    isAmbiguous: res.isAmbiguous,
    candidateCustomers: res.ambiguityDetails?.candidates?.map((c) => c.name) || [],
  };
};
