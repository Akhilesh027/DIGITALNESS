/**
 * MockWhatsAppConnector.js
 * Test adapter simulating WhatsApp Cloud API message broadcasting.
 */

exports.sendMessage = async ({ credentialContext, payload }) => {
  console.log(`[MockWhatsAppConnector] Simulating WhatsApp broadcast from phoneId: ${credentialContext.platformAccountId}`);

  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    success: true,
    mock: true,
    platform: "WhatsApp",
    externalId: `wamid.mock_${Date.now()}`,
    status: "SENT",
    sentAt: new Date().toISOString(),
  };
};
