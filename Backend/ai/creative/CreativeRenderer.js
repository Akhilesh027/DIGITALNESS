/**
 * CreativeRenderer.js
 * Deterministic Server-Side Creative Composition & Rendering Engine
 * 
 * Combines generated hero visuals with exact brand logos, phone numbers,
 * addresses, headlines, CTA buttons, and verified color palettes.
 */

class CreativeRenderer {
  /**
   * Renders a 1080x1080 commercial advertising poster.
   */
  async renderPoster({
    heroImageUrl,
    brandContext = {},
    blueprint = {},
    renderOptions = {},
  }) {
    const width = 1080;
    const height = 1080;

    const brandName = brandContext.brandName || brandContext.name || "ApexBee Technologies";
    const locationName = brandContext.locationName || brandContext.city || "Hyderabad";
    const phone = brandContext.phone || "9988776655";
    const website = brandContext.website || "";
    const address = brandContext.address || "Hitech City, Hyderabad";
    const logoUrl = brandContext.logoUrl || null;

    // Color Palette with revision overrides
    const primaryColor = renderOptions.primaryColorOverride || blueprint.colors?.primary || brandContext.primaryColor || "#0F172A";
    const secondaryColor = blueprint.colors?.secondary || brandContext.secondaryColor || "#F8FAFC";
    const accentColor = renderOptions.accentColorOverride || blueprint.colors?.accent || brandContext.accentColor || "#F59E0B";

    const headline = blueprint.headline || "TRANSFORM YOUR BUSINESS WITH APEXBEE";
    const supportingText = blueprint.supportingText || blueprint.subheadline || "Intelligent Automation & Digital Growth Engineered For You";
    const offerText = blueprint.offerText || blueprint.offer || "";
    const ctaText = blueprint.ctaText || blueprint.CTA || "Get Started Today";

    // Revision scales
    const logoScale = renderOptions.logoScale || 1.0;
    const heroScale = renderOptions.heroScale || 1.0;

    // Safe XML escapes
    const escapeXml = (str) =>
      String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const safeBrand = escapeXml(brandName);
    const safeHeadline = escapeXml(headline);
    const safeSupporting = escapeXml(supportingText);
    const safeOffer = escapeXml(offerText);
    const safeCta = escapeXml(ctaText);
    const safePhone = escapeXml(phone);
    const safeWebsite = escapeXml(website);
    const safeLocation = escapeXml(locationName);

    // Dynamic hero visual coordinates based on scale
    const heroWidth = Math.round(760 * heroScale);
    const heroHeight = Math.round(560 * heroScale);
    const heroX = Math.round((width - heroWidth) / 2);
    const heroY = 90;

    // Logo badge dimensions based on scale
    const logoBadgeWidth = Math.round(280 * logoScale);
    const logoBadgeHeight = Math.round(68 * logoScale);
    const logoFontSize = Math.round(20 * logoScale);

    const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="topScrim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#000000" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="bottomScrim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.0"/>
      <stop offset="35%" stop-color="#000000" stop-opacity="0.65"/>
      <stop offset="75%" stop-color="#000000" stop-opacity="0.90"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="accentBadge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-opacity="0.55"/>
    </filter>
    <filter id="textGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- 1. Full-Bleed 1080x1080 Edge-to-Edge AI Hero Artwork -->
  <image href="${heroImageUrl}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="xMidYMid slice"/>

  <!-- 2. Top Header Gradient Scrim -->
  <rect width="1080" height="200" fill="url(#topScrim)"/>

  <!-- 3. Bottom Typography Gradient Scrim -->
  <rect y="480" width="1080" height="600" fill="url(#bottomScrim)"/>

  <!-- Top Header: Brand Logo / Identity Badge -->
  <g transform="translate(50, 42)">
    <rect width="${logoBadgeWidth}" height="${logoBadgeHeight}" rx="16" fill="${secondaryColor}" opacity="0.98" filter="url(#cardShadow)"/>
    ${
      logoUrl
        ? `<image href="${logoUrl}" x="12" y="10" width="${logoBadgeWidth - 24}" height="${logoBadgeHeight - 20}" preserveAspectRatio="xMidYMid meet"/>`
        : `<text x="${logoBadgeWidth / 2}" y="${logoBadgeHeight / 2 + 7}" font-family="'Poppins', 'Segoe UI', sans-serif" font-size="${logoFontSize}" font-weight="800" fill="${primaryColor}" text-anchor="middle">${safeBrand.toUpperCase()}</text>`
    }
  </g>

  <!-- Top Right: Branch / Location Tag -->
  <g transform="translate(740, 46)">
    <rect width="290" height="44" rx="22" fill="#000000" opacity="0.80" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <text x="145" y="28" font-family="'Poppins', 'Segoe UI', sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">📍 ${safeLocation.toUpperCase()}</text>
  </g>

  <!-- Promotional Offer Ribbon Badge -->
  ${
    safeOffer && !safeOffer.includes("None")
      ? `
  <g transform="translate(140, 640)">
    <rect width="800" height="58" rx="29" fill="url(#accentBadge)" filter="url(#cardShadow)"/>
    <text x="400" y="37" font-family="'Poppins', sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">★ ${safeOffer.toUpperCase()} ★</text>
  </g>`
      : ""
  }

  <!-- Main Typographic Headline -->
  <text x="540" y="760" font-family="'Playfair Display', Georgia, serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5" filter="url(#textGlow)">
    ${safeHeadline.toUpperCase()}
  </text>

  <!-- Supporting Line / Subtitle -->
  <text x="540" y="815" font-family="'Poppins', sans-serif" font-size="20" font-weight="600" fill="#F1F5F9" text-anchor="middle" filter="url(#textGlow)">
    ${safeSupporting}
  </text>

  <!-- Call to Action Button -->
  <g transform="translate(370, 855)">
    <rect width="340" height="64" rx="32" fill="${accentColor}" filter="url(#cardShadow)"/>
    <text x="170" y="40" font-family="'Poppins', sans-serif" font-size="20" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="1">${safeCta.toUpperCase()} →</text>
  </g>

  <!-- Bottom Footer: Verified Contact Pill (Phone + Website) -->
  ${(phone || website) ? `
  <g transform="translate(80, 945)">
    <rect width="920" height="76" rx="26" fill="#020617" opacity="0.94" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    ${phone ? `<text x="${website ? '70' : '460'}" y="46" font-family="'Poppins', sans-serif" font-size="18" font-weight="700" fill="#FFFFFF" ${!website ? 'text-anchor="middle"' : ''}>
      📞 ${safePhone}
    </text>` : ''}
    ${website ? `<text x="${phone ? '500' : '460'}" y="46" font-family="'Poppins', sans-serif" font-size="18" font-weight="700" fill="#38BDF8" ${!phone ? 'text-anchor="middle"' : ''}>
      🌐 ${safeWebsite}
    </text>` : ''}
  </g>` : ''}
</svg>`;

    const svgBuffer = Buffer.from(svgTemplate, "utf8");
    const svgBase64 = svgBuffer.toString("base64");
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return {
      success: true,
      format: "SVG",
      width,
      height,
      aspectRatio: "1:1",
      svgString: svgTemplate,
      buffer: svgBuffer,
      dataUrl,
      renderMeta: {
        primaryColor,
        secondaryColor,
        accentColor,
        logoScale,
        heroScale,
        renderedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = new CreativeRenderer();
