/**
 * MarketingCalendarService.js
 * Centralized service for Marketing Calendar operations, multi-client scheduling,
 * material rescheduling & approval invalidation, creative version pinning, and operations boards.
 */

const crypto = require("crypto");
const MarketingCalendarItem = require("../../models/MarketingCalendarItem");
const MarketingCampaignGroup = require("../../models/MarketingCampaignGroup");
const ApprovalRequest = require("../../models/ApprovalRequest");
const CreativeAsset = require("../../models/CreativeAsset");
const calendarReadinessEngine = require("./CalendarReadinessEngine");

class MarketingCalendarService {
  /**
   * Creates a new unified calendar item pointer
   */
  async createCalendarItem({
    customerId,
    locationId = null,
    sourceType,
    sourceId,
    itemType = "POST",
    channel = "INSTAGRAM",
    title,
    caption = "",
    scheduledStartAt,
    timezone = "Asia/Kolkata",
    ownerId = null,
    teamId = null,
    creativeAssetId = null,
    pinnedCreativeVersion = 1,
    approvalId = null,
    campaignGroupId = null,
    tags = [],
  }) {
    const calendarItemId = `CAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Generate approval snapshot hash if approval provided
    let approvalSnapshotHash = null;
    if (approvalId) {
      const hashStr = JSON.stringify({ customerId, locationId, channel, title, creativeAssetId, pinnedCreativeVersion, scheduledStartAt });
      approvalSnapshotHash = crypto.createHash("sha256").update(hashStr).digest("hex");
    }

    const item = new MarketingCalendarItem({
      calendarItemId,
      customerId,
      locationId,
      sourceType,
      sourceId,
      itemType,
      channel,
      title,
      caption,
      scheduledStartAt: new Date(scheduledStartAt),
      timezone,
      ownerId,
      teamId,
      creativeAssetId,
      pinnedCreativeVersion,
      approvalId,
      approvalSnapshotHash,
      campaignGroupId,
      tags,
      status: "DRAFT",
    });

    // Evaluate readiness
    const readiness = await calendarReadinessEngine.evaluateItemReadiness(item);
    item.readinessState = readiness.readinessState;
    item.readinessScorePercent = readiness.readinessScorePercent;
    item.blockers = readiness.blockers;
    if (readiness.isExecutable && item.status === "DRAFT") {
      item.status = "READY_TO_SCHEDULE";
    }

    await item.save();
    return item;
  }

  /**
   * Reschedules an item with material change & approval invalidation analysis
   */
  async rescheduleItem({ calendarItemId, newStartAt, timezone = "Asia/Kolkata", actorId = null }) {
    const item = await MarketingCalendarItem.findById(calendarItemId);
    if (!item) throw new Error("Calendar item not found.");

    const oldStart = new Date(item.scheduledStartAt).getTime();
    const newStart = new Date(newStartAt).getTime();
    const diffHours = Math.abs(newStart - oldStart) / (3600 * 1000);

    item.scheduledStartAt = new Date(newStartAt);
    item.timezone = timezone;

    // Material Change Governance: If rescheduled by more than 2 hours after being approved, invalidate approval
    if (diffHours >= 2 && item.approvalId) {
      console.log(`[Calendar] Material reschedule (${diffHours.toFixed(1)}h) -> Invalidating approval for item: ${item.calendarItemId}`);
      item.approvalId = null;
      item.approvalSnapshotHash = null;
      item.status = "NEEDS_APPROVAL";
    }

    // Re-evaluate readiness
    const readiness = await calendarReadinessEngine.evaluateItemReadiness(item);
    item.readinessState = readiness.readinessState;
    item.readinessScorePercent = readiness.readinessScorePercent;
    item.blockers = readiness.blockers;

    await item.save();
    return item;
  }

  /**
   * Attaches creative asset and pins specific version (V1 / V2 / V3)
   */
  async attachCreative({ calendarItemId, creativeAssetId, pinnedVersion = 1, actorId = null }) {
    const item = await MarketingCalendarItem.findById(calendarItemId);
    if (!item) throw new Error("Calendar item not found.");

    const asset = await CreativeAsset.findById(creativeAssetId);
    if (!asset) throw new Error("Creative asset not found.");

    // If previously approved with a different creative version, invalidate approval
    if (item.creativeAssetId && String(item.creativeAssetId) !== String(creativeAssetId) && item.approvalId) {
      console.log(`[Calendar] Creative asset changed -> Invalidating previous approval for item: ${item.calendarItemId}`);
      item.approvalId = null;
      item.approvalSnapshotHash = null;
      item.status = "NEEDS_APPROVAL";
    }

    item.creativeAssetId = asset._id;
    item.pinnedCreativeVersion = pinnedVersion || asset.version;

    // Re-evaluate readiness
    const readiness = await calendarReadinessEngine.evaluateItemReadiness(item);
    item.readinessState = readiness.readinessState;
    item.readinessScorePercent = readiness.readinessScorePercent;
    item.blockers = readiness.blockers;

    await item.save();
    return item;
  }

  /**
   * Retrieves 7-lane Daily Operations Dashboard for a given date
   */
  async getDailyOperations(date = new Date(), customerId = null, locationId = null) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const filter = {
      scheduledStartAt: { $gte: startOfDay, $lte: endOfDay },
    };
    if (customerId) filter.customerId = customerId;
    if (locationId) filter.locationId = locationId;

    const items = await MarketingCalendarItem.find(filter)
      .populate("customerId", "name brandName companyName logoUrl")
      .populate("locationId", "name city")
      .populate("ownerId", "name email role")
      .populate("creativeAssetId")
      .populate("approvalId")
      .sort({ scheduledStartAt: 1 })
      .lean();

    const now = new Date();

    const lanes = {
      OVERDUE: [],
      NEEDS_CREATIVE: [],
      NEEDS_APPROVAL: [],
      READY: [],
      SCHEDULED: [],
      PUBLISHED: [],
      FAILED: [],
    };

    for (const it of items) {
      if (it.status === "PUBLISHED" || it.status === "COMPLETED") {
        lanes.PUBLISHED.push(it);
      } else if (it.status === "FAILED") {
        lanes.FAILED.push(it);
      } else if (new Date(it.scheduledStartAt) < now && it.status !== "PUBLISHED") {
        lanes.OVERDUE.push(it);
      } else if (it.readinessState === "CREATIVE_REQUIRED" || !it.creativeAssetId) {
        lanes.NEEDS_CREATIVE.push(it);
      } else if (it.readinessState === "APPROVAL_REQUIRED" || it.status === "NEEDS_APPROVAL") {
        lanes.NEEDS_APPROVAL.push(it);
      } else if (it.status === "SCHEDULED") {
        lanes.SCHEDULED.push(it);
      } else {
        lanes.READY.push(it);
      }
    }

    return {
      date: startOfDay,
      totalCount: items.length,
      lanes,
    };
  }

  /**
   * Retrieves campaign group deliverables and calculates milestone progress
   */
  async getCampaignGroupProgress(campaignGroupId) {
    const group = await MarketingCampaignGroup.findById(campaignGroupId)
      .populate("customerId", "name brandName")
      .populate("ownerId", "name email");

    if (!group) throw new Error("Campaign group not found.");

    const items = await MarketingCalendarItem.find({ campaignGroupId: group._id })
      .populate("creativeAssetId")
      .populate("approvalId")
      .sort({ scheduledStartAt: 1 })
      .lean();

    const total = items.length;
    const completed = items.filter((i) => i.status === "PUBLISHED" || i.status === "COMPLETED").length;
    const readyOrScheduled = items.filter((i) => i.status === "SCHEDULED" || i.status === "READY_TO_SCHEDULE").length;
    const blocked = items.filter((i) => i.readinessState === "BLOCKED" || i.status === "FAILED").length;

    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      group,
      totalDeliverables: total,
      completedCount: completed,
      readyOrScheduledCount: readyOrScheduled,
      blockedCount: blocked,
      progressPercent,
      deliverables: items,
    };
  }
}

module.exports = new MarketingCalendarService();
