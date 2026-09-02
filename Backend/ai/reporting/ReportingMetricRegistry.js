/**
 * ReportingMetricRegistry.js
 * Central dictionary defining canonical metric formulas, domains, units,
 * desired directions, and missing data policies.
 */

const METRICS = {
  // --- ADS DOMAIN ---
  META_SPEND: {
    key: "META_SPEND",
    label: "Meta Ads Spend",
    domain: "ADS",
    unit: "CURRENCY_INR",
    source: "META_ADS_INSIGHTS",
    desiredDirection: "NEUTRAL",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Total advertising expenditure on Meta Marketing API platforms.",
  },
  GOOGLE_ADS_SPEND: {
    key: "GOOGLE_ADS_SPEND",
    label: "Google Ads Spend",
    domain: "ADS",
    unit: "CURRENCY_INR",
    source: "GOOGLE_ADS_INSIGHTS",
    desiredDirection: "NEUTRAL",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Total advertising expenditure on Google Ads campaigns.",
  },
  TOTAL_AD_SPEND: {
    key: "TOTAL_AD_SPEND",
    label: "Total Ad Spend",
    domain: "ADS",
    unit: "CURRENCY_INR",
    source: "DERIVED",
    desiredDirection: "NEUTRAL",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Sum of Meta Ads and Google Ads spend when currencies are compatible.",
  },
  META_PRIMARY_RESULTS: {
    key: "META_PRIMARY_RESULTS",
    label: "Meta Primary Leads",
    domain: "ADS",
    unit: "COUNT",
    source: "META_ADS_INSIGHTS",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Primary lead generation results reported by Meta.",
  },
  GOOGLE_PRIMARY_RESULTS: {
    key: "GOOGLE_PRIMARY_RESULTS",
    label: "Google Primary Results",
    domain: "ADS",
    unit: "COUNT",
    source: "GOOGLE_ADS_INSIGHTS",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Primary conversions/leads reported by Google Ads.",
  },
  TOTAL_PRIMARY_RESULTS: {
    key: "TOTAL_PRIMARY_RESULTS",
    label: "Total Primary Leads",
    domain: "ADS",
    unit: "COUNT",
    source: "DERIVED",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Sum of compatible lead conversions across Meta and Google.",
  },
  BLENDED_COST_PER_RESULT: {
    key: "BLENDED_COST_PER_RESULT",
    label: "Blended Cost Per Lead (CPL)",
    domain: "ADS",
    unit: "CURRENCY_INR",
    source: "DERIVED",
    desiredDirection: "LOWER_BETTER",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Total ad spend divided by total primary lead results.",
  },

  // --- CONTENT DOMAIN ---
  SOCIAL_POSTS_PLANNED: {
    key: "SOCIAL_POSTS_PLANNED",
    label: "Social Posts Planned",
    domain: "CONTENT",
    unit: "COUNT",
    source: "MARKETING_CALENDAR",
    desiredDirection: "NEUTRAL",
    missingDataPolicy: "ZERO",
    description: "Number of social posts scheduled in the calendar for the period.",
  },
  SOCIAL_POSTS_PUBLISHED: {
    key: "SOCIAL_POSTS_PUBLISHED",
    label: "Social Posts Published",
    domain: "CONTENT",
    unit: "COUNT",
    source: "SOCIAL_PUBLICATION",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Number of social posts successfully published.",
  },
  CONTENT_DELIVERY_RATE: {
    key: "CONTENT_DELIVERY_RATE",
    label: "Content Delivery Rate",
    domain: "CONTENT",
    unit: "PERCENTAGE",
    source: "DERIVED",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Percentage of eligible planned deliverables published.",
  },
  GBP_POSTS_PUBLISHED: {
    key: "GBP_POSTS_PUBLISHED",
    label: "GBP Posts Published",
    domain: "CONTENT",
    unit: "COUNT",
    source: "GBP_PUBLICATION",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Number of Google Business Profile posts published.",
  },

  // --- REPUTATION DOMAIN ---
  REVIEWS_RECEIVED: {
    key: "REVIEWS_RECEIVED",
    label: "Reviews Received",
    domain: "REPUTATION",
    unit: "COUNT",
    source: "GOOGLE_BUSINESS_REVIEWS",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Number of Google reviews received during the period.",
  },
  AVERAGE_RATING: {
    key: "AVERAGE_RATING",
    label: "Average Rating",
    domain: "REPUTATION",
    unit: "RATING_STARS",
    source: "GOOGLE_BUSINESS_REVIEWS",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Average star rating of reviews received.",
  },
  REVIEWS_REPLIED: {
    key: "REVIEWS_REPLIED",
    label: "Reviews Replied",
    domain: "REPUTATION",
    unit: "COUNT",
    source: "GBP_REVIEW_REPLIES",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Number of reviews with approved merchant replies.",
  },
  REVIEW_REPLY_RATE: {
    key: "REVIEW_REPLY_RATE",
    label: "Review Reply Rate",
    domain: "REPUTATION",
    unit: "PERCENTAGE",
    source: "DERIVED",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Percentage of received reviews replied to.",
  },

  // --- LEADS DOMAIN ---
  TOTAL_LEADS: {
    key: "TOTAL_LEADS",
    label: "Total Inbound Leads",
    domain: "LEADS",
    unit: "COUNT",
    source: "LEAD_PIPELINE",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Total leads ingested across all channels.",
  },
  QUALIFIED_LEADS: {
    key: "QUALIFIED_LEADS",
    label: "Qualified Leads",
    domain: "LEADS",
    unit: "COUNT",
    source: "LEAD_PIPELINE",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Leads meeting qualification criteria.",
  },
  WON_LEADS: {
    key: "WON_LEADS",
    label: "Won Leads / Clients",
    domain: "LEADS",
    unit: "COUNT",
    source: "LEAD_PIPELINE",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Leads successfully converted into paying clients.",
  },
  LEAD_CONVERSION_RATE: {
    key: "LEAD_CONVERSION_RATE",
    label: "Lead Conversion Rate",
    domain: "LEADS",
    unit: "PERCENTAGE",
    source: "DERIVED",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Percentage of total leads converted to Won status.",
  },

  // --- WHATSAPP DOMAIN ---
  WHATSAPP_CONVERSATIONS: {
    key: "WHATSAPP_CONVERSATIONS",
    label: "WhatsApp Conversations",
    domain: "WHATSAPP",
    unit: "COUNT",
    source: "WHATSAPP_CLOUD",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "NOT_CONFIGURED",
    description: "Inbound customer messaging conversations initiated.",
  },
  FOLLOWUPS_SENT: {
    key: "FOLLOWUPS_SENT",
    label: "Follow-Ups Sent",
    domain: "WHATSAPP",
    unit: "COUNT",
    source: "WHATSAPP_FOLLOWUP_SEQUENCES",
    desiredDirection: "NEUTRAL",
    missingDataPolicy: "ZERO",
    description: "Automated manager-approved follow-up messages dispatched.",
  },
  RESPONSES_AFTER_FOLLOWUP: {
    key: "RESPONSES_AFTER_FOLLOWUP",
    label: "Responses After Follow-Up",
    domain: "WHATSAPP",
    unit: "COUNT",
    source: "WHATSAPP_FOLLOWUP_SEQUENCES",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Customer replies received following a follow-up dispatch.",
  },

  // --- OPERATIONS DOMAIN ---
  SLA_COMPLIANCE_RATE: {
    key: "SLA_COMPLIANCE_RATE",
    label: "SLA Compliance Rate",
    domain: "OPERATIONS",
    unit: "PERCENTAGE",
    source: "INBOX_SLA",
    desiredDirection: "HIGHER_BETTER",
    missingDataPolicy: "ZERO",
    description: "Percentage of inbox items resolved within SLA deadlines.",
  },
};

class ReportingMetricRegistry {
  getDefinition(key) {
    return METRICS[key] || null;
  }

  getAllDefinitions() {
    return Object.values(METRICS);
  }
}

module.exports = new ReportingMetricRegistry();
