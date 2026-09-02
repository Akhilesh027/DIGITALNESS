/**
 * ReportingAggregationService.js
 * Read-only aggregation service compiling provider-normalized metrics from MongoDB snapshots,
 * generating agency overviews, client scorecards, and immutable ReportSnapshots.
 */

const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const MetaAdsInsightSnapshot = require("../../models/MetaAdsInsightSnapshot");
const GoogleAdsInsightSnapshot = require("../../models/GoogleAdsInsightSnapshot");
const SocialPublication = require("../../models/SocialPublication");
const GBPPublication = require("../../models/GBPPublication");
const GoogleBusinessReview = require("../../models/GoogleBusinessReview");
const GBPReviewReply = require("../../models/GBPReviewReply");
const Lead = require("../../models/Lead");
const LeadConversation = require("../../models/LeadConversation");
const LeadFollowUpSequence = require("../../models/LeadFollowUpSequence");
const MarketingCalendarItem = require("../../models/MarketingCalendarItem");
const ApprovalRequest = require("../../models/ApprovalRequest");
const InboxItem = require("../../models/InboxItem");
const ReportSnapshot = require("../../models/ReportSnapshot");

const clientHealthScoreEngine = require("./ClientHealthScoreEngine");
const reportNarrativeService = require("./ReportNarrativeService");
const contentGapDetector = require("../calendar/ContentGapDetector");

class ReportingAggregationService {
  /**
   * Aggregates Agency Executive Overview across all active clients
   */
  async getAgencyOverview(startDate = new Date(Date.now() - 30 * 86400 * 1000), endDate = new Date()) {
    const activeClientsCount = await Customer.countDocuments({ status: { $ne: "Archived" } });

    // 1. Meta Ads Aggregation
    const metaSnapshots = await MetaAdsInsightSnapshot.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    let totalMetaSpend = 0;
    let totalMetaLeads = 0;
    for (const snap of metaSnapshots) {
      totalMetaSpend += snap.spend || 0;
      // Extract lead conversions
      const leads = snap.actions?.find((a) => a.actionType === "lead")?.value || 0;
      totalMetaLeads += leads;
    }

    // 2. Google Ads Aggregation
    const googleSnapshots = await GoogleAdsInsightSnapshot.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    let totalGoogleSpend = 0;
    let totalGoogleConversions = 0;
    for (const snap of googleSnapshots) {
      totalGoogleSpend += snap.spend || 0;
      totalGoogleConversions += snap.conversions || 0;
    }

    const totalAdSpend = totalMetaSpend + totalGoogleSpend;
    const totalPrimaryResults = totalMetaLeads + totalGoogleConversions;
    const blendedCPL = totalPrimaryResults > 0 ? Math.round(totalAdSpend / totalPrimaryResults) : null;

    // 3. Calendar & Content Delivery
    const calendarItems = await MarketingCalendarItem.find({
      scheduledStartAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const plannedItems = calendarItems.length;
    const publishedItems = calendarItems.filter((i) => i.status === "PUBLISHED" || i.status === "COMPLETED").length;
    const contentDeliveryRate = plannedItems > 0 ? Math.round((publishedItems / plannedItems) * 100) : 100;

    // 4. Leads Aggregation
    const totalLeads = await Lead.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
    const qualifiedLeads = await Lead.countDocuments({ createdAt: { $gte: startDate, $lte: endDate }, status: "Qualified" });
    const wonLeads = await Lead.countDocuments({ createdAt: { $gte: startDate, $lte: endDate }, status: "Won" });

    // 5. Operations / SLA
    const inboxItems = await InboxItem.find({ createdAt: { $gte: startDate, $lte: endDate } }).lean();
    const resolvedItems = inboxItems.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;
    const slaComplianceRate = inboxItems.length > 0 ? Math.round((resolvedItems / inboxItems.length) * 100) : 100;
    const atRiskCount = inboxItems.filter((i) => i.sla?.firstResponseStatus === "AT_RISK" || i.sla?.resolutionStatus === "AT_RISK").length;
    const breachedCount = inboxItems.filter((i) => i.sla?.firstResponseStatus === "BREACHED" || i.sla?.resolutionStatus === "BREACHED").length;

    // 6. Approval Invariants
    const pendingApprovals = await ApprovalRequest.countDocuments({ status: "WAITING_APPROVAL" });

    return {
      period: { startDate, endDate },
      topKpis: {
        activeClients: activeClientsCount,
        scheduledToday: calendarItems.filter((i) => new Date(i.scheduledStartAt).toDateString() === new Date().toDateString()).length,
        publishedThisMonth: publishedItems,
        totalLeads,
        qualifiedLeads,
        wonLeads,
        pendingApprovals,
        slaAtRisk: atRiskCount,
        slaBreached: breachedCount,
      },
      adPerformance: {
        metaSpend: totalMetaSpend,
        googleSpend: totalGoogleSpend,
        totalAdSpend,
        metaPrimaryResults: totalMetaLeads,
        googlePrimaryResults: totalGoogleConversions,
        totalPrimaryResults,
        blendedCPL,
        currency: "INR",
      },
      operationsBarometer: {
        contentDeliveryRate,
        slaComplianceRate,
        totalInboxItems: inboxItems.length,
        resolvedInboxItems: resolvedItems,
      },
    };
  }

  /**
   * Aggregates detailed client scorecard for a specific customer & date range
   */
  async getClientOverview(customerId, locationId = null, startDate = new Date(Date.now() - 30 * 86400 * 1000), endDate = new Date()) {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error(`Customer '${customerId}' not found.`);

    const filterCust = { customerId: customer._id };
    if (locationId) filterCust.locationId = locationId;

    // 1. Meta Ads Performance
    const metaSnapshots = await MetaAdsInsightSnapshot.find({
      ...filterCust,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const hasMeta = metaSnapshots.length > 0;
    let metaSpend = 0;
    let metaImpressions = 0;
    let metaClicks = 0;
    let metaLeads = 0;

    for (const s of metaSnapshots) {
      metaSpend += s.spend || 0;
      metaImpressions += s.impressions || 0;
      metaClicks += s.clicks || 0;
      const leads = s.actions?.find((a) => a.actionType === "lead")?.value || 0;
      metaLeads += leads;
    }
    const metaCPL = metaLeads > 0 ? Math.round(metaSpend / metaLeads) : (metaSpend > 0 ? metaSpend : 0);

    // 2. Google Ads Performance
    const googleSnapshots = await GoogleAdsInsightSnapshot.find({
      ...filterCust,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const hasGoogle = googleSnapshots.length > 0;
    let googleSpend = 0;
    let googleImpressions = 0;
    let googleClicks = 0;
    let googleConversions = 0;

    for (const s of googleSnapshots) {
      googleSpend += s.spend || 0;
      googleImpressions += s.impressions || 0;
      googleClicks += s.clicks || 0;
      googleConversions += s.conversions || 0;
    }
    const googleCostPerResult = googleConversions > 0 ? Math.round(googleSpend / googleConversions) : (googleSpend > 0 ? googleSpend : 0);

    // 3. Content Delivery & Gap Analysis
    const calendarFilter = {
      customerId: customer._id,
      scheduledStartAt: { $gte: startDate, $lte: endDate },
    };
    if (locationId) calendarFilter.locationId = locationId;

    const calendarItems = await MarketingCalendarItem.find(calendarFilter).lean();
    const plannedCount = calendarItems.length;
    const publishedCount = calendarItems.filter((i) => i.status === "PUBLISHED" || i.status === "COMPLETED").length;
    const contentDeliveryRate = plannedCount > 0 ? Math.round((publishedCount / plannedCount) * 100) : 100;
    const reelsCount = calendarItems.filter((i) => i.itemType === "REEL" && (i.status === "PUBLISHED" || i.status === "COMPLETED")).length;
    const gbpPostCount = calendarItems.filter((i) => i.itemType === "GBP_POST" && (i.status === "PUBLISHED" || i.status === "COMPLETED")).length;

    const gapReport = await contentGapDetector.detectGapsForCustomer(customer._id, startDate, endDate);

    // 4. Leads Funnel
    const leadFilter = { customerId: customer._id, createdAt: { $gte: startDate, $lte: endDate } };
    if (locationId) leadFilter.locationId = locationId;

    const leads = await Lead.find(leadFilter).lean();
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === "New").length;
    const contactedLeads = leads.filter((l) => l.status === "Contacted").length;
    const qualifiedLeads = leads.filter((l) => l.status === "Qualified").length;
    const wonLeads = leads.filter((l) => l.status === "Won").length;
    const leadConversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    // 5. WhatsApp Metrics
    const waFilter = { customerId: customer._id, createdAt: { $gte: startDate, $lte: endDate } };
    const waConversations = await LeadConversation.countDocuments(waFilter);
    const waSequences = await LeadFollowUpSequence.find(waFilter).lean();
    const followUpsSent = waSequences.reduce((acc, s) => acc + (s.messagesSentCount || 0), 0);
    const responsesAfterFollowUp = waSequences.filter((s) => s.status === "COMPLETED" || s.status === "PAUSED_REPLY").length;

    // 6. Reputation & GBP Reviews
    const reviewFilter = { customerId: customer._id, createdAt: { $gte: startDate, $lte: endDate } };
    const reviews = await GoogleBusinessReview.find(reviewFilter).lean();
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0 ? reviews.reduce((acc, r) => acc + (r.starRating || 5), 0) / reviewCount : 5.0;
    const repliesCount = await GBPReviewReply.countDocuments({ customerId: customer._id, status: "PUBLISHED" });
    const replyRate = reviewCount > 0 ? Math.round((repliesCount / reviewCount) * 100) : 100;

    // 7. Health Score Calculation
    const healthScore = clientHealthScoreEngine.calculateHealthScore({
      contentDeliveryRate,
      hasAds: hasMeta || hasGoogle,
      adsEfficiencyScore: metaSpend > 0 && metaLeads > 0 ? 90 : 75,
      leadConversionRate,
      reviewReplyRate: replyRate,
      slaComplianceRate: 95,
      hasGaps: gapReport.hasGaps,
    });

    // 8. Grounded Narrative Generation
    const narrative = reportNarrativeService.generateExecutiveNarrative({
      clientName: customer.name || customer.companyName,
      periodLabel: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      contentDeliveryRate,
      publishedCount,
      metaSpend,
      metaPrimaryResults: metaLeads,
      metaCPL,
      totalLeads,
      qualifiedLeads,
      wonLeads,
      reviewCount,
      avgRating,
      replyRate,
      healthScore,
      gaps: gapReport.gaps,
    });

    return {
      customer: {
        _id: customer._id,
        name: customer.name,
        brandName: customer.brandName,
        companyName: customer.companyName,
        industry: customer.industry,
      },
      period: { startDate, endDate },
      healthScore,
      narrative,
      contentDelivery: {
        planned: plannedCount,
        published: publishedCount,
        deliveryRate: contentDeliveryRate,
        reelsPublished: reelsCount,
        gbpPostsPublished: gbpPostCount,
        hasGaps: gapReport.hasGaps,
        gaps: gapReport.gaps,
      },
      metaAds: hasMeta
        ? {
            status: "ACTIVE",
            spend: metaSpend,
            impressions: metaImpressions,
            clicks: metaClicks,
            leads: metaLeads,
            costPerLead: metaCPL,
          }
        : { status: "NOT_CONFIGURED", spend: null, leads: null, costPerLead: null },
      googleAds: hasGoogle
        ? {
            status: "ACTIVE",
            spend: googleSpend,
            impressions: googleImpressions,
            clicks: googleClicks,
            primaryResults: googleConversions,
            costPerResult: googleCostPerResult,
          }
        : { status: "NOT_CONFIGURED", spend: null, primaryResults: null, costPerResult: null },
      leadPipeline: {
        total: totalLeads,
        new: newLeads,
        contacted: contactedLeads,
        qualified: qualifiedLeads,
        won: wonLeads,
        conversionRate: leadConversionRate,
      },
      whatsapp: {
        conversations: waConversations,
        followUpsSent,
        responsesAfterFollowUp,
      },
      reputation: {
        reviewsReceived: reviewCount,
        averageRating: avgRating,
        repliesCompleted: repliesCount,
        replyRate,
      },
    };
  }

  /**
   * Generates and persists an immutable ReportSnapshot
   */
  async generateReportSnapshot({ customerId, locationId = null, periodType = "THIS_MONTH", periodStart, periodEnd, user = null }) {
    const reportData = await this.getClientOverview(customerId, locationId, new Date(periodStart), new Date(periodEnd));

    const reportSnapshotId = `RPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const checksum = crypto.createHash("sha256").update(JSON.stringify(reportData)).digest("hex");

    const snapshot = await ReportSnapshot.create({
      reportSnapshotId,
      customerId,
      locationId,
      reportType: "MONTHLY_CLIENT_SCORECARD",
      periodType,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      metrics: {
        contentDeliveryRate: reportData.contentDelivery.deliveryRate,
        metaSpend: reportData.metaAds.spend,
        metaLeads: reportData.metaAds.leads,
        totalLeads: reportData.leadPipeline.total,
        wonLeads: reportData.leadPipeline.won,
      },
      sections: reportData,
      clientHealthScore: reportData.healthScore,
      status: "GENERATED",
      generatedBy: user?._id || null,
      checksum,
    });

    return snapshot;
  }
}

module.exports = new ReportingAggregationService();
