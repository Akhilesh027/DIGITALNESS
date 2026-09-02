/**
 * AdsCopyEngine.js
 * Conversion-focused Ad Copy, Headline Variants, CTAs, and Lead Form specs.
 */

class AdsCopyEngine {
  generateCopyVariants({ customer, location, strategy, parameters = {} }) {
    const clientName = customer?.companyName || customer?.name || "Client";
    const city = location?.city || customer?.city || "Local City";
    const services = strategy?.services?.length ? strategy.services.join(", ") : "Premium Services";
    const offer = parameters.offerDetails || customer?.adsProfile?.promotedOffers?.[0] || "Special Seasonal Offer";

    const variants = [
      {
        variantName: "Angle 1 — Value & Transformation (Direct Hook)",
        headline: `Transform Your Look with ${services} at ${clientName}`,
        primaryText: `Experience 5-star service and expert care in ${city}. Book your exclusive session today and get ${offer}. Limited appointments available this week!`,
        callToAction: strategy.conversionType === "WHATSAPP" ? "Chat on WhatsApp" : "Get Offer / Book Now",
        format: "Single Image",
      },
      {
        variantName: "Angle 2 — Social Proof & Authority (Trust Hook)",
        headline: `${city}'s Top-Rated Destination for ${services}`,
        primaryText: `Trusted by hundreds of happy clients across ${city}. Certified professionals, premium products, and transparent pricing. Tap below to claim your consultation!`,
        callToAction: strategy.conversionType === "WHATSAPP" ? "Send Message" : "Learn More & Book",
        format: "Reel / Video",
      },
      {
        variantName: "Angle 3 — Urgency & Limited-Time Promotion (Offer Hook)",
        headline: `Limited Slots: ${offer} at ${clientName} ${city}`,
        primaryText: `Don't miss out on our signature ${services} package. Enjoy luxury treatments at unmatched value. Click below to reserve your slot before offer ends!`,
        callToAction: strategy.conversionType === "WHATSAPP" ? "Claim Offer on WhatsApp" : "Sign Up Now",
        format: "Single Image",
      },
    ];

    const leadFormQuestions = [
      { key: "full_name", label: "Full Name", type: "text" },
      { key: "phone_number", label: "Phone Number (WhatsApp)", type: "phone" },
      { key: "service_interest", label: "Preferred Service", type: "dropdown", options: strategy.services },
      { key: "preferred_time", label: "Preferred Appointment Time", type: "dropdown", options: ["Morning", "Afternoon", "Evening", "Weekend"] },
    ];

    return {
      variants,
      leadFormSpec: {
        formTitle: `${clientName} — Exclusive Offer Consultation`,
        introText: `Fill in your details below to claim your exclusive ${offer} and receive an instant callback from our concierge team.`,
        questions: leadFormQuestions,
        thankYouHeadline: "Thanks! You're all set.",
        thankYouBody: "Our team will reach out within 2 hours to confirm your booking.",
        thankYouCTA: "Visit Website or Call Now",
      },
    };
  }
}

module.exports = new AdsCopyEngine();
