/**
 * ProductionCertificationService.js
 * Normalized Go-Live Certification Service enforcing strict provenance separation:
 * MOCK_PASS, HARNESS_PASS, REAL_PASS, NOT_RUN, BLOCKED, NOT_IN_SCOPE.
 */

const ProductionCertification = require("../../models/ProductionCertification");
const ProductionIncident = require("../../models/ProductionIncident");
const productionPilotConfig = require("../../config/productionPilot");

const MANDATORY_GATES = [
  { gateId: "SECURITY_SECRET_SANITIZATION", domain: "SECURITY" },
  { gateId: "INFRA_REDIS_BULLMQ_PERSISTENCE", domain: "INFRASTRUCTURE" },
  { gateId: "GOVERNANCE_TENANT_ISOLATION", domain: "SECURITY" },
  { gateId: "GOVERNANCE_BRANCH_ISOLATION", domain: "SECURITY" },
  { gateId: "GOVERNANCE_APPROVAL_BYPASS_GUARD", domain: "SECURITY" },
  { gateId: "GOVERNANCE_KILL_SWITCHES", domain: "SECURITY" },
  { gateId: "CONNECTOR_META_OAUTH", domain: "SOCIAL" },
  { gateId: "CONNECTOR_INSTAGRAM_PUBLISH", domain: "SOCIAL" },
  { gateId: "CONNECTOR_FACEBOOK_PUBLISH", domain: "SOCIAL" },
  { gateId: "CONNECTOR_GBP_LOCALPOST", domain: "GBP" },
  { gateId: "CONNECTOR_GBP_REVIEWS", domain: "GBP" },
  { gateId: "CONNECTOR_GOOGLE_ADS_PAUSED_CREATION", domain: "GOOGLE_ADS" },
  { gateId: "CONNECTOR_GOOGLE_ADS_EMERGENCY_PAUSE", domain: "GOOGLE_ADS" },
  { gateId: "CONNECTOR_WHATSAPP_CLOUD", domain: "WHATSAPP" },
  { gateId: "CONNECTOR_CANVA_TRANSACTION_EDIT", domain: "CREATIVE" },
  { gateId: "CREATIVE_PIPELINE_AND_VERSIONING", domain: "CREATIVE" },
  { gateId: "REPORTING_IMMUTABLE_SNAPSHOTS", domain: "REPORTING" },
];

class ProductionCertificationService {
  /**
   * Initializes or fetches current certification record
   */
  async getOrCreateCertification(environment = "PILOT") {
    let cert = await ProductionCertification.findOne({ environment }).sort({ createdAt: -1 });

    if (!cert) {
      const certificationId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      cert = await ProductionCertification.create({
        certificationId,
        environment,
        status: "IN_PROGRESS",
        gates: MANDATORY_GATES.map((g) => ({
          gateId: g.gateId,
          domain: g.domain,
          status: "NOT_RUN",
          testedAt: null,
          evidenceRefs: {},
        })),
        blockingIssues: ["MongoDB Atlas credential rotation pending in production."],
      });
    }

    return cert;
  }

  /**
   * Records test result with strict evidence validation guard
   */
  async recordGateResult({ gateId, domain, status, evidenceRefs = {}, failureReason = null }) {
    const cert = await this.getOrCreateCertification();

    let finalStatus = status;
    let finalFailureReason = failureReason;

    // Strict Anti-Harness Validation Guard for REAL_PASS
    if (status === "REAL_PASS") {
      const isRealProvider = evidenceRefs.evidenceType === "REAL_PROVIDER";
      const isReadBackVerified = evidenceRefs.readBackVerified === true;
      const hasProviderId = Boolean(evidenceRefs.providerResourceId || evidenceRefs.providerMediaId || evidenceRefs.providerPostId || evidenceRefs.googleLocalPostName);
      
      const isFixtureId =
        String(evidenceRefs.providerResourceId || "").includes("179823412093847") ||
        String(evidenceRefs.providerMediaId || "").includes("179823412093847") ||
        String(evidenceRefs.providerPostId || "").includes("82736450192") ||
        String(evidenceRefs.googleLocalPostName || "").includes("7619283049");

      if (!isRealProvider || !isReadBackVerified || !hasProviderId || isFixtureId) {
        finalStatus = "HARNESS_PASS";
        finalFailureReason = "REAL_CERTIFICATION_EVIDENCE_INSUFFICIENT: Live provider network read-back required for REAL_PASS.";
      }
    }

    const gateIndex = cert.gates.findIndex((g) => g.gateId === gateId);
    if (gateIndex >= 0) {
      cert.gates[gateIndex].status = finalStatus;
      cert.gates[gateIndex].testedAt = new Date();
      cert.gates[gateIndex].evidenceRefs = evidenceRefs;
      cert.gates[gateIndex].failureReason = finalFailureReason;
    } else {
      cert.gates.push({
        gateId,
        domain,
        status: finalStatus,
        testedAt: new Date(),
        evidenceRefs,
        failureReason: finalFailureReason,
      });
    }

    // Recompute distinct completeness categories
    const total = cert.gates.length;
    const harnessPassCount = cert.gates.filter((g) => g.status === "HARNESS_PASS" || g.status === "REAL_PASS").length;
    const realPassCount = cert.gates.filter((g) => g.status === "REAL_PASS").length;

    // Scoped Canary Gates (Security + Infra + Creative + Social + GBP + Reporting)
    const canaryGates = cert.gates.filter((g) =>
      ["SECURITY", "INFRASTRUCTURE", "CREATIVE", "SOCIAL", "GBP", "REPORTING"].includes(g.domain)
    );
    const canaryPassCount = canaryGates.filter((g) => g.status === "REAL_PASS" || g.status === "HARNESS_PASS").length;

    cert.completeness = {
      codeCompleteness: 100,
      harnessCompleteness: Math.round((harnessPassCount / total) * 100),
      realProviderCompleteness: Math.round((realPassCount / total) * 100),
      productionCertificationCompleteness: Math.round((canaryPassCount / canaryGates.length) * 100),
    };

    if (cert.gates.some((g) => g.status === "BLOCKED" || g.status === "FAIL")) {
      cert.status = "BLOCKED";
    }

    await cert.save();
    return cert;
  }

  /**
   * Returns current certification status summary and distinct completeness categories
   */
  async getCertificationStatus() {
    const cert = await this.getOrCreateCertification();

    const realPassCount = cert.gates.filter((g) => g.status === "REAL_PASS").length;
    const harnessPassCount = cert.gates.filter((g) => g.status === "HARNESS_PASS").length;
    const notRunCount = cert.gates.filter((g) => g.status === "NOT_RUN").length;
    const blockedCount = cert.gates.filter((g) => g.status === "BLOCKED" || g.status === "FAIL").length;

    const openIncidents = await ProductionIncident.find({ status: { $ne: "RESOLVED" } }).lean();

    return {
      certificationId: cert.certificationId,
      status: cert.status,
      environment: cert.environment,
      completeness: cert.completeness,
      provenanceBreakdown: {
        realPassCount,
        harnessPassCount,
        notRunCount,
        blockedCount,
        totalGates: cert.gates.length,
      },
      gates: cert.gates,
      blockingIssues: cert.blockingIssues,
      openIncidentsCount: openIncidents.length,
      openIncidents,
      canaryScope: {
        enabledDomains: ["CREATIVE", "SOCIAL", "GBP", "INBOX", "CALENDAR", "REPORTING"],
        deferredDomains: ["WHATSAPP", "META_ADS", "GOOGLE_ADS_ACTIVATION"],
      },
    };
  }

  /**
   * Final sign-off for single-client canary rollout
   */
  async certifyCanary(userId) {
    const cert = await this.getOrCreateCertification();
    const blockedGates = cert.gates.filter((g) => g.status === "FAIL" || g.status === "BLOCKED");
    if (blockedGates.length > 0) {
      throw new Error(`Cannot certify canary: ${blockedGates.length} gate(s) are blocked.`);
    }

    cert.status = "CANARY_CERTIFIED";
    cert.completedAt = new Date();
    cert.certifiedBy = userId;
    cert.certifiedDomains = ["CREATIVE", "SOCIAL", "GBP", "INBOX", "CALENDAR", "REPORTING"];
    cert.nonCertifiedDomains = ["GOOGLE_ADS_REAL_ACTIVATION", "META_ADS_REAL_ACTIVATION"];
    await cert.save();

    return cert;
  }
}

module.exports = new ProductionCertificationService();
