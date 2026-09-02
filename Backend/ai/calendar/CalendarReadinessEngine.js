/**
 * CalendarReadinessEngine.js
 * Evaluates execution readiness for all calendar items, identifying blockers,
 * checking CreativeAsset publishReady, copy completeness, independent approvals, and Google Ads lock.
 */

const CreativeAsset = require("../../models/CreativeAsset");
const ApprovalRequest = require("../../models/ApprovalRequest");

class CalendarReadinessEngine {
  /**
   * Evaluates readiness for a MarketingCalendarItem
   */
  async evaluateItemReadiness(calendarItem) {
    const blockers = [];
    let totalChecks = 0;
    let passedChecks = 0;

    // 1. Creative Readiness Check
    const requiresCreative = ["POST", "REEL", "CAROUSEL", "GBP_POST", "STORY"].includes(calendarItem.itemType);
    if (requiresCreative) {
      totalChecks++;
      if (!calendarItem.creativeAssetId) {
        blockers.push({
          code: "CREATIVE_MISSING",
          severity: "BLOCKING",
          message: "No creative asset attached to this scheduled post.",
          sourceId: String(calendarItem._id),
        });
      } else {
        const asset = await CreativeAsset.findById(calendarItem.creativeAssetId);
        if (!asset) {
          blockers.push({
            code: "CREATIVE_NOT_FOUND",
            severity: "BLOCKING",
            message: "Referenced creative asset does not exist.",
            sourceId: String(calendarItem.creativeAssetId),
          });
        } else if (!asset.publishReady) {
          blockers.push({
            code: "CREATIVE_NOT_PUBLISH_READY",
            severity: "BLOCKING",
            message: "Creative asset is still a draft or failed QA validation.",
            sourceId: String(asset._id),
          });
        } else {
          passedChecks++;
        }
      }
    }

    // 2. Copy / Caption Readiness Check
    const requiresCopy = ["POST", "GBP_POST", "CAROUSEL"].includes(calendarItem.itemType);
    if (requiresCopy) {
      totalChecks++;
      if (!calendarItem.caption || !calendarItem.caption.trim()) {
        blockers.push({
          code: "COPY_MISSING",
          severity: "BLOCKING",
          message: "Post caption is empty.",
          sourceId: String(calendarItem._id),
        });
      } else {
        passedChecks++;
      }
    }

    // 3. Independent Approval Check ($R1$ / $R2$ / $R3$)
    totalChecks++;
    if (!calendarItem.approvalId) {
      blockers.push({
        code: "APPROVAL_REQUIRED",
        severity: "BLOCKING",
        message: "No manager approval request associated with this scheduled action.",
        sourceId: String(calendarItem._id),
      });
    } else {
      const approval = await ApprovalRequest.findById(calendarItem.approvalId);
      if (!approval || approval.status !== "APPROVED") {
        blockers.push({
          code: "APPROVAL_PENDING",
          severity: "BLOCKING",
          message: `Approval is currently ${approval?.status || "NOT_FOUND"} (Requires Manager Approval).`,
          sourceId: String(calendarItem.approvalId),
        });
      } else {
        passedChecks++;
      }
    }

    // 4. Google Ads Production Activation Lock Check
    if (calendarItem.channel === "GOOGLE_ADS" && calendarItem.itemType === "GOOGLE_CAMPAIGN_LAUNCH") {
      totalChecks++;
      const googleAdsRealActivation = process.env.GOOGLE_ADS_REAL_ACTIVATION_ENABLED === "true";
      if (!googleAdsRealActivation) {
        blockers.push({
          code: "PRODUCTION_ACTIVATION_LOCKED",
          severity: "BLOCKING",
          message: "Google Ads campaign activation is locked in production configuration.",
          sourceId: "CONFIG_GOOGLE_ADS_REAL_ACTIVATION_ENABLED",
        });
      } else {
        passedChecks++;
      }
    }

    // 5. Compute Readiness Score & State
    const readinessScorePercent = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    let readinessState = "READY_TO_SCHEDULE";

    if (calendarItem.status === "PUBLISHED" || calendarItem.status === "COMPLETED") {
      readinessState = "COMPLETED";
    } else if (calendarItem.status === "FAILED") {
      readinessState = "FAILED";
    } else if (calendarItem.status === "SCHEDULED" && blockers.length === 0) {
      readinessState = "SCHEDULED";
    } else if (blockers.some((b) => b.code.includes("CREATIVE"))) {
      readinessState = "CREATIVE_REQUIRED";
    } else if (blockers.some((b) => b.code.includes("COPY"))) {
      readinessState = "COPY_REQUIRED";
    } else if (blockers.some((b) => b.code.includes("APPROVAL"))) {
      readinessState = "APPROVAL_REQUIRED";
    } else if (blockers.length > 0) {
      readinessState = "BLOCKED";
    }

    return {
      readinessState,
      readinessScorePercent,
      blockers,
      isExecutable: blockers.length === 0,
    };
  }
}

module.exports = new CalendarReadinessEngine();
