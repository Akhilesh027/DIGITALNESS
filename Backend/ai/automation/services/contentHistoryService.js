/**
 * contentHistoryService.js
 * Analyzes previous content, topics, and visual concepts to prevent duplicate or repetitive ideas.
 */

const ContentCalendar = require("../../../models/ContentCalendar");

class ContentHistoryService {
  /**
   * Fetches recent headlines and occasions used by this client over the last N days.
   */
  async getRecentHistory(clientId, limit = 50) {
    const recentCalendars = await ContentCalendar.find({ clientId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const usedHeadlines = [];
    const usedOccasions = [];

    for (const cal of recentCalendars) {
      for (const item of cal.items || []) {
        if (item.headline) usedHeadlines.push(item.headline.toLowerCase());
        if (item.occasion) usedOccasions.push(item.occasion.toLowerCase());
      }
    }

    return {
      usedHeadlines,
      usedOccasions,
    };
  }

  /**
   * Checks if a candidate concept or headline is too similar to recent posts.
   * Returns similarity percentage (0-100%).
   */
  checkSimilarity(candidateText, historyList = []) {
    if (!candidateText || historyList.length === 0) return 0;

    const candWords = new Set(candidateText.toLowerCase().split(/\s+/));
    let maxOverlap = 0;

    for (const past of historyList) {
      const pastWords = past.toLowerCase().split(/\s+/);
      const matchCount = pastWords.filter((w) => candWords.has(w)).length;
      const ratio = Math.round((matchCount / Math.max(candWords.size, pastWords.length)) * 100);
      if (ratio > maxOverlap) maxOverlap = ratio;
    }

    return maxOverlap;
  }
}

module.exports = new ContentHistoryService();
