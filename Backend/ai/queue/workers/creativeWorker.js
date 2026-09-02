/**
 * creativeWorker.js
 * Background worker for creative-generation BullMQ queue
 */

const BaseWorker = require("./baseWorker");
const creativePipelineService = require("../../creative/CreativePipelineService");

const creativeWorker = new BaseWorker({
  queueName: "creative-generation",
  concurrency: 3,
  handler: async (envelope, approvalDoc) => {
    const { customerId, locationId, payload } = envelope;
    console.log(`[CreativeWorker] Processing creative generation job for customer: ${customerId}`);

    const result = await creativePipelineService.executeRenderPipeline({
      customerId,
      locationId,
      creativeProjectId: payload.creativeProjectId,
      approvalId: envelope.approvalId,
      title: payload.title || "Marketing Poster",
      occasion: payload.occasion || "Campaign",
      blueprint: payload.blueprint || {},
      brandContext: payload.brandContext || {},
      version: envelope.resourceVersion || 1,
      revisionType: payload.revisionType || "INITIAL",
      renderOptions: payload.renderOptions || {},
      requestedBy: envelope.requestedBy,
    });

    return {
      success: true,
      mock: false,
      assetId: result.assetId,
      version: result.version,
      assetUrl: result.assetUrl,
      previewUrl: result.previewUrl,
      checksum: result.checksum,
      qaPassed: result.qaReport?.passed,
      generatedAt: new Date().toISOString(),
    };
  },
});

module.exports = creativeWorker;
