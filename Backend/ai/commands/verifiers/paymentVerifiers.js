/**
 * paymentVerifiers.js & contentVerifiers.js
 * Post-execution database verifiers.
 */

const Customer = require("../../../models/Customer");
const ContentItem = require("../../../models/ContentItem");

exports.verifyPaymentRecord = async ({ customerId, expectedMinPaid }) => {
  const customer = await Customer.findById(customerId).lean();
  if (!customer) {
    return { verified: false, reason: `Customer '${customerId}' not found during payment verification.` };
  }

  const matches = (customer.totalPaid || 0) >= expectedMinPaid;
  return {
    verified: matches,
    query: { customerId, field: "totalPaid" },
    expected: `>= ${expectedMinPaid}`,
    actual: customer.totalPaid,
    reason: matches
      ? `Payment record verified in Customer balance.`
      : `Verification failed: expected totalPaid >= ${expectedMinPaid}, found ${customer.totalPaid}`,
  };
};

exports.verifyContentApprove = async ({ contentItemId }) => {
  const item = await ContentItem.findById(contentItemId).lean();
  if (!item) {
    return { verified: false, reason: `ContentItem '${contentItemId}' not found.` };
  }

  const isApproved = item.approvalStatus === "Approved";
  return {
    verified: isApproved,
    query: { contentItemId, field: "approvalStatus" },
    expected: "Approved",
    actual: item.approvalStatus,
    reason: isApproved
      ? `ContentItem approval status verified in MongoDB.`
      : `ContentItem approval status is '${item.approvalStatus}'`,
  };
};
