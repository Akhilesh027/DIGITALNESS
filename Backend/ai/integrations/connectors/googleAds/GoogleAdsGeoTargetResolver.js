/**
 * GoogleAdsGeoTargetResolver.js
 * Resolves Human Location Names into Google Ads Geo Target Constants
 */

const GEO_TARGET_CONSTANTS = {
  hyderabad: { id: "1007788", name: "Hyderabad", canonicalName: "Hyderabad,Telangana,India", countryCode: "IN" },
  bengaluru: { id: "1007768", name: "Bengaluru", canonicalName: "Bengaluru,Karnataka,India", countryCode: "IN" },
  bangalore: { id: "1007768", name: "Bengaluru", canonicalName: "Bengaluru,Karnataka,India", countryCode: "IN" },
  mumbai: { id: "1007785", name: "Mumbai", canonicalName: "Mumbai,Maharashtra,India", countryCode: "IN" },
  delhi: { id: "1007780", name: "Delhi", canonicalName: "Delhi,India", countryCode: "IN" },
  chennai: { id: "1007776", name: "Chennai", canonicalName: "Chennai,Tamil Nadu,India", countryCode: "IN" },
  pune: { id: "1007796", name: "Pune", canonicalName: "Pune,Maharashtra,India", countryCode: "IN" },
  kolkata: { id: "1007782", name: "Kolkata", canonicalName: "Kolkata,West Bengal,India", countryCode: "IN" },
  india: { id: "2356", name: "India", canonicalName: "India", countryCode: "IN" },
};

class GoogleAdsGeoTargetResolver {
  /**
   * Resolves list of location strings into Google Ads geo target resource names
   */
  resolveLocations(locations = ["Hyderabad"]) {
    const resolved = [];

    for (const loc of locations) {
      const clean = String(loc).toLowerCase().trim();
      const match = GEO_TARGET_CONSTANTS[clean];

      if (match) {
        resolved.push({
          criterionId: match.id,
          resourceName: `geoTargetConstants/${match.id}`,
          name: match.name,
          canonicalName: match.canonicalName,
        });
      } else {
        // Safe country-level fallback
        resolved.push({
          criterionId: "2356",
          resourceName: "geoTargetConstants/2356",
          name: "India",
          canonicalName: "India",
        });
      }
    }

    return resolved;
  }
}

module.exports = new GoogleAdsGeoTargetResolver();
