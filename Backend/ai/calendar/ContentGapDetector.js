/**
 * ContentGapDetector.js
 * Evaluates planned and published calendar items against client ContentOperationsPolicy commitments.
 */

const ContentOperationsPolicy = require("../../models/ContentOperationsPolicy");
const MarketingCalendarItem = require("../../models/MarketingCalendarItem");

class ContentGapDetector {
  /**
   * Evaluates content gaps for a specific customer in a date range
   */
  async detectGapsForCustomer(customerId, startDate = new Date(), endDate = new Date(Date.now() + 7 * 86400 * 1000)) {
    const policy = await ContentOperationsPolicy.findOne({ customerId, enabled: true });
    if (!policy) {
      return { hasPolicy: false, gaps: [] };
    }

    const items = await MarketingCalendarItem.find({
      customerId,
      scheduledStartAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["CANCELLED", "FAILED"] },
    }).lean();

    const postCount = items.filter((i) => i.itemType === "POST" || i.itemType === "CAROUSEL").length;
    const reelCount = items.filter((i) => i.itemType === "REEL").length;
    const gbpCount = items.filter((i) => i.itemType === "GBP_POST").length;

    const gaps = [];

    if (postCount < policy.requiredPostsPerWeek) {
      gaps.push({
        type: "POSTS_GAP",
        required: policy.requiredPostsPerWeek,
        planned: postCount,
        missing: policy.requiredPostsPerWeek - postCount,
        message: `Content Gap: ${policy.requiredPostsPerWeek - postCount} social post(s) missing for client commitment.`,
      });
    }

    if (gbpCount < policy.requiredGBPPostsPerWeek) {
      gaps.push({
        type: "GBP_GAP",
        required: policy.requiredGBPPostsPerWeek,
        planned: gbpCount,
        missing: policy.requiredGBPPostsPerWeek - gbpCount,
        message: `Content Gap: ${policy.requiredGBPPostsPerWeek - gbpCount} GBP update(s) missing for client commitment.`,
      });
    }

    return {
      hasPolicy: true,
      customerId,
      timeframe: { startDate, endDate },
      commitments: {
        requiredPosts: policy.requiredPostsPerWeek,
        requiredGBP: policy.requiredGBPPostsPerWeek,
      },
      actuals: {
        posts: postCount,
        reels: reelCount,
        gbp: gbpCount,
      },
      hasGaps: gaps.length > 0,
      gaps,
    };
  }
}

module.exports = new ContentGapDetector();
