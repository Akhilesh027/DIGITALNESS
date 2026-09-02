/**
 * paymentWorker.js
 * Background worker for payments queue
 */

const BaseWorker = require("./baseWorker");

const paymentWorker = new BaseWorker({
  queueName: "payments",
  concurrency: 2,
  handler: async (envelope, approvalDoc) => {
    console.log(`[PaymentWorker] Processing payment task: ${envelope.operation} for customer: ${envelope.customerId}`);

    // Simulation of payment link generation or recovery dispatch
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      success: true,
      mock: true,
      operation: envelope.operation,
      receiptId: `pay_rcpt_mock_${Date.now()}`,
      processedAt: new Date().toISOString(),
    };
  },
});

module.exports = paymentWorker;
