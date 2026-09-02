import React, { useId } from "react";

export type PosterLayoutTheme =
  | "gold_luxury"
  | "modern_glass"
  | "festive_divine"
  | "bold_commercial"
  | "clinical_teal";

export type PosterBadgeStyle = "ribbon" | "pill" | "corner" | "minimal";

export interface CreativePosterCanvasProps {
  bgImageUrl?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  offerText?: string | null;
  ctaText?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  secondaryColor?: string | null;
  phone?: string | null;
  website?: string | null;
  locationName?: string | null;
  showLogo?: boolean;
  logoScale?: number;
  logoUrl?: string | null;
  logoBgStyle?: "pill" | "transparent" | "gold" | "dark" | string;
  brandName?: string | null;
  layoutTheme?: PosterLayoutTheme | string;
  badgeStyle?: PosterBadgeStyle | string;
  className?: string;
  svgRef?: React.Ref<SVGSVGElement>;
  idPrefix?: string;
}

const DEFAULT_BG = "https://images.unsplash.com/photo-1567591414240-e14b3017cfc9?q=80&w=1080";

export const CreativePosterCanvas: React.FC<CreativePosterCanvasProps> = ({
  bgImageUrl,
  headline,
  subheadline,
  offerText,
  ctaText,
  primaryColor = "#78350F",
  accentColor = "#F59E0B",
  secondaryColor = "#FEF3C7",
  phone = "+91 98765 43214",
  website = "",
  locationName = "Flagship HQ",
  showLogo = true,
  logoScale = 1.0,
  logoUrl,
  logoBgStyle = "pill",
  brandName = "CLIENT BRAND",
  layoutTheme = "gold_luxury",
  badgeStyle = "ribbon",
  className = "w-full h-full select-none",
  svgRef,
  idPrefix,
}) => {
  const autoId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const prefix = idPrefix || `poster_${autoId}`;

  const topScrimId = `${prefix}_topScrimGrad`;
  const bottomScrimId = `${prefix}_bottomScrimGrad`;
  const accentGradId = `${prefix}_studioAccentGrad`;
  const goldGradId = `${prefix}_goldGrad`;
  const shadowFilterId = `${prefix}_studioDropShadow`;
  const textGlowId = `${prefix}_textGlow`;
  const glassCardId = `${prefix}_glassCardGrad`;

  const resolvedBg = bgImageUrl && !bgImageUrl.startsWith("data:image/svg") ? bgImageUrl : DEFAULT_BG;
  const resolvedHeadline = headline || "FESTIVE CELEBRATION & EXCLUSIVE OFFER";
  const resolvedSubheadline = subheadline || "Premium commercial ad visual and celebration campaign.";
  const resolvedOffer = offerText || "SPECIAL LIMITED OFFER";
  const resolvedCta = ctaText || "Connect With Us";
  const resolvedPrimary = primaryColor || "#78350F";
  const resolvedAccent = accentColor || "#F59E0B";

  // Determine theme styling accents
  const isGoldLuxury = layoutTheme === "gold_luxury";
  const isFestive = layoutTheme === "festive_divine";
  const isCommercial = layoutTheme === "bold_commercial";
  const isClinical = layoutTheme === "clinical_teal";
  const isModernGlass = layoutTheme === "modern_glass" || (!isGoldLuxury && !isFestive && !isCommercial && !isClinical);

  // Dynamic theme colors
  const ctaBgColor = isClinical ? "#0D9488" : isFestive ? "#EA580C" : isCommercial ? "#E11D48" : resolvedAccent;
  const ctaTextColor = isClinical ? "#FFFFFF" : isFestive ? "#FFFFFF" : isCommercial ? "#FFFFFF" : "#0F172A";
  const offerRibbonGrad = isFestive
    ? ["#F97316", "#C2410C"]
    : isCommercial
    ? ["#F43F5E", "#BE123C"]
    : isClinical
    ? ["#14B8A6", "#0F766E"]
    : [resolvedAccent, "#D97706"];

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1080 1080"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Top Scrim Gradient */}
        <linearGradient id={topScrimId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity={isClinical ? "0.70" : "0.85"} />
          <stop offset="60%" stopColor="#000000" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
        </linearGradient>

        {/* Bottom Scrim Gradient */}
        <linearGradient id={bottomScrimId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.0" />
          <stop offset="30%" stopColor="#000000" stopOpacity="0.60" />
          <stop offset="70%" stopColor={isClinical ? "#042F2E" : "#020617"} stopOpacity="0.92" />
          <stop offset="100%" stopColor={isClinical ? "#021A1A" : "#020617"} stopOpacity="0.99" />
        </linearGradient>

        {/* Dynamic Accent Gradient */}
        <linearGradient id={accentGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={offerRibbonGrad[0]} />
          <stop offset="100%" stopColor={offerRibbonGrad[1]} />
        </linearGradient>

        {/* Luxury Gold Gradient */}
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#FFF1B8" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>

        {/* Glass Card Gradient */}
        <linearGradient id={glassCardId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.04" />
        </linearGradient>

        {/* Drop Shadows */}
        <filter id={shadowFilterId} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodOpacity="0.65" />
        </filter>
        <filter id={textGlowId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000000" floodOpacity="0.95" />
        </filter>
      </defs>

      {/* 1. Full-Bleed 1080x1080 Edge-to-Edge AI Hero Artwork */}
      <image
        href={resolvedBg}
        x="0"
        y="0"
        width="1080"
        height="1080"
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Decorative Theme Frame Overlay */}
      {isFestive && (
        <rect
          x="18"
          y="18"
          width="1044"
          height="1044"
          rx="16"
          fill="none"
          stroke={`url(#${goldGradId})`}
          strokeWidth="3"
          opacity="0.75"
        />
      )}

      {/* 2. Top Header Gradient Scrim */}
      <rect width="1080" height="220" fill={`url(#${topScrimId})`} />

      {/* 3. Bottom Typography Gradient Scrim */}
      <rect y="460" width="1080" height="620" fill={`url(#${bottomScrimId})`} />

      {/* Top Header: Brand Logo & Verified Identity Badge */}
      {showLogo && (
        <g transform="translate(48, 40)">
          {logoBgStyle !== "transparent" && (
            <rect
              width={280 * logoScale}
              height={66 * logoScale}
              rx="18"
              fill={
                logoBgStyle === "gold"
                  ? "url(#" + goldGradId + ")"
                  : logoBgStyle === "dark"
                  ? "#0F172A"
                  : isClinical
                  ? "#FFFFFF"
                  : isFestive
                  ? "#FEF3C7"
                  : secondaryColor || "#0F172A"
              }
              opacity={logoBgStyle === "gold" ? "0.98" : isClinical ? "0.96" : "0.98"}
              stroke={
                logoBgStyle === "gold" || isFestive
                  ? `url(#${goldGradId})`
                  : "rgba(255,255,255,0.2)"
              }
              strokeWidth="1.5"
              filter={`url(#${shadowFilterId})`}
            />
          )}
          {logoUrl ? (
            <image
              href={logoUrl}
              x={logoBgStyle === "transparent" ? 0 : 12 * logoScale}
              y={logoBgStyle === "transparent" ? 0 : 8 * logoScale}
              width={(logoBgStyle === "transparent" ? 280 : 256) * logoScale}
              height={(logoBgStyle === "transparent" ? 66 : 50) * logoScale}
              preserveAspectRatio="xMidYMid meet"
              filter={logoBgStyle === "transparent" ? `url(#${shadowFilterId})` : undefined}
            />
          ) : (
            <text
              x={140 * logoScale}
              y={42 * logoScale}
              fill={
                logoBgStyle === "gold"
                  ? "#78350F"
                  : isClinical
                  ? "#0F766E"
                  : isFestive
                  ? "#9A3412"
                  : "#FFFFFF"
              }
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize={18 * logoScale}
              fontWeight="900"
              textAnchor="middle"
              letterSpacing="0.8"
              filter={logoBgStyle === "transparent" ? `url(#${textGlowId})` : undefined}
            >
              {(brandName || "BRAND LOGO").toUpperCase()}
            </text>
          )}
        </g>
      )}

      {/* Top Right: Verified Brand Location Tag */}
      {locationName && (
        <g transform="translate(730, 44)">
          <rect
            width="300"
            height="46"
            rx="23"
            fill="#000000"
            opacity="0.82"
            stroke={isFestive ? `url(#${goldGradId})` : "rgba(255,255,255,0.25)"}
            strokeWidth="1"
          />
          <text
            x="150"
            y="29"
            fill="#FFFFFF"
            fontFamily="system-ui, sans-serif"
            fontSize="13"
            fontWeight="800"
            textAnchor="middle"
            letterSpacing="1"
          >
            📍 {locationName.toUpperCase()}
          </text>
        </g>
      )}

      {/* Promotional Offer Ribbon Badge */}
      {resolvedOffer && (
        <g transform="translate(130, 635)">
          <rect
            width="820"
            height="62"
            rx="31"
            fill={`url(#${accentGradId})`}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            filter={`url(#${shadowFilterId})`}
          />
          <text
            x="410"
            y="40"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="23"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="2.5"
          >
            ★ {resolvedOffer.toUpperCase()} ★
          </text>
        </g>
      )}

      {/* Main Typographic Headline */}
      <text
        x="540"
        y="758"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="44"
        fontWeight="900"
        textAnchor="middle"
        letterSpacing="0.6"
        filter={`url(#${textGlowId})`}
      >
        {resolvedHeadline.toUpperCase()}
      </text>

      {/* Supporting Line / Subtitle */}
      {resolvedSubheadline && (
        <text
          x="540"
          y="814"
          fill="#F1F5F9"
          fontFamily="system-ui, sans-serif"
          fontSize="21"
          fontWeight="600"
          textAnchor="middle"
          filter={`url(#${textGlowId})`}
        >
          {resolvedSubheadline}
        </text>
      )}

      {/* CTA Pill Button */}
      {resolvedCta && (
        <g transform="translate(360, 856)">
          <rect
            width="360"
            height="66"
            rx="33"
            fill={ctaBgColor}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            filter={`url(#${shadowFilterId})`}
          />
          <text
            x="180"
            y="42"
            fill={ctaTextColor}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="21"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="1.2"
          >
            {resolvedCta.toUpperCase()} →
          </text>
        </g>
      )}

      {/* Bottom Footer: Verified Contact Pill (Phone + Website) */}
      {(phone || website) && (
        <g transform="translate(70, 946)">
          <rect
            width="940"
            height="78"
            rx="28"
            fill="#020617"
            opacity="0.95"
            stroke={isFestive ? `url(#${goldGradId})` : "rgba(255,255,255,0.25)"}
            strokeWidth="1.5"
            filter={`url(#${shadowFilterId})`}
          />
          {phone && (
            <text
              x={website ? "70" : "470"}
              y="48"
              fill="#FFFFFF"
              fontFamily="system-ui, sans-serif"
              fontSize="19"
              fontWeight="800"
              letterSpacing="0.5"
              textAnchor={website ? "start" : "middle"}
            >
              📞 {phone}
            </text>
          )}
          {website && (
            <text
              x={phone ? "520" : "470"}
              y="48"
              fill="#38BDF8"
              fontFamily="system-ui, sans-serif"
              fontSize="19"
              fontWeight="800"
              letterSpacing="0.5"
              textAnchor={phone ? "start" : "middle"}
            >
              🌐 {website}
            </text>
          )}
        </g>
      )}
    </svg>
  );
};

