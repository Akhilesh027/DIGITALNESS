/**
 * GoogleAdsCreativeQAGuardian.js
 * Validates Responsive Search Ad (RSA) Copy Limits, Headlines, Descriptions, and Destination URLs
 */

class GoogleAdsCreativeQAGuardian {
  /**
   * Validates Responsive Search Ad structure against Google Ads API v25 constraints
   */
  validateResponsiveSearchAd({
    headlines = [],
    descriptions = [],
    finalUrls = [],
    path1 = "",
    path2 = "",
    clientDomain = null,
  }) {
    const issues = [];

    // 1. Headlines Validation (Minimum 3, Max 30 chars each)
    if (!Array.isArray(headlines) || headlines.length < 3) {
      issues.push(`Headlines: Minimum 3 headlines required (found ${headlines?.length || 0}).`);
    } else {
      headlines.forEach((h, i) => {
        const text = typeof h === "string" ? h : h?.text || "";
        if (!text || text.length > 30) {
          issues.push(`Headline ${i + 1}: Exceeds 30 character limit (${text.length} chars: "${text}").`);
        }
      });
    }

    // 2. Descriptions Validation (Minimum 2, Max 90 chars each)
    if (!Array.isArray(descriptions) || descriptions.length < 2) {
      issues.push(`Descriptions: Minimum 2 descriptions required (found ${descriptions?.length || 0}).`);
    } else {
      descriptions.forEach((d, i) => {
        const text = typeof d === "string" ? d : d?.text || "";
        if (!text || text.length > 90) {
          issues.push(`Description ${i + 1}: Exceeds 90 character limit (${text.length} chars).`);
        }
      });
    }

    // 3. Final URLs Validation (Minimum 1, Must be HTTPS)
    if (!Array.isArray(finalUrls) || finalUrls.length === 0) {
      issues.push("Final URLs: At least one destination URL is required.");
    } else {
      finalUrls.forEach((url, i) => {
        if (!url || !url.startsWith("https://")) {
          issues.push(`Final URL ${i + 1}: Must be a valid secure HTTPS URL ("${url}").`);
        } else if (clientDomain) {
          const cleanDomain = clientDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
          const cleanUrlDomain = url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
          if (!cleanUrlDomain.includes(cleanDomain)) {
            const err = new Error(
              `DESTINATION_CLIENT_MISMATCH: Final URL domain '${cleanUrlDomain}' does not match client domain '${cleanDomain}'.`
            );
            err.code = "DESTINATION_CLIENT_MISMATCH";
            throw err;
          }
        }
      });
    }

    // 4. Display Paths Validation (Max 15 chars each)
    if (path1 && path1.length > 15) {
      issues.push(`Path 1 exceeds 15 characters ("${path1}").`);
    }
    if (path2 && path2.length > 15) {
      issues.push(`Path 2 exceeds 15 characters ("${path2}").`);
    }

    if (issues.length > 0) {
      const err = new Error(`GOOGLE_ADS_CREATIVE_VALIDATION_FAILED: ${issues.join("; ")}`);
      err.code = "GOOGLE_ADS_CREATIVE_VALIDATION_FAILED";
      err.issues = issues;
      throw err;
    }

    return {
      passed: true,
      headlines: headlines.map((h) => (typeof h === "string" ? { text: h } : h)),
      descriptions: descriptions.map((d) => (typeof d === "string" ? { text: d } : d)),
      finalUrls,
      path1,
      path2,
    };
  }
}

module.exports = new GoogleAdsCreativeQAGuardian();
