/**
 * ContentCalendarEngine.js
 * Phase 5C: Autonomous Content Intelligence & Calendar Generation Engine.
 */

const ContentCalendar = require("../../../models/ContentCalendar");
const Work = require("../../../models/Work");
const festivalService = require("../services/festivalService");
const contentOpportunityService = require("../services/contentOpportunityService");
const clientContentContextService = require("../services/clientContentContextService");
const contentHistoryService = require("../services/contentHistoryService");
const contentValidationService = require("../services/contentValidationService");
const idempotencyService = require("../services/idempotencyService");
const auditService = require("../AutomationAuditService");
const eventBus = require("../services/eventBus");

class ContentCalendarEngine {
  /**
   * Generates a preview calendar blueprint without mutating MongoDB.
   */
  async previewCalendar({ clientId, month = null, year = null, duration = 30 }) {
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    const periodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // 1. Load Client 360 Context
    const clientCtx = await clientContentContextService.getClientContentContext(clientId);

    // 2. Fetch Active Pipeline Tasks for this Period (Phase 5B slots)
    const existingWorkSlots = await Work.find({
      customer: clientId,
      "pipelineSource.period": periodStr,
    }).sort({ dueDate: 1 }).lean();

    // 3. Gather Festivals & Seasonal Opportunities
    const festivals = festivalService.getFestivalsBetween(startDate, endDate);
    const seasonalOpps = contentOpportunityService.getOpportunitiesForClient({
      industry: clientCtx.brand.industry,
      month: targetMonth,
    });

    // 4. Fetch Previous Content History to avoid repetition
    const history = await contentHistoryService.getRecentHistory(clientId);

    // 5. Build Content Calendar Items mapping onto Phase 5B Deliverable Slots
    const totalSlotCount = existingWorkSlots.length > 0 ? existingWorkSlots.length : 21;
    const items = [];
    let festivalIdx = 0;
    let oppIdx = 0;
    let serviceIdx = 0;

    for (let i = 0; i < totalSlotCount; i++) {
      const slotWork = existingWorkSlots[i] || null;
      const plannedDate = slotWork?.dueDate ? new Date(slotWork.dueDate) : new Date(targetYear, targetMonth - 1, Math.min(28, 2 + i * 2));
      const workType = slotWork?.workType || (i % 4 === 0 ? "Video Editing" : "Graphic Design");

      let itemKey = `ITEM-${periodStr}-${i + 1}`;
      let contentType = workType === "Video Editing" ? "REEL" : "SOCIAL_POST";
      let sourceType = "SERVICE";
      let occasion = "";
      let headline = "";
      let caption = "";
      let creativeBrief = "";
      let visualPrompt = "";
      let reasoningTags = [];

      // Priority 1: High Relevance Festival on matching date
      const matchingFestival = festivals[festivalIdx];
      if (matchingFestival && i % 4 === 1) {
        sourceType = "FESTIVAL";
        occasion = matchingFestival.name;
        headline = `Celebrate ${matchingFestival.name} in Style with ${clientCtx.brand.name}`;
        caption = `✨ Wishing you a joyful and vibrant ${matchingFestival.name}! Enhance your festive celebrations with exclusive styling and pampering at ${clientCtx.brand.name} (${clientCtx.location.city}). Call ${clientCtx.contacts.phone} to book your slot!`;
        creativeBrief = `Design an elegant, festive greeting poster celebrating ${matchingFestival.name}. Use warm festive accents combined with brand colors (${clientCtx.brand.colors.join(", ")}). Include brand logo and contact details.`;
        visualPrompt = `A luxurious festive social media poster celebrating ${matchingFestival.name}, modern aesthetic, warm lighting, featuring ${clientCtx.brand.name} logo, high resolution 8k.`;
        reasoningTags = ["festival", matchingFestival.slug, clientCtx.brand.industry.toLowerCase()];
        festivalIdx++;
      }
      // Priority 2: Seasonal / Industry Opportunity
      else if (seasonalOpps.length > 0 && i % 3 === 0 && oppIdx < seasonalOpps.length) {
        const opp = seasonalOpps[oppIdx % seasonalOpps.length];
        sourceType = "SEASONAL";
        occasion = opp.title;
        headline = opp.headlines[i % opp.headlines.length] || `Transform Your Look with ${clientCtx.brand.name}`;
        caption = `🌿 ${opp.ideas[i % opp.ideas.length] || "Specialized care"}: Protect and enhance your hair and skin this season. Experience tailored treatments at ${clientCtx.brand.name}. 📍 ${clientCtx.location.city} | 📞 ${clientCtx.contacts.phone}`;
        creativeBrief = `Creative visual highlighting ${opp.title}. Modern typography, showcase transformation results, sleek brand overlay in ${clientCtx.brand.colors[0]}.`;
        visualPrompt = `Professional salon treatment photo showing glossy, frizz-free hair transformation, high-end studio lighting, elegant typography overlay.`;
        reasoningTags = ["seasonal", opp.slug];
        oppIdx++;
      }
      // Priority 3: Curated Core Services & Offers
      else {
        sourceType = "SERVICE";
        const serviceName = clientCtx.services[serviceIdx % clientCtx.services.length];
        occasion = serviceName;
        headline = `Experience Premium ${serviceName} at ${clientCtx.brand.name}`;
        caption = `✨ Treat yourself to world-class ${serviceName}. Our master stylists deliver flawless results tailored to your lifestyle. Book your session today at ${clientCtx.brand.name}, ${clientCtx.location.city}! 📞 ${clientCtx.contacts.phone}`;
        creativeBrief = `Showcase ${serviceName} with high-impact before/after or aesthetic treatment visual. Highlight offer badge and booking CTA.`;
        visualPrompt = `Cinematic modern aesthetic poster for luxury ${serviceName}, premium color grading in ${clientCtx.brand.colors[0]}, minimalist layout.`;
        reasoningTags = ["service_promotion", "core_offer"];
        serviceIdx++;
      }

      const calendarItem = {
        itemKey,
        plannedDate,
        contentType,
        sourceType,
        occasion,
        headline,
        caption,
        hashtags: [`#${clientCtx.brand.name.replace(/\s+/g, "")}`, `#${clientCtx.location.city}Salon`, "#LuxurySelfCare", "#TrendingStyles"],
        creativeBrief,
        visualPrompt,
        cta: `Book Slot: ${clientCtx.contacts.phone}`,
        platformTargets: ["Instagram", "Facebook"],
        status: "DRAFT",
        reasoningTags,
        workId: slotWork?._id || null,
      };

      // Quality Validation
      const validation = contentValidationService.validateItem(calendarItem, clientCtx);
      calendarItem.isValid = validation.isValid;
      calendarItem.validationIssues = validation.issues;

      items.push(calendarItem);
    }

    const summary = {
      totalItems: items.length,
      festivalItems: items.filter((it) => it.sourceType === "FESTIVAL").length,
      seasonalItems: items.filter((it) => it.sourceType === "SEASONAL").length,
      serviceItems: items.filter((it) => it.sourceType === "SERVICE").length,
      posters: items.filter((it) => it.contentType === "SOCIAL_POST").length,
      reels: items.filter((it) => it.contentType === "REEL").length,
      gbpPosts: items.filter((it) => it.contentType === "GBP_POST").length,
      approved: 0,
      pending: items.length,
    };

    return {
      client: {
        id: clientCtx.clientId,
        name: clientCtx.brand.name,
        industry: clientCtx.brand.industry,
        city: clientCtx.location.city,
      },
      period: {
        startDate,
        endDate,
        month: targetMonth,
        year: targetYear,
        formatted: periodStr,
      },
      summary,
      items,
      festivalsAvailable: festivals.length,
      seasonalOpportunities: seasonalOpps.length,
    };
  }

  /**
   * Generates and persists a ContentCalendar into MongoDB.
   */
  async generateCalendar({ clientId, month = null, year = null, items = [], userId = null }) {
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    const periodStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

    let itemsToSave = items;
    if (!itemsToSave || itemsToSave.length === 0) {
      const preview = await this.previewCalendar({ clientId, month: targetMonth, year: targetYear });
      itemsToSave = preview.items;
    }

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const summary = {
      totalItems: itemsToSave.length,
      festivalItems: itemsToSave.filter((it) => it.sourceType === "FESTIVAL").length,
      seasonalItems: itemsToSave.filter((it) => it.sourceType === "SEASONAL").length,
      serviceItems: itemsToSave.filter((it) => it.sourceType === "SERVICE").length,
      posters: itemsToSave.filter((it) => it.contentType === "SOCIAL_POST").length,
      reels: itemsToSave.filter((it) => it.contentType === "REEL").length,
      gbpPosts: itemsToSave.filter((it) => it.contentType === "GBP_POST").length,
      approved: 0,
      pending: itemsToSave.length,
    };

    const calendar = await ContentCalendar.findOneAndUpdate(
      { clientId, "period.formatted": periodStr },
      {
        clientId,
        period: { startDate, endDate, month: targetMonth, year: targetYear, formatted: periodStr },
        items: itemsToSave,
        summary,
        status: "DRAFT",
        createdBy: userId || null,
      },
      { new: true, upsert: true }
    );

    // Link back to Phase 5B Work records if present
    for (const item of itemsToSave) {
      if (item.workId) {
        await Work.findByIdAndUpdate(item.workId, {
          contentCalendarSource: {
            calendarId: calendar._id,
            calendarItemId: item.itemKey,
            opportunityType: item.sourceType,
            opportunityId: item.occasion,
          },
          aiPrompt: item.creativeBrief,
        });
      }
    }

    return {
      status: "COMPLETED",
      calendarId: calendar._id,
      clientId,
      period: periodStr,
      totalItems: itemsToSave.length,
      summary,
    };
  }

  /**
   * Batch approves selected calendar items and dispatches content.approved events.
   */
  async batchApprove({ calendarId, itemKeys = [], userId = null }) {
    const calendar = await ContentCalendar.findById(calendarId);
    if (!calendar) throw new Error(`ContentCalendar '${calendarId}' not found.`);

    let approvedCount = 0;
    for (const item of calendar.items) {
      if (itemKeys.length === 0 || itemKeys.includes(item.itemKey)) {
        item.status = "APPROVED";
        item.approval = {
          approvedBy: userId || null,
          approvedAt: new Date(),
        };
        approvedCount++;

        // If linked to Work, advance Work status
        if (item.workId) {
          await Work.findByIdAndUpdate(item.workId, {
            status: "In Progress",
            progressNote: `Approved for creative production: ${item.headline}`,
          });
        }
      }
    }

    calendar.summary.approved = calendar.items.filter((i) => i.status === "APPROVED").length;
    calendar.summary.pending = calendar.items.filter((i) => i.status === "DRAFT").length;
    calendar.status = calendar.summary.pending === 0 ? "APPROVED" : "PARTIALLY_APPROVED";
    await calendar.save();

    // Emit content.approved event for Creative Agent handoff
    eventBus.emitEvent(eventBus.EVENTS.CONTENT_APPROVED, {
      calendarId: calendar._id,
      clientId: calendar.clientId,
      approvedCount,
    });

    return {
      status: "COMPLETED",
      calendarId: calendar._id,
      approvedCount,
      calendarStatus: calendar.status,
    };
  }
}

module.exports = new ContentCalendarEngine();
