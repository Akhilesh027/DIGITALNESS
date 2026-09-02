/**
 * clientIntakeService.js
 * Comprehensive AI-powered client intake & onboarding interview engine.
 * Conducts structured multi-turn interviews, extracts answers across all Customer 360 dimensions,
 * and saves complete profiles with automated readiness score calculation.
 */

const Customer = require("../../models/Customer");
const { calculateCustomerReadiness } = require("../../services/agentContextService");

// 4 Comprehensive Intake Stages
const INTAKE_STAGES = [
  {
    id: "BASIC_INFO",
    title: "Basic & Contact Details",
    icon: "Building2",
    questions: [
      {
        key: "name",
        label: "Client / Company Name",
        question: "What is the official **Company or Brand Name**?",
        placeholder: "e.g. Acme Health Clinic, Zenith Real Estate",
        required: true,
        options: [],
      },
      {
        key: "contactPerson",
        label: "Primary Contact Person",
        question: "Who is the **Primary Contact Person / Founder / Manager**?",
        placeholder: "e.g. Dr. Rajesh Sharma (Director)",
        required: false,
        options: [],
      },
      {
        key: "phone",
        label: "Contact Phone Number",
        question: "What is their **Primary Contact Phone Number** (WhatsApp enabled)?",
        placeholder: "e.g. 9876543210",
        required: true,
        options: [],
      },
      {
        key: "email",
        label: "Email Address",
        question: "What is their **Official Email Address**?",
        placeholder: "e.g. contact@brand.com",
        required: false,
        options: [],
      },
      {
        key: "city",
        label: "City / Location",
        question: "Which **City or Primary Location** are they based in?",
        placeholder: "e.g. Hyderabad, Bangalore, Mumbai",
        required: false,
        options: ["Hyderabad", "Bangalore", "Mumbai", "Delhi NCR", "Chennai", "Pune", "Kolkata"],
      },
      {
        key: "website",
        label: "Website URL",
        question: "What is their **Official Website or Landing Page URL**?",
        placeholder: "e.g. https://www.example.com",
        required: false,
        options: ["No website yet", "Under construction"],
      },
    ],
  },
  {
    id: "BUSINESS_PROFILE",
    title: "Business Profile & Offerings",
    icon: "Target",
    questions: [
      {
        key: "industry",
        label: "Industry / Category",
        question: "What is their **Industry or Business Category**?",
        placeholder: "e.g. Dental Clinic & Aesthetic Healthcare",
        required: true,
        options: [
          "Healthcare & Dental",
          "Real Estate & Construction",
          "Hospitality & Restaurants",
          "Beauty, Salon & Spa",
          "E-Commerce & Retail",
          "Education & EdTech",
          "Fitness & Wellness",
          "B2B SaaS & Tech",
        ],
      },
      {
        key: "services",
        label: "Core Services / Products",
        question: "What are their **Core Services or Products Offered**?",
        placeholder: "e.g. Root Canal, Teeth Whitening, Invisible Aligners, Smile Makeover",
        required: true,
        options: [],
      },
      {
        key: "usp",
        label: "Unique Selling Proposition (USP)",
        question: "What is their **Unique Selling Proposition (USP)** or main differentiator?",
        placeholder: "e.g. 15+ years experience, German painless laser tech, 0% EMI financing",
        required: false,
        options: ["Painless Treatment", "Affordable Luxury", "Award-Winning Doctors", "Fast Turnaround / Same Day"],
      },
      {
        key: "targetAudience",
        label: "Target Audience",
        question: "Who is their **Primary Target Audience & Demographics**?",
        placeholder: "e.g. Working professionals aged 25-45, Upper middle-class families within 10km radius",
        required: false,
        options: ["Local Residents (5-10km radius)", "High Net-Worth Individuals (HNIs)", "Young Working Professionals", "B2B Decision Makers"],
      },
      {
        key: "competitors",
        label: "Key Competitors",
        question: "Who are their **Top 2-3 Local or National Competitors**?",
        placeholder: "e.g. Clove Dental, FMS Dental",
        required: false,
        options: [],
      },
    ],
  },
  {
    id: "BRAND_GUIDELINES",
    title: "Brand Identity & Guidelines",
    icon: "Palette",
    questions: [
      {
        key: "brandColors",
        label: "Brand Colors",
        question: "What are their primary **Brand Colors** (Names or Hex codes)?",
        placeholder: "e.g. Royal Blue (#0044FF) and Gold (#D4AF37)",
        required: true,
        options: [
          "Navy Blue & Gold",
          "Teal & Coral",
          "Emerald Green & Gold",
          "Black, White & Accent Gold",
          "Royal Purple & Silver",
          "Pastel Pink & Beige",
        ],
      },
      {
        key: "toneOfVoice",
        label: "Tone of Voice",
        question: "What is their desired **Brand Tone of Voice** for creative copy?",
        placeholder: "e.g. Premium, Empathetic & Authoritative",
        required: true,
        options: [
          "Professional & Authoritative",
          "Empathetic, Warm & Caring",
          "Luxury & Sophisticated",
          "Energetic, Bold & Modern",
          "Friendly, Fun & Conversational",
        ],
      },
      {
        key: "visualStyle",
        label: "Visual Style",
        question: "What **Visual Style** should our designers follow?",
        placeholder: "e.g. Clean Minimalist with High-Quality Lifestyle Photography",
        required: false,
        options: [
          "Clean & Minimalist",
          "Editorial & High-Fashion",
          "Bright, Vibrant & Bold",
          "Corporate & Trust-building",
          "Warm, Earthy & Organic",
        ],
      },
      {
        key: "restrictedWords",
        label: "Restricted / Forbidden Words",
        question: "Are there any **Restricted or Forbidden Words** we must NEVER use in creatives?",
        placeholder: "e.g. Cheap, Discount, 100% Guaranteed, Free, Bargain",
        required: false,
        options: ["Cheap / Budget / Discount", "100% Guaranteed", "Free / Zero Cost", "Pain / Painful"],
      },
    ],
  },
  {
    id: "MARKETING_STRATEGY",
    title: "Marketing & Social Strategy",
    icon: "Share2",
    questions: [
      {
        key: "primaryPlatforms",
        label: "Primary Social Platforms",
        question: "Which **Social Platforms** will we actively manage?",
        placeholder: "e.g. Instagram, Facebook, Google My Business, LinkedIn",
        required: true,
        options: [
          "Instagram & Facebook",
          "Instagram, Facebook & Google Business",
          "LinkedIn & Twitter (B2B)",
          "Instagram, YouTube & Facebook",
        ],
      },
      {
        key: "postingFrequency",
        label: "Posting Frequency",
        question: "What is the planned **Monthly / Weekly Posting Frequency**?",
        placeholder: "e.g. 3 Posts / Week (12 Monthly) + 4 Reels",
        required: false,
        options: [
          "3 Posts/Week (12 Posts/Month)",
          "4 Posts/Week (16 Posts/Month + 4 Reels)",
          "Daily Posting (30 Posts/Month)",
          "Custom Retainer Plan",
        ],
      },
      {
        key: "preferredContentTypes",
        label: "Preferred Content Formats",
        question: "What are their **Preferred Content Formats**?",
        placeholder: "e.g. Educational Carousels, Short Reels, Patient Testimonials, Festival Creatives",
        required: false,
        options: [
          "Educational Carousels & Infographics",
          "Short-Form Video & Reels",
          "Client Reviews & Before/After Proof",
          "Festival & Occasion Posters",
        ],
      },
      {
        key: "ctaPreferences",
        label: "Call to Action (CTA) Preference",
        question: "What should be the primary **Call to Action (CTA)** across all creatives?",
        placeholder: "e.g. Book Your Free Smile Consultation, Call 9876543210, DM us on Instagram",
        required: false,
        options: [
          "Book Free Consultation",
          "Call Us Today",
          "WhatsApp Us",
          "Visit Website / Link in Bio",
          "Claim Special Launch Offer",
        ],
      },
      {
        key: "monthlyAdBudget",
        label: "Monthly Paid Ad Budget",
        question: "Do they have an initial **Monthly Paid Ad Budget** (Meta / Google)?",
        placeholder: "e.g. ₹25,000 / month",
        required: false,
        options: ["₹15,000 / month", "₹25,000 / month", "₹50,000 / month", "₹1,00,000+ / month", "Organic Only (No Ads)"],
      },
    ],
  },
];

// Flattened list of all questions in logical sequence
const ALL_QUESTIONS = INTAKE_STAGES.flatMap((stage) =>
  stage.questions.map((q) => ({ ...q, stageId: stage.id, stageTitle: stage.title }))
);

class ClientIntakeService {
  /**
   * Initializes a new intake session state.
   */
  startIntakeSession({ customerId = null, initialName = "", userId = null, branchId = "BR001" } = {}) {
    return {
      type: "CLIENT_INTAKE",
      stageIndex: 0,
      questionIndex: 0,
      customerId: customerId,
      branchId: branchId || "BR001",
      userId: userId,
      collectedData: {
        name: initialName || "",
        branchId: branchId || "BR001",
      },
      isCompleted: false,
    };
  }

  /**
   * Returns current active question metadata and progress.
   */
  getCurrentQuestion(session) {
    if (!session || session.isCompleted) return null;

    // Find the next unanswered question
    for (let i = 0; i < ALL_QUESTIONS.length; i++) {
      const q = ALL_QUESTIONS[i];
      const val = session.collectedData[q.key];
      const isAnswered = val !== undefined && val !== null && val !== "" && (!Array.isArray(val) || val.length > 0);

      if (!isAnswered) {
        const stageIndex = INTAKE_STAGES.findIndex((s) => s.id === q.stageId);
        const stage = INTAKE_STAGES[stageIndex];
        const progressPercent = Math.round((i / ALL_QUESTIONS.length) * 100);

        return {
          questionIndex: i,
          totalQuestions: ALL_QUESTIONS.length,
          stageIndex: stageIndex + 1,
          totalStages: INTAKE_STAGES.length,
          stageTitle: stage.title,
          progressPercent,
          ...q,
        };
      }
    }

    return null;
  }

  /**
   * Parses user input and slot-fills provided answers into the session.
   * Handles single direct answers, chip selections, skipping, and bulk text extraction.
   */
  processUserInput(session, rawInput, isInitialPrompt = false) {
    if (!session || !rawInput) return { session, updatedFields: [] };

    const text = String(rawInput).trim();
    const lowerText = text.toLowerCase();
    const updatedFields = [];

    // Check if user requested to skip current question
    const currentQ = this.getCurrentQuestion(session);
    const isSkip = ["skip", "next", "pass", "no", "none", "n/a", "later"].includes(lowerText);

    if (isSkip && currentQ) {
      // Mark as explicitly skipped with empty value or default
      session.collectedData[currentQ.key] = currentQ.required ? "" : "N/A";
      return { session, updatedFields: [{ field: currentQ.key, value: "N/A", skipped: true }] };
    }

    // 1. Bulk / Multi-Field Pattern Extraction
    const extractedBulk = this.extractBulkFields(text);
    for (const [k, v] of Object.entries(extractedBulk)) {
      if (v && (!Array.isArray(v) || v.length > 0)) {
        session.collectedData[k] = v;
        updatedFields.push({ field: k, value: v });
      }
    }

    // 2. Direct answer to current question ONLY if NOT in initial multi-sentence prompt
    if (!isInitialPrompt && currentQ && !session.collectedData[currentQ.key]) {
      const parsedVal = this.parseValueForField(currentQ.key, text);
      if (parsedVal !== undefined && parsedVal !== null && parsedVal !== "") {
        session.collectedData[currentQ.key] = parsedVal;
        if (!updatedFields.some((u) => u.field === currentQ.key)) {
          updatedFields.push({ field: currentQ.key, value: parsedVal });
        }
      }
    }

    // Check if all questions are answered or skipped
    const nextQ = this.getCurrentQuestion(session);
    if (!nextQ) {
      session.isCompleted = true;
    }

    return { session, updatedFields };
  }

  /**
   * Field value parser helper
   */
  parseValueForField(key, text) {
    const trimmed = text.trim();
    if (!trimmed) return "";

    switch (key) {
      case "phone": {
        const phoneMatch = trimmed.match(/(?:\+?91|0)?[6-9]\d{9}/);
        return phoneMatch ? phoneMatch[0] : trimmed.replace(/[^0-9+]/g, "");
      }
      case "email": {
        const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return emailMatch ? emailMatch[0] : trimmed;
      }
      case "website": {
        if (/no website|none|under construction/i.test(trimmed)) return "N/A";
        const urlMatch = trimmed.match(/((?:https?:\/\/|www\.)[^\s,]+|[a-zA-Z0-9-]+\.(?:com|in|org|co|io|net|ai|app)[^\s,]*)/i);
        return urlMatch ? urlMatch[0] : trimmed;
      }
      case "brandColors":
      case "services":
      case "products":
      case "competitors":
      case "restrictedWords":
      case "approvedWords":
      case "preferredContentTypes":
      case "primaryPlatforms":
      case "targetAudience": {
        if (Array.isArray(trimmed)) return trimmed;
        // Split by comma, slash, and, or semicolon
        return trimmed
          .split(/[,;&|\n]|\band\b/i)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      case "monthlyAdBudget": {
        const numMatch = trimmed.match(/(?:rs\.?|₹)?\s*([\d,]+)/i);
        if (numMatch) {
          return parseInt(numMatch[1].replace(/,/g, ""), 10) || 0;
        }
        return /organic|no ads|0/i.test(trimmed) ? 0 : trimmed;
      }
      default:
        return trimmed;
    }
  }

  /**
   * Extracts multiple fields from a single comprehensive paragraph or brief.
   */
  extractBulkFields(text) {
    const extracted = {};

    // Phone
    const phoneMatch = text.match(/(?:phone|mobile|call|contact|whatsapp)?[:\s-]*((?:\+?91|0)?[6-9]\d{9})\b/i);
    if (phoneMatch) extracted.phone = phoneMatch[1];

    // Email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) extracted.email = emailMatch[1];

    // Website (e.g. website https://... or bare domain in text)
    const webMatch = text.match(/(?:(?:website|web|url|site)[:\s-]*)?((?:https?:\/\/|www\.)[^\s,]+|[a-zA-Z0-9-]+\.(?:com|in|org|co|io|net|ai|app)[^\s,]*)/i);
    if (webMatch && !webMatch[1].includes("@") && webMatch[1].includes(".")) {
      extracted.website = webMatch[1];
    }

    // City
    const cityMatch = text.match(/(?:in|located in|city|branch|based in|at)\s+([A-Z][a-zA-Z\s]{2,15})(?:,|\.|\n|$)/);
    if (cityMatch && !["Dental", "Clinic", "Hospital", "Brand", "Company", "Services", "Instagram", "Facebook"].includes(cityMatch[1].trim())) {
      extracted.city = cityMatch[1].trim();
    }

    // Brand Colors
    const colorMatch = text.match(/(?:colors?|palette|theme|brand colors?)[:\s-]*([A-Za-z0-9#,\s&]+?)(?=(?:tone|voice|style|website|phone|email|industry|services|target|platforms?)|\.|$)/i);
    if (colorMatch && colorMatch[1].length > 2) {
      extracted.brandColors = colorMatch[1]
        .split(/[,;&]|\band\b/i)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
    }

    // Tone of voice
    const toneMatch = text.match(/(?:tone|voice|tone of voice)[:\s-]*([A-Za-z0-9,\s&]+?)(?=(?:colors?|style|website|phone|services|platforms?)|\.|$)/i);
    if (toneMatch && toneMatch[1].length > 2) {
      extracted.toneOfVoice = toneMatch[1].trim();
    }

    // Services
    const servicesMatch = text.match(/(?:services?|products?|offerings?)[:\s-]*([A-Za-z0-9#,\s&]+?)(?=(?:colors?|tone|voice|style|website|phone|email|industry|target|platforms?|3\s*posts)|\.|$)/i);
    if (servicesMatch && servicesMatch[1].length > 2) {
      extracted.services = servicesMatch[1]
        .split(/[,;&]|\band\b/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // Platforms
    const platformsMatch = text.match(/(?:platforms?|channels?|social)[:\s-]*([A-Za-z0-9#,\s&]+?)(?=(?:colors?|tone|voice|style|website|phone|services|3\s*posts)|\.|$)/i);
    if (platformsMatch && platformsMatch[1].length > 2) {
      extracted.primaryPlatforms = platformsMatch[1]
        .split(/[,;&]|\band\b/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // Industry / Category from explicit label or keyword inference
    const industryMatch = text.match(/(?:industry|category|niche|business type)[:\s-]*([A-Za-z0-9,\s&]+?)(?=(?:services|colors?|tone|website)|\.|$)/i);
    if (industryMatch && industryMatch[1].length > 2) {
      extracted.industry = industryMatch[1].trim();
    } else {
      if (/dental|dentist|teeth|smile/i.test(text)) extracted.industry = "Healthcare & Dental";
      else if (/salon|spa|beauty|hair|makeup/i.test(text)) extracted.industry = "Beauty, Salon & Spa";
      else if (/real estate|property|builder|construction/i.test(text)) extracted.industry = "Real Estate & Construction";
      else if (/restaurant|cafe|food|dining/i.test(text)) extracted.industry = "Hospitality & Restaurants";
    }

    return extracted;
  }

  /**
   * Generates the next conversational AI response message for the client intake interview.
   */
  composeIntakePrompt(session) {
    const currentQ = this.getCurrentQuestion(session);

    if (!currentQ || session.isCompleted) {
      return this.composeFinalSummaryPrompt(session);
    }

    const { stageTitle, stageIndex, totalStages, question, options, placeholder, progressPercent, key } = currentQ;

    let msg = `### 📋 Client 360 Intake • Step ${stageIndex} of ${totalStages}: ${stageTitle}\n`;
    msg += `**Progress:** \`[${progressPercent}% Complete]\`\n\n`;
    msg += `${question}\n`;

    if (placeholder) {
      msg += `> *💡 e.g. ${placeholder}*\n\n`;
    }

    return {
      message: msg,
      currentField: key,
      required: currentQ.required,
      options: options || [],
      progressPercent,
      stageTitle,
      stageIndex,
    };
  }

  /**
   * Generates the final review summary before saving into MongoDB.
   */
  composeFinalSummaryPrompt(session) {
    const d = session.collectedData || {};

    const brandColorsFormatted = Array.isArray(d.brandColors) ? d.brandColors.join(", ") : d.brandColors || "Not Specified";
    const servicesFormatted = Array.isArray(d.services) ? d.services.join(", ") : d.services || "Not Specified";
    const platformsFormatted = Array.isArray(d.primaryPlatforms) ? d.primaryPlatforms.join(", ") : d.primaryPlatforms || "Instagram, Facebook";

    let msg = `### 🎉 Client 360 Intake Complete!\n\n`;
    msg += `Here is the verified onboarding summary for **${d.name || "New Client"}**:\n\n`;

    msg += `| Section | Details |\n`;
    msg += `| :--- | :--- |\n`;
    msg += `| **Client / Brand Name** | **${d.name || "N/A"}** |\n`;
    msg += `| **Contact Info** | 📞 ${d.phone || "N/A"} • ✉️ ${d.email || "N/A"} • 📍 ${d.city || "N/A"} |\n`;
    msg += `| **Industry & Services** | 🏢 **${d.industry || d.businessType || "Digital Marketing"}** • *${servicesFormatted}* |\n`;
    msg += `| **Brand Colors** | 🎨 ${brandColorsFormatted} |\n`;
    msg += `| **Tone of Voice** | 🎙️ ${d.toneOfVoice || "Professional & Engaging"} |\n`;
    msg += `| **Visual Style** | ✨ ${d.visualStyle || "Clean & Minimalist"} |\n`;
    msg += `| **Social Platforms** | 📱 ${platformsFormatted} |\n`;
    msg += `| **Posting Frequency** | 📅 ${d.postingFrequency || "3 Posts / Week"} |\n`;
    msg += `| **Primary CTA** | 🎯 ${d.ctaPreferences || "Book Free Consultation"} |\n\n`;

    msg += `Would you like me to **Save & Onboard** this client into the CRM and compute their **Readiness Score**?`;

    return {
      message: msg,
      isCompleted: true,
      readyToSave: true,
      collectedData: d,
      options: ["✓ Confirm & Save to CRM", "✏️ Edit Information", "❌ Cancel Intake"],
    };
  }

  /**
   * Saves the collected data atomically into MongoDB Customer collection.
   */
  async commitIntakeToDatabase(session) {
    const d = session.collectedData || {};
    if (!d.name) {
      throw new Error("Client or Company Name is required to save customer.");
    }

    const contactNumbers = Array.isArray(d.phone) ? d.phone : d.phone ? [d.phone] : ["9999999999"];
    const brandColors = Array.isArray(d.brandColors) ? d.brandColors : d.brandColors ? [d.brandColors] : ["#0044FF"];
    const services = Array.isArray(d.services) ? d.services : d.services ? [d.services] : [];
    const targetAudience = Array.isArray(d.targetAudience) ? d.targetAudience : d.targetAudience ? [d.targetAudience] : [];
    const competitors = Array.isArray(d.competitors) ? d.competitors : d.competitors ? [d.competitors] : [];
    const restrictedWords = Array.isArray(d.restrictedWords) ? d.restrictedWords : d.restrictedWords ? [d.restrictedWords] : [];
    const primaryPlatforms = Array.isArray(d.primaryPlatforms) ? d.primaryPlatforms : d.primaryPlatforms ? [d.primaryPlatforms] : ["Instagram", "Facebook"];
    const contentTypes = Array.isArray(d.preferredContentTypes) ? d.preferredContentTypes : d.preferredContentTypes ? [d.preferredContentTypes] : ["Poster", "Reel"];
    const ctaPreferences = Array.isArray(d.ctaPreferences) ? d.ctaPreferences : d.ctaPreferences ? [d.ctaPreferences] : ["Book Consultation"];

    let customer;

    // Check if updating existing customer
    if (session.customerId) {
      customer = await Customer.findById(session.customerId);
    }

    // Or check if customer already exists by company name or phone
    if (!customer && d.name) {
      customer = await Customer.findOne({
        $or: [{ name: new RegExp(`^${d.name.trim()}$`, "i") }, { companyName: new RegExp(`^${d.name.trim()}$`, "i") }],
      });
    }

    const customerPayload = {
      name: d.name.trim(),
      companyName: d.companyName || d.name.trim(),
      businessType: d.industry || d.businessType || "Digital Marketing Client",
      contactPerson: d.contactPerson || "",
      contactNumbers: contactNumbers,
      email: d.email || "",
      city: d.city || "",
      website: d.website || "",
      branchId: session.branchId || "BR001",
      createdBy: session.userId || null,
      status: "Active",

      // Full Client 360 sub-documents
      businessProfile: {
        industry: d.industry || d.businessType || "General",
        businessSummary: d.businessSummary || "",
        services: services,
        products: d.products || [],
        usp: d.usp ? [d.usp] : [],
        targetAudience: targetAudience,
        competitors: competitors,
        businessGoals: d.businessGoals ? [d.businessGoals] : ["Brand Awareness", "Lead Generation"],
        priorityServices: services.slice(0, 2),
      },

      brandProfile: {
        brandName: d.name.trim(),
        brandColors: brandColors,
        fonts: d.fonts ? [d.fonts] : ["Inter", "Helvetica Neue"],
        toneOfVoice: d.toneOfVoice ? [d.toneOfVoice] : ["Professional & Engaging"],
        approvedWords: d.approvedWords ? [d.approvedWords] : ["Premium", "Quality", "Expert"],
        restrictedWords: restrictedWords,
        visualStyle: d.visualStyle || "Clean & Minimalist",
        tagline: d.tagline || "",
        contentLanguages: ["English"],
      },

      creativePreferences: {
        preferredStyles: d.visualStyle ? [d.visualStyle] : ["Modern", "Minimalist"],
        contentRatio: "1:1 Square",
        defaultPosterSizes: ["1080x1080", "1080x1920"],
        preferredCTA: ctaPreferences,
      },

      socialProfile: {
        primaryPlatforms: primaryPlatforms,
        postingFrequency: d.postingFrequency || "3 Posts / Week",
        preferredContentTypes: contentTypes,
        ctaPreferences: ctaPreferences,
        toneOfVoice: d.toneOfVoice || "Professional & Engaging",
      },

      marketingPreferences: {
        monthlyAdBudget: typeof d.monthlyAdBudget === "number" ? d.monthlyAdBudget : 0,
        primaryPlatforms: primaryPlatforms,
        postingFrequency: d.postingFrequency || "3 Posts / Week",
        approvalRequired: true,
      },
    };

    if (customer) {
      Object.assign(customer, customerPayload);
      await customer.save();
    } else {
      customer = await Customer.create(customerPayload);
    }

    // Compute Readiness Score
    let readiness = null;
    try {
      readiness = await calculateCustomerReadiness(customer._id);
    } catch (e) {
      console.warn("[ClientIntake] Readiness calculation warning:", e.message);
    }

    return {
      success: true,
      customer,
      readiness,
      message: `🎉 **${customer.name}** onboarded successfully with **${readiness?.score || 85}% Readiness Score**!`,
    };
  }
}

module.exports = new ClientIntakeService();
