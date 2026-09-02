/**
 * WhatsAppMenuRouter.js
 * Deterministic routing for stable interactive button and list options.
 * Prevents arbitrary button payloads from invoking unexpected internal behaviors.
 */

const STABLE_MENU_OPTIONS = {
  wa_menu_book_consultation_v1: {
    intent: "BOOK_APPOINTMENT",
    label: "Book Consultation",
    requiresHuman: false,
    responseAction: "SHOW_BOOKING_SLOTS",
    defaultReply: "We would love to arrange your consultation! Please let us know your preferred day and time (e.g. Tomorrow 11 AM).",
  },
  wa_menu_get_pricing_v1: {
    intent: "PRICE_INQUIRY",
    label: "Get Pricing",
    requiresHuman: false,
    responseAction: "SHOW_SERVICE_PRICING",
    defaultReply: "Our service packages start from ₹1,999. Which specific service are you interested in?",
  },
  wa_menu_services_v1: {
    intent: "SERVICES_LIST",
    label: "Our Services",
    requiresHuman: false,
    responseAction: "SHOW_SERVICES_CATALOG",
    defaultReply: "We offer end-to-end premium services including consultations, customized packages, and expert care. Reply with any service name to learn more.",
  },
  wa_menu_location_v1: {
    intent: "LOCATION_HOURS",
    label: "Branch & Hours",
    requiresHuman: false,
    responseAction: "SHOW_LOCATION_DETAILS",
    defaultReply: "We are open Monday to Saturday, 9:00 AM – 8:00 PM. Would you like our exact Google Maps location?",
  },
  wa_menu_talk_human_v1: {
    intent: "TALK_TO_HUMAN",
    label: "Talk to Human",
    requiresHuman: true,
    responseAction: "ESCALATE_HUMAN_HANDOFF",
    defaultReply: "A member of our team has been notified and will assist you shortly.",
  },
};

class WhatsAppMenuRouter {
  /**
   * Resolves an interactive button or list reply ID
   */
  resolveMenuOption(optionId) {
    if (!optionId || typeof optionId !== "string") {
      return {
        isKnown: false,
        intent: "UNKNOWN",
        error: "WHATSAPP_MENU_OPTION_UNKNOWN",
      };
    }

    const matched = STABLE_MENU_OPTIONS[optionId.trim()];
    if (!matched) {
      return {
        isKnown: false,
        intent: "UNKNOWN",
        optionId,
        error: "WHATSAPP_MENU_OPTION_UNKNOWN",
      };
    }

    return {
      isKnown: true,
      optionId,
      ...matched,
    };
  }

  /**
   * Generates standard 3-button interactive message structure for Meta Cloud API
   */
  generateWelcomeButtons(bodyText = "Welcome to our business! How can we help you today?") {
    return {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "wa_menu_book_consultation_v1",
              title: "Book Consultation",
            },
          },
          {
            type: "reply",
            reply: {
              id: "wa_menu_get_pricing_v1",
              title: "Get Pricing",
            },
          },
          {
            type: "reply",
            reply: {
              id: "wa_menu_talk_human_v1",
              title: "Talk to Human",
            },
          },
        ],
      },
    };
  }

  /**
   * Returns all stable menu definitions
   */
  getAllOptions() {
    return { ...STABLE_MENU_OPTIONS };
  }
}

module.exports = new WhatsAppMenuRouter();
