/**
 * festivalService.js
 * Calendar intelligence for Indian Festivals, National Days, Commercial & Cultural Events.
 */

const FESTIVAL_DATABASE = [
  // January
  { slug: "new-year", name: "New Year's Day", month: 1, day: 1, categories: ["COMMERCIAL", "CULTURAL"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "makar-sankranti-pongal", name: "Makar Sankranti & Pongal", month: 1, day: 14, categories: ["CULTURAL", "RELIGIOUS"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "republic-day", name: "Indian Republic Day", month: 1, day: 26, categories: ["NATIONAL"], industries: ["ALL"], contentPotential: "CRITICAL" },

  // February
  { slug: "valentines-week", name: "Valentine's Week & Day", month: 2, day: 14, categories: ["COMMERCIAL", "CULTURAL"], industries: ["SALON", "HOSPITALITY", "RETAIL", "SPA"], contentPotential: "HIGH" },

  // March
  { slug: "womens-day", name: "International Women's Day", month: 3, day: 8, categories: ["INTERNATIONAL_DAY", "COMMERCIAL"], industries: ["ALL"], contentPotential: "CRITICAL" },
  { slug: "maha-shivaratri", name: "Maha Shivaratri", month: 3, day: 8, categories: ["RELIGIOUS"], industries: ["ALL"], contentPotential: "MEDIUM" },
  { slug: "holi", name: "Holi - Festival of Colors", month: 3, day: 25, categories: ["CULTURAL", "RELIGIOUS"], industries: ["ALL"], contentPotential: "HIGH" },

  // April
  { slug: "ugadi-gudi-padwa", name: "Ugadi / Gudi Padwa (New Year)", month: 4, day: 9, categories: ["CULTURAL", "RELIGIOUS"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "eid-ul-fitr", name: "Eid-ul-Fitr", month: 4, day: 11, categories: ["RELIGIOUS"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "earth-day", name: "World Earth Day", month: 4, day: 22, categories: ["INTERNATIONAL_DAY"], industries: ["ALL"], contentPotential: "MEDIUM" },

  // May
  { slug: "mothers-day", name: "Mother's Day", month: 5, day: 12, categories: ["COMMERCIAL", "CULTURAL"], industries: ["SALON", "HOSPITALITY", "RETAIL", "HEALTHCARE"], contentPotential: "HIGH" },

  // June
  { slug: "environment-day", name: "World Environment Day", month: 6, day: 5, categories: ["INTERNATIONAL_DAY"], industries: ["ALL"], contentPotential: "MEDIUM" },
  { slug: "fathers-day", name: "Father's Day", month: 6, day: 16, categories: ["COMMERCIAL", "CULTURAL"], industries: ["SALON", "HOSPITALITY", "RETAIL"], contentPotential: "HIGH" },
  { slug: "yoga-day", name: "International Yoga Day", month: 6, day: 21, categories: ["INTERNATIONAL_DAY"], industries: ["SALON", "SPA", "HEALTHCARE", "FITNESS"], contentPotential: "HIGH" },

  // July
  { slug: "doctors-day", name: "National Doctor's Day", month: 7, day: 1, categories: ["COMMERCIAL"], industries: ["HEALTHCARE"], contentPotential: "HIGH" },
  { slug: "world-chocolate-day", name: "World Chocolate Day", month: 7, day: 7, categories: ["COMMERCIAL"], industries: ["HOSPITALITY", "BAKERY", "CAFE"], contentPotential: "HIGH" },

  // August
  { slug: "friendship-day", name: "Friendship Day", month: 8, day: 4, categories: ["COMMERCIAL", "CULTURAL"], industries: ["SALON", "HOSPITALITY", "RETAIL"], contentPotential: "HIGH" },
  { slug: "independence-day", name: "Indian Independence Day", month: 8, day: 15, categories: ["NATIONAL"], industries: ["ALL"], contentPotential: "CRITICAL" },
  { slug: "raksha-bandhan", name: "Raksha Bandhan", month: 8, day: 19, categories: ["CULTURAL", "RELIGIOUS"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "janmashtami", name: "Krishna Janmashtami", month: 8, day: 26, categories: ["RELIGIOUS"], industries: ["ALL"], contentPotential: "HIGH" },

  // September
  { slug: "teachers-day", name: "National Teachers' Day", month: 9, day: 5, categories: ["NATIONAL", "CULTURAL"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "ganesh-chaturthi", name: "Ganesh Chaturthi", month: 9, day: 7, categories: ["CULTURAL", "RELIGIOUS"], industries: ["ALL"], contentPotential: "CRITICAL" },
  { slug: "onam", name: "Onam Festival", month: 9, day: 15, categories: ["CULTURAL"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "tourism-day", name: "World Tourism Day", month: 9, day: 27, categories: ["INTERNATIONAL_DAY"], industries: ["HOSPITALITY", "TRAVEL"], contentPotential: "HIGH" },

  // October
  { slug: "gandhi-jayanti", name: "Gandhi Jayanti", month: 10, day: 2, categories: ["NATIONAL"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "navratri-dussehra", name: "Navratri & Vijaya Dashami (Dussehra)", month: 10, day: 12, categories: ["CULTURAL", "RELIGIOUS"], industries: ["ALL"], contentPotential: "CRITICAL" },
  { slug: "karwa-chauth", name: "Karwa Chauth", month: 10, day: 20, categories: ["CULTURAL", "RELIGIOUS"], industries: ["SALON", "SPA", "JEWELRY"], contentPotential: "HIGH" },
  { slug: "diwali", name: "Diwali - Deepavali & Dhanteras", month: 10, day: 31, categories: ["CULTURAL", "RELIGIOUS", "COMMERCIAL"], industries: ["ALL"], contentPotential: "CRITICAL" },

  // November
  { slug: "childrens-day", name: "Children's Day", month: 11, day: 14, categories: ["NATIONAL"], industries: ["ALL"], contentPotential: "HIGH" },
  { slug: "black-friday", name: "Black Friday & Cyber Monday Sale", month: 11, day: 29, categories: ["COMMERCIAL"], industries: ["RETAIL", "E_COMMERCE", "SALON", "FURNITURE"], contentPotential: "HIGH" },

  // December
  { slug: "christmas", name: "Christmas Eve & Christmas Day", month: 12, day: 25, categories: ["RELIGIOUS", "COMMERCIAL"], industries: ["ALL"], contentPotential: "CRITICAL" },
  { slug: "new-years-eve", name: "New Year's Eve Celebrations", month: 12, day: 31, categories: ["COMMERCIAL", "CULTURAL"], industries: ["ALL"], contentPotential: "CRITICAL" },
];

class FestivalService {
  /**
   * Retrieves all festivals occurring within a given date range.
   */
  getFestivalsBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const matches = [];
    const currentYear = start.getFullYear();

    for (const f of FESTIVAL_DATABASE) {
      // Build candidate date in start year (and next year if span crosses Dec/Jan)
      const candidateDate = new Date(currentYear, f.month - 1, f.day);

      if (candidateDate >= start && candidateDate <= end) {
        matches.push({
          ...f,
          date: candidateDate,
          year: currentYear,
        });
      }
    }

    return matches.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Retrieves upcoming festivals within N days.
   */
  getUpcomingFestivals(days = 30) {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    return this.getFestivalsBetween(start, end);
  }

  /**
   * Scores festival relevance for a specific client (0-100).
   */
  scoreFestivalForClient({ festival, clientIndustry = "GENERAL" }) {
    let score = 50;
    const indUpper = String(clientIndustry || "").toUpperCase();

    // Critical National / Universal Cultural Festivals
    if (festival.categories.includes("NATIONAL")) score += 30;
    if (festival.contentPotential === "CRITICAL") score += 20;

    // Industry Match
    if (festival.industries.includes("ALL") || festival.industries.includes(indUpper)) {
      score += 25;
    } else {
      score -= 20;
    }

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = new FestivalService();
