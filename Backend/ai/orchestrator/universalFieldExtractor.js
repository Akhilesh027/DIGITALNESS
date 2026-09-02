/**
 * universalFieldExtractor.js
 * Universal Natural Language Field & Entity Extractor for Phase 4.1 Conversational Intake.
 * Extracts, validates, normalizes, and packages field parameters with confidence metadata.
 */

const KNOWN_SERVICES = [
  { match: /(?:website|web\s*site|web\s*design|web\s*dev(?:elopment)?)/i, label: "Website Development" },
  { match: /(?:google\s*ads?|ppc|adwords|search\s*ads?)/i, label: "Google Ads" },
  { match: /(?:meta\s*ads?|facebook\s*ads?|fb\s*ads?|instagram\s*ads?|ig\s*ads?)/i, label: "Meta Ads" },
  { match: /(?:seo|search\s*engine\s*optimiz(?:ation)?|organic\s*rank)/i, label: "SEO" },
  { match: /(?:social\s*media|smm|social\s*media\s*marketing|instagram\s*growth|reels?)/i, label: "Social Media Marketing" },
  { match: /(?:app\s*dev(?:elopment)?|mobile\s*app|android\s*app|ios\s*app)/i, label: "App Development" },
  { match: /(?:video\s*prod(?:uction)?|promo\s*video|model\s*video|shoot)/i, label: "Video Production" },
  { match: /(?:graphic\s*design|poster\s*design|creatives?|branding|logo\s*design)/i, label: "Graphic Design" },
  { match: /(?:crm|crm\s*software|lead\s*management\s*system)/i, label: "CRM" },
];

const KNOWN_CITIES = [
  "hyderabad", "kukatpally", "gachibowli", "hitech city", "madhapur", "kondapur",
  "bangalore", "bengaluru", "mumbai", "pune", "delhi", "noida", "gurgaon",
  "chennai", "kolkata", "ahmedabad", "visakhapatnam", "vijayawada"
];

const KNOWN_SOURCES = [
  { match: /(?:instagram|ig|insta)/i, label: "Instagram" },
  { match: /(?:facebook|fb)/i, label: "Facebook" },
  { match: /(?:google|google\s*search)/i, label: "Google" },
  { match: /(?:website|web\s*enquiry|landing\s*page)/i, label: "Website" },
  { match: /(?:ad|advertisement|meta\s*ad|google\s*ad)/i, label: "Ad" },
  { match: /(?:referral|referred\s*by|friend)/i, label: "Referral" },
  { match: /(?:telecaller|cold\s*call|calling)/i, label: "Telecaller" },
  { match: /(?:expo|event|conference|trade\s*show)/i, label: "Event" },
];

/**
 * Normalizes phone numbers preserving raw input, international prefix and confidence.
 */
function extractPhone(text = "") {
  if (!text) return null;

  // Patterns: +91 98765 43210, +91-9876543210, 9876543210, 09876543210, 38756837456
  const prefixMatch = text.match(/(?:mobile|phone|contact(?:\s*number)?|cell|call|whatsapp)(?:\s*(?:is|:|-|\b))?\s*(\+?\d[\d\s\-()]{6,16}\d)/i);
  let candidate = prefixMatch ? prefixMatch[1].trim() : null;

  if (!candidate) {
    const standaloneMatch = text.match(/(?:\+91[\s\-]?)?[6-9]\d{9}\b|\+?\d{10,15}\b/);
    if (standaloneMatch) {
      candidate = standaloneMatch[0].trim();
    }
  }

  if (!candidate) return null;

  const raw = candidate;
  const digitsOnly = raw.replace(/\D/g, "");

  let countryCode = "+91";
  let normalized = digitsOnly;
  let isUncertain = false;

  if (raw.startsWith("+")) {
    if (raw.startsWith("+91")) {
      countryCode = "+91";
      normalized = digitsOnly.startsWith("91") ? digitsOnly.slice(2) : digitsOnly;
    } else {
      countryCode = "+" + digitsOnly.slice(0, 2);
      normalized = digitsOnly.slice(2);
    }
  } else if (digitsOnly.length === 10) {
    normalized = digitsOnly;
    countryCode = "+91";
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    normalized = digitsOnly.slice(1);
    countryCode = "+91";
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    normalized = digitsOnly.slice(2);
    countryCode = "+91";
  } else {
    normalized = digitsOnly;
    isUncertain = digitsOnly.length < 10 || digitsOnly.length > 13;
  }

  return {
    value: normalized,
    raw,
    normalized,
    countryCode,
    isUncertain,
    confidence: isUncertain ? 0.75 : 0.98,
    source: "extracted",
  };
}

/**
 * Extracts monetary / budget values (₹50,000, 50k, 25k, Rs. 50000, 50000 INR).
 */
function extractBudget(text = "") {
  if (!text) return null;

  const kMatch = text.match(/(?:budget|fee|cost|price|quote|amount)?\s*(?:is|of|around|approx|~)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const val = Number(kMatch[1]) * 1000;
    return {
      value: val,
      formatted: `₹${val.toLocaleString("en-IN")}`,
      raw: kMatch[0].trim(),
      confidence: 0.95,
      source: "extracted",
    };
  }

  const numMatch = text.match(/(?:budget|amount|price|fee|quote)?\s*(?:is|of|around|approx|~)?\s*(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{3})+|\d+)/i) ||
                   text.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*(?:rs|inr|rupees|budget)/i);
  if (numMatch) {
    const cleanNum = numMatch[1].replace(/,/g, "");
    const parsed = Number(cleanNum);
    if (!isNaN(parsed) && parsed >= 500) {
      return {
        value: parsed,
        formatted: `₹${parsed.toLocaleString("en-IN")}`,
        raw: numMatch[0].trim(),
        confidence: 0.95,
        source: "extracted",
      };
    }
  }

  return null;
}

/**
 * Extracts email addresses.
 */
function extractEmail(text = "") {
  if (!text) return null;
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (match) {
    return {
      value: match[0].toLowerCase().trim(),
      raw: match[0].trim(),
      confidence: 0.99,
      source: "extracted",
    };
  }
  return null;
}

/**
 * Extracts matching service requirements.
 */
function extractServices(text = "") {
  if (!text) return [];
  const found = new Set();

  for (const item of KNOWN_SERVICES) {
    if (item.match.test(text)) {
      found.add(item.label);
    }
  }

  return Array.from(found);
}

/**
 * Extracts city/location.
 */
function extractLocation(text = "") {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const city of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(lower)) {
      const formatted = city.charAt(0).toUpperCase() + city.slice(1);
      return {
        value: formatted,
        raw: city,
        confidence: 0.92,
        source: "extracted",
      };
    }
  }

  const inMatch = text.match(/(?:in|at|from|location(?:\s*is)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (inMatch && !["Lead", "Task", "Friday", "Monday", "Today", "Tomorrow"].includes(inMatch[1])) {
    return {
      value: inMatch[1].trim(),
      raw: inMatch[1].trim(),
      confidence: 0.8,
      source: "extracted",
    };
  }

  return null;
}

/**
 * Extracts lead source.
 */
function extractSource(text = "") {
  if (!text) return null;
  for (const s of KNOWN_SOURCES) {
    if (s.match.test(text)) {
      return {
        value: s.label,
        raw: s.label,
        confidence: 0.9,
        source: "extracted",
      };
    }
  }
  return null;
}

/**
 * Extracts contact person and company/lead name from text.
 */
function extractNames(text = "") {
  const result = {
    companyName: null,
    contactPerson: null,
  };

  const contactMatch = text.match(/(?:contact\s*person(?:\s*is)?|contact|owner(?:\s*is)?|person(?:\s*is)?|poc(?:\s*is)?)\s*[:\-]?\s*([A-Za-z\s]{2,25}?)(?=[,\.\n]|mobile|phone|email|budget|needs|wants|interested|$)/i);
  if (contactMatch && contactMatch[1].trim()) {
    const name = contactMatch[1].trim();
    if (!["lead", "task", "customer", "today", "tomorrow"].includes(name.toLowerCase())) {
      result.contactPerson = {
        value: name,
        raw: name,
        confidence: 0.92,
        source: "extracted",
      };
    }
  }

  const companyMatch = text.match(/(?:add\s*lead\s*for|create\s*lead\s*for|new\s*lead\s*for|lead\s*for|lead|company(?:\s*is)?)\s*[:\-]?\s*([A-Za-z0-9\s&'\.]{2,35}?)(?=[,\.\n]|contact|mobile|phone|email|budget|needs|wants|interested|from|with|$)/i);
  if (companyMatch && companyMatch[1].trim()) {
    const rawComp = companyMatch[1].trim().replace(/^(?:for|a|an)\s+/i, "");
    if (rawComp && !["lead", "task", "customer", "new"].includes(rawComp.toLowerCase())) {
      result.companyName = {
        value: rawComp,
        raw: rawComp,
        confidence: 0.9,
        source: "extracted",
      };
    }
  }

  return result;
}

/**
 * Extracts assigned employee text reference.
 */
function extractAssigneeReference(text = "") {
  if (!text) return null;
  const match = text.match(/(?:assign(?:\s*to)?|assigned\s*to|give\s*to)\s+([A-Za-z\s]{2,20}?)(?=[,\.\n]|$)/i);
  if (match && match[1].trim()) {
    return match[1].trim();
  }
  return null;
}

/**
 * Extracts non-standard CRM notes & preferences (e.g. "They prefer calls after 5 PM").
 */
function extractUnstructuredNotes(text = "") {
  if (!text) return "";
  const notesMatch = text.match(/(?:note|notes|prefer|preference|requirement|remark|comment)s?[:\-]?\s*([^,\.\n]+)/i);
  if (notesMatch) {
    return notesMatch[1].trim();
  }
  return "";
}

/**
 * Detects if a manager response is an explicit Correction command.
 */
function detectCorrection(answer = "") {
  if (!answer) return null;
  const a = answer.trim();

  // 1. Phone correction
  if (/^(?:actually\s*)?(?:change|update|correct|make|set)\s*(?:the\s*)?(?:mobile|phone|number|contact)(?:\s*to|\s*is|\s*as)?\s*(.+)$/i.test(a)) {
    const match = a.match(/(?:to|is|as)\s*(.+)$/i) || [null, a];
    const phoneData = extractPhone(match[1]);
    if (phoneData) {
      return { field: "phone", value: phoneData.value, raw: match[1], statement: a };
    }
  }

  // 2. Company Name correction
  if (/^(?:actually\s*)?(?:change|update|correct|make|set)\s*(?:the\s*)?(?:company|client|lead|name|business)(?:\s*to|\s*is|\s*as)?\s*(.+)$/i.test(a)) {
    const match = a.match(/(?:to|is|as)\s*(.+)$/i) || [null, a];
    return { field: "name", value: match[1].trim(), raw: match[1], statement: a };
  }

  // 3. Contact Person correction
  if (/^(?:actually\s*)?(?:change|update|correct|make|set)\s*(?:the\s*)?(?:contact\s*person|person|owner|poc)(?:\s*to|\s*is|\s*as)?\s*(.+)$/i.test(a)) {
    const match = a.match(/(?:to|is|as)\s*(.+)$/i) || [null, a];
    return { field: "contactPerson", value: match[1].trim(), raw: match[1], statement: a };
  }

  // 4. Email correction
  if (/^(?:actually\s*)?(?:change|update|correct|make|set)\s*(?:the\s*)?(?:email|mail)(?:\s*to|\s*is|\s*as)?\s*(.+)$/i.test(a)) {
    const match = a.match(/(?:to|is|as)\s*(.+)$/i) || [null, a];
    const emailData = extractEmail(match[1]);
    if (emailData) {
      return { field: "email", value: emailData.value, raw: match[1], statement: a };
    }
  }

  // 5. Budget correction
  if (/^(?:actually\s*)?(?:change|update|correct|make|set)\s*(?:the\s*)?(?:budget|amount|price|fee)(?:\s*to|\s*is|\s*as)?\s*(.+)$/i.test(a)) {
    const match = a.match(/(?:to|is|as)\s*(.+)$/i) || [null, a];
    const budgetData = extractBudget(match[1]);
    if (budgetData) {
      return { field: "budget", value: budgetData.value, raw: match[1], statement: a };
    }
  }

  // 6. Location correction
  if (/^(?:actually\s*)?(?:change|update|correct|make|set)\s*(?:the\s*)?(?:city|location|area)(?:\s*to|\s*is|\s*as)?\s*(.+)$/i.test(a)) {
    const match = a.match(/(?:to|is|as)\s*(.+)$/i) || [null, a];
    const locData = extractLocation(match[1]);
    return { field: "city", value: locData ? locData.value : match[1].trim(), raw: match[1], statement: a };
  }

  return null;
}

/**
 * Checks if manager answer indicates a skip intent.
 */
function isSkipIntent(answer = "") {
  if (!answer) return false;
  const a = answer.trim().toLowerCase();
  return (
    a === "skip" ||
    a === "skip this" ||
    a === "skip question" ||
    a === "no" ||
    a === "none" ||
    a === "na" ||
    a === "n/a" ||
    a === "not available" ||
    a === "not now" ||
    a === "later" ||
    a === "don't know" ||
    a === "dont know" ||
    a === "no idea" ||
    a === "pass"
  );
}

/**
 * Universal extraction pipeline for any incoming manager natural language string.
 */
exports.extractUniversalFields = (text = "") => {
  const phone = extractPhone(text);
  const budget = extractBudget(text);
  const email = extractEmail(text);
  const services = extractServices(text);
  const location = extractLocation(text);
  const source = extractSource(text);
  const names = extractNames(text);
  const assigneeRef = extractAssigneeReference(text);
  const notes = extractUnstructuredNotes(text);

  const collected = {};

  if (names.companyName) {
    collected.name = names.companyName;
  }
  if (names.contactPerson) {
    collected.contactPerson = names.contactPerson;
  }
  if (phone) {
    collected.phone = phone;
  }
  if (services.length > 0) {
    collected.requirements = {
      value: services,
      raw: services.join(", "),
      confidence: 0.95,
      source: "extracted",
    };
  }
  if (email) {
    collected.email = email;
  }
  if (budget) {
    collected.budget = budget;
  }
  if (location) {
    collected.city = location;
  }
  if (source) {
    collected.source = source;
  }
  if (notes) {
    collected.notes = {
      value: notes,
      raw: notes,
      confidence: 0.8,
      source: "extracted",
    };
  }

  return {
    collected,
    assigneeRef,
    rawText: text,
  };
};

exports.extractPhone = extractPhone;
exports.extractBudget = extractBudget;
exports.extractEmail = extractEmail;
exports.extractServices = extractServices;
exports.extractLocation = extractLocation;
exports.extractNames = extractNames;
exports.detectCorrection = detectCorrection;
exports.isSkipIntent = isSkipIntent;
