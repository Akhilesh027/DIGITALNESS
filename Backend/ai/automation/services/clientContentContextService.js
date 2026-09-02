/**
 * clientContentContextService.js
 * Compiles unified Client 360 intelligence into a normalized context payload for content engines.
 */

const Customer = require("../../../models/Customer");

class ClientContentContextService {
  /**
   * Loads and normalizes full Client 360 profile for a customer.
   */
  async getClientContentContext(clientId) {
    const customer = await Customer.findById(clientId).lean();
    if (!customer) throw new Error(`Customer '${clientId}' not found.`);

    const brandName = customer.companyName || customer.name;
    const businessType = customer.businessType || "Business";
    const city = customer.city || "Hyderabad";
    const phone = (customer.contactNumbers && customer.contactNumbers[0]) || "";
    const email = customer.email || "";

    // Brand Profile Rules
    const brandColors = (customer.brandProfile?.brandColors && customer.brandProfile.brandColors.length > 0)
      ? customer.brandProfile.brandColors
      : ["#1E293B", "#6366F1"]; // Sleek slate / indigo fallback

    const toneOfVoice = customer.socialProfile?.toneOfVoice || "Luxury, Friendly, and Engaging";
    const targetAudience = customer.socialProfile?.targetAudience || "Modern urban clients seeking premium service";

    // Industry Classification
    let industry = "GENERAL";
    const bLower = businessType.toLowerCase();
    if (bLower.includes("salon") || bLower.includes("spa") || bLower.includes("hair") || bLower.includes("beauty")) {
      industry = "SALON";
    } else if (bLower.includes("furniture") || bLower.includes("interior") || bLower.includes("decor")) {
      industry = "FURNITURE";
    } else if (bLower.includes("banquet") || bLower.includes("hotel") || bLower.includes("resort") || bLower.includes("hospitality")) {
      industry = "BANQUET";
    } else if (bLower.includes("clinic") || bLower.includes("hospital") || bLower.includes("dental") || bLower.includes("health")) {
      industry = "HEALTHCARE";
    }

    // Curated Services & Offers
    const services = customer.services || [
      "Hair Styling & Cuts",
      "Hair Botoplex & Keratin Treatments",
      "Balayage & Global Hair Color",
      "Hydra Facials & Skin Glow Therapies",
      "Bridal & Groom Makeover Packages",
    ];

    const activeOffers = customer.activeOffers || [
      "Flat 20% Off on Hair Spa & Botoplex Combos",
      "Pre-Bridal Makeover Consultation (Free)",
    ];

    return {
      clientId: String(customer._id),
      brand: {
        name: brandName,
        industry,
        businessType,
        tone: toneOfVoice,
        colors: brandColors,
        logo: customer.brandProfile?.logoUrl || "",
        website: customer.website || "",
      },
      location: {
        city,
        address: customer.address || "",
        branchName: customer.branchId || "Main Branch",
      },
      contacts: {
        phone,
        email,
      },
      services,
      offers: activeOffers,
      audience: targetAudience,
      prohibitedClaims: ["100% permanent cure", "Zero chemical guarantee"],
    };
  }
}

module.exports = new ClientContentContextService();
