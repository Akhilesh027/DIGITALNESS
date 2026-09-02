/**
 * MockInstagramConnector.js
 * Test adapter simulating Instagram Graph API publishing for Step 4 queue verification.
 */

exports.publishPost = async ({ credentialContext, payload }) => {
  console.log(`[MockInstagramConnector] Simulating IG Post publish for account: ${credentialContext.platformAccountId}`);

  // Simulate network processing
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    success: true,
    mock: true,
    platform: "Instagram",
    externalId: `mock_ig_post_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    permalink: `https://instagram.com/p/mock_${Date.now()}`,
    publishedAt: new Date().toISOString(),
  };
};
