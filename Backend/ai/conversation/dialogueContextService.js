/**
 * dialogueContextService.js
 * Multi-Turn Conversational Memory & Context Resolution Service for Digitalness CRM.
 * Resolves anaphoric references ("it", "this", "that number", "same offer"),
 * natural customer/parameter corrections, and Customer 360 prefilling.
 */

const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const ClientAIMemory = require("../../models/ClientAIMemory");
const ClientAttachment = require("../../models/ClientAttachment");

class DialogueContextService {
  /**
   * Pre-loads Customer 360 context to answer inferable fields automatically.
   */
  async loadCustomerBrandContext(customerId) {
    if (!customerId) return null;

    try {
      const customer = await Customer.findById(customerId).lean();
      if (!customer) return null;

      const locations = await ClientLocation.find({ customerId, status: "Active" }).lean();
      const memories = await ClientAIMemory.find({ customerId, status: "Approved" }).lean();
      const assets = await ClientAttachment.find({ customerId, approvedForAI: true }).lean();

      // Extract brand preferences
      const brandContext = {
        customerId: customer._id,
        customerName: customer.name,
        companyName: customer.companyName || customer.name,
        industry: customer.businessProfile?.industry || customer.industry || "Beauty & Wellness",
        website: customer.website || customer.onlinePresence?.website || "",
        phone: (customer.contactNumbers && customer.contactNumbers[0]) || customer.contactNumber || customer.phone || "",
        email: customer.email || "",
        city: customer.city || "Hyderabad",
        address: customer.address || customer.location || "",
        tagline: customer.tagline || customer.businessProfile?.tagline || "",
        hasLogo: Boolean(customer.logoUrl || assets.some((a) => a.assetType === "Logo")),
        logoUrl: customer.logoUrl || (assets.find((a) => a.assetType === "Logo")?.fileUrl || null),
        brandColors: customer.brandColors || customer.brandIdentity?.colors || ["#E11D48", "#FB7185", "#F43F5E", "#FFE4E6"],
        toneOfVoice: customer.socialProfile?.toneOfVoice || customer.toneOfVoice || "Warm, Trendy & Inviting",
        targetAudience: customer.targetAudience || customer.socialProfile?.targetAudience || "Local Customers",
        currentOffer: customer.currentOffer || null,
        locations: locations.map((l) => ({ id: l._id, name: l.name, address: l.address, phone: l.phone, city: l.city })),
        defaultCTA: customer.defaultCTA || `Call ${customer.contactNumbers?.[0] || customer.contactNumber || "Now"} to Book`,
        approvedAssetsCount: assets.length,
        memoriesCount: memories.length,
      };

      return brandContext;
    } catch (err) {
      console.error("[dialogueContextService.loadCustomerBrandContext Error]:", err);
      return null;
    }
  }

  /**
   * Resolves conversational references and corrections from the user's latest prompt.
   * e.g., "Actually make it for Lepakshi", "Change phone to 9123456780", "Make it a reel instead", "Schedule it tomorrow evening"
   */
  resolveReferencesAndCorrections({ prompt = "", activeContext = {}, pendingSession = null }) {
    const p = prompt.trim();
    const lower = p.toLowerCase();
    const resolution = {
      isCorrection: false,
      isReferenceAction: false,
      fieldModified: null,
      newValue: null,
      action: null,
      extractedEntities: {},
      enrichedParameters: {},
    };

    // 1. Natural Customer Correction (e.g. "Actually make it for Lepakshi", "Client is actually Bachupally")
    const custCorrectionMatch = lower.match(/(?:actually\s+(?:make\s+it\s+for|switch\s+to|for)|change\s+(?:client|customer)\s+to)\s+([a-z0-9\s&]+)/i);
    if (custCorrectionMatch) {
      resolution.isCorrection = true;
      resolution.fieldModified = "customer";
      resolution.newValue = custCorrectionMatch[1].trim();
    }

    // 2. Phone number correction (e.g. "Actually phone is 9123456780", "Change phone to 9876543210")
    const phoneMatch = lower.match(/(?:phone|number|mobile|contact)\s+(?:is\s+|to\s+)?(\d{10})/i);
    if (phoneMatch) {
      resolution.isCorrection = true;
      resolution.fieldModified = "phone";
      resolution.newValue = phoneMatch[1].trim();
    }

    // 3. Asset Type modification (e.g. "Make it a reel instead", "Create carousel version")
    if (lower.includes("reel instead") || lower.includes("make it a reel")) {
      resolution.isCorrection = true;
      resolution.fieldModified = "assetType";
      resolution.newValue = "reel";
    } else if (lower.includes("carousel instead") || lower.includes("make it a carousel")) {
      resolution.isCorrection = true;
      resolution.fieldModified = "assetType";
      resolution.newValue = "carousel";
    } else if (lower.includes("poster instead") || lower.includes("make it a poster")) {
      resolution.isCorrection = true;
      resolution.fieldModified = "assetType";
      resolution.newValue = "poster";
    }

    // 3.5. Ad Campaign Budget / Duration correction
    const budgetMatch = lower.match(/(?:budget|spend|daily\s+spend|daily\s+budget)\s+(?:is\s+|to\s+|of\s+)?(?:₹|rs\.?)?\s*(\d+)/i);
    if (budgetMatch) {
      resolution.isCorrection = true;
      resolution.fieldModified = "dailyBudget";
      resolution.newValue = Number(budgetMatch[1]);
    }

    // 4. Creative Revision / Styling reference ("Make it more traditional", "Make it more premium", "Make it minimal")
    if (activeContext.currentArtifact && (lower.includes("make it") || lower.includes("use more") || lower.includes("change the") || lower.includes("more festive") || lower.includes("more premium") || lower.includes("minimal"))) {
      resolution.isReferenceAction = true;
      resolution.action = "creative.revise";
      resolution.enrichedParameters = {
        revisionInstruction: p,
        creativeRunId: activeContext.currentArtifact.creativeRunId,
      };
    }

    // 5. Scheduling reference ("Schedule it tomorrow evening", "Schedule this for Monday")
    if (activeContext.currentArtifact && (lower.includes("schedule") || lower.includes("post this") || lower.includes("publish"))) {
      resolution.isReferenceAction = true;
      resolution.action = "content.schedule";
      resolution.enrichedParameters = {
        creativeRunId: activeContext.currentArtifact.creativeRunId,
        scheduleDate: lower.includes("tomorrow") ? new Date(Date.now() + 86400000) : new Date(),
      };
    }

    return resolution;
  }
}

module.exports = new DialogueContextService();
