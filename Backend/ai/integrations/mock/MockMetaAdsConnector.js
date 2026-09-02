/**
 * MockMetaAdsConnector.js
 * Test adapter simulating Meta Marketing API campaign creation for Step 4 queue verification.
 */

exports.createCampaign = async ({ credentialContext, payload }) => {
  console.log(`[MockMetaAdsConnector] Simulating Meta Ads Campaign creation on ad account: ${credentialContext.platformAccountId}`);

  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    success: true,
    mock: true,
    platform: "MetaAds",
    externalId: `act_meta_mock_${Date.now()}`,
    campaignId: `cmp_${Date.now()}`,
    status: "PAUSED",
    adSetsCount: (payload?.audienceTargeting || []).length || 1,
    createdAt: new Date().toISOString(),
  };
};
