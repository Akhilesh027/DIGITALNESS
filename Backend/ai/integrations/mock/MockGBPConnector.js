/**
 * MockGBPConnector.js
 * Test adapter simulating Google Business Profile Local Post publishing.
 */

exports.publishPost = async ({ credentialContext, payload }) => {
  console.log(`[MockGBPConnector] Simulating GBP Local Post on location: ${credentialContext.platformAccountId}`);

  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    success: true,
    mock: true,
    platform: "GoogleBusiness",
    externalId: `mock_gbp_post_${Date.now()}`,
    locationId: credentialContext.platformAccountId,
    publishedAt: new Date().toISOString(),
  };
};
