/**
 * CreativeQAGuardian.js
 * Automated Quality Assurance Guardian for Creative Poster Generation
 */

class CreativeQAGuardian {
  /**
   * Evaluates rendered poster output against brand rules and dimensional standards
   */
  validate({ renderResult, brandContext = {}, blueprint = {}, assetMeta = {} }) {
    const warnings = [];
    const errors = [];
    const flags = [];
    let score = 100;

    // 1. Generation Provider Classification Flag
    if (assetMeta.fallback) {
      flags.push("FALLBACK_GENERATION");
      warnings.push(`FALLBACK_VISUAL_USED: ${assetMeta.fallbackReason || "AI Provider fallback active."}`);
      score -= 10;
    } else {
      flags.push("REAL_PROVIDER_GENERATION");
    }

    // 2. Storage Classification Flag
    if (assetMeta.isPublic) {
      flags.push("PUBLIC_ASSET");
    } else {
      flags.push("LOCAL_STORAGE");
      warnings.push("LOCAL_STORAGE_ONLY: Asset is stored locally and is not yet publicly routable to Meta Graph API.");
    }

    // 3. Dimension & Geometry Check
    if (renderResult.width !== 1080 || renderResult.height !== 1080) {
      errors.push(`Invalid dimensions: ${renderResult.width}x${renderResult.height}. Standard 1080x1080 required.`);
      score -= 30;
    }

    // 4. Buffer Integrity Check
    if (!renderResult.buffer || renderResult.buffer.length < 100) {
      errors.push("Rendered buffer is empty or corrupted.");
      score -= 50;
    }

    // 5. Logo Verification
    if (!brandContext.logoUrl) {
      flags.push("LOGO_MISSING");
      warnings.push("LOGO_MISSING: Client does not have an official logo URL. Rendered with clean typographic badge.");
      score -= 5;
    } else {
      flags.push("REAL_CLIENT_LOGO");
    }

    // 6. Headline Presence Check
    if (!blueprint.headline || blueprint.headline.trim().length === 0) {
      errors.push("Missing poster headline in creative blueprint.");
      score -= 20;
    }

    // 7. Contact & Identity Validation
    const svgStr = renderResult.svgString || "";
    if (brandContext.phone && !svgStr.includes(brandContext.phone)) {
      warnings.push("Verified phone number not detected in rendered SVG overlay.");
      score -= 10;
    }

    if (brandContext.website && !svgStr.includes(brandContext.website)) {
      warnings.push("Verified website URL not detected in rendered SVG overlay.");
      score -= 5;
    }

    const passed = errors.length === 0 && score >= 60;
    const publishReady = passed && assetMeta.isPublic;

    if (publishReady) {
      flags.push("PUBLISH_READY");
    } else {
      flags.push("PUBLISH_PENDING_CLOUD_STORAGE");
    }

    return {
      passed,
      publishReady,
      score: Math.max(score, 0),
      flags,
      warnings,
      errors,
      checkedAt: new Date(),
    };
  }
}

module.exports = new CreativeQAGuardian();
