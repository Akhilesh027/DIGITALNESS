/**
 * AutomationPolicyService.js
 * Manages automation policy modes and role permissions for all engines.
 */

const AutomationPolicy = require("../../models/AutomationPolicy");

const DEFAULT_POLICIES = [
  {
    key: "client.pipelineAutoOnboard",
    name: "Zero-Touch Client Onboarding & Deliverable Pipeline",
    description: "Automatically generates monthly task roadmap when a client or lead is onboarded.",
    engine: "CLIENT_PIPELINE",
    enabled: true,
    mode: "APPROVAL_REQUIRED",
    rolesAllowed: ["Admin", "Super Admin", "Manager", "Managing Director"],
    conditions: {},
    maxActionsPerRun: 30,
  },
  {
    key: "content.festivalCalendarGenerator",
    name: "Festival & Marketing Hook Content Calendar Generator",
    description: "Scans upcoming holidays & industry trends to draft weekly/monthly content posts.",
    engine: "CONTENT_CALENDAR",
    enabled: true,
    mode: "DRAFT",
    rolesAllowed: ["Admin", "Super Admin", "Manager"],
    conditions: {},
    maxActionsPerRun: 50,
  },
  {
    key: "sla.guardianWatchAndAlert",
    name: "SLA & Deadline Guardian Watcher",
    description: "Detects stalled tasks and overdue deadlines, calculating proactive SLA risk scores.",
    engine: "SLA_GUARDIAN",
    enabled: true,
    mode: "AUTO_EXECUTE",
    rolesAllowed: ["Admin", "Super Admin", "Manager"],
    conditions: { taskOverdueHours: 8 },
    maxActionsPerRun: 20,
  },
  {
    key: "sla.autoRebalance",
    name: "SLA Auto Workload Rebalancing",
    description: "Suggests or executes 1-click task reassignments for overloaded or delayed assignees.",
    engine: "SLA_GUARDIAN",
    enabled: true,
    mode: "APPROVAL_REQUIRED",
    rolesAllowed: ["Admin", "Super Admin", "Manager"],
    conditions: {},
    maxActionsPerRun: 10,
  },
  {
    key: "payment.recoveryAndReminders",
    name: "Payment & Dues Follow-Up Recovery Engine",
    description: "Watches invoice due dates and drafts smart WhatsApp/Email payment reminders.",
    engine: "PAYMENT_RECOVERY",
    enabled: true,
    mode: "APPROVAL_REQUIRED",
    rolesAllowed: ["Admin", "Super Admin", "Manager"],
    conditions: { reminderDaysBefore: 3, reminderDaysOverdue: 3 },
    maxActionsPerRun: 15,
  },
  {
    key: "briefing.dailyExecutiveRollup",
    name: "Daily Executive Morning Brief & EOD Wrap-Up",
    description: "Compiles decision intelligence and agency priorities at 9:00 AM and 6:00 PM.",
    engine: "EXECUTIVE_BRIEFING",
    enabled: true,
    mode: "AUTO_EXECUTE",
    rolesAllowed: ["Admin", "Super Admin", "Manager", "Managing Director"],
    conditions: {},
    maxActionsPerRun: 10,
  },
];

class AutomationPolicyService {
  /**
   * Ensures default policies exist in database.
   */
  async ensureDefaultPolicies() {
    for (const p of DEFAULT_POLICIES) {
      const exists = await AutomationPolicy.findOne({ key: p.key });
      if (!exists) {
        await AutomationPolicy.create(p);
      }
    }
  }

  /**
   * Retrieves all policies.
   */
  async getAllPolicies() {
    await this.ensureDefaultPolicies();
    return await AutomationPolicy.find({}).sort({ engine: 1, createdAt: 1 }).lean();
  }

  /**
   * Gets a specific policy by key.
   */
  async getPolicy(key) {
    let policy = await AutomationPolicy.findOne({ key }).lean();
    if (!policy) {
      const defaultConf = DEFAULT_POLICIES.find((d) => d.key === key);
      if (defaultConf) {
        policy = await AutomationPolicy.create(defaultConf);
      }
    }
    return policy;
  }

  /**
   * Updates an automation policy mode or settings.
   */
  async updatePolicy(key, updates = {}, userId = null) {
    const policy = await AutomationPolicy.findOneAndUpdate(
      { key },
      { ...updates, updatedBy: userId },
      { new: true, upsert: true }
    );
    return policy;
  }

  /**
   * Evaluates if an automation is authorized to run under given role and policy.
   */
  async evaluateExecutionMode(policyKey, userRole = "Admin") {
    const policy = await this.getPolicy(policyKey);
    if (!policy || !policy.enabled || policy.mode === "DISABLED") {
      return { isAllowed: false, mode: "DISABLED", reason: "Automation policy is disabled." };
    }

    const roleNormalized = String(userRole || "").toLowerCase();
    const isRoleAllowed =
      roleNormalized === "admin" ||
      roleNormalized === "super admin" ||
      policy.rolesAllowed.some((r) => r.toLowerCase() === roleNormalized);

    if (!isRoleAllowed) {
      return {
        isAllowed: false,
        mode: policy.mode,
        reason: `Role '${userRole}' is not authorized for automation '${policyKey}'.`,
      };
    }

    return {
      isAllowed: true,
      mode: policy.mode,
      policy,
    };
  }
}

module.exports = new AutomationPolicyService();
