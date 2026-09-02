/**
 * test_canva_creative_workflow.js
 * Comprehensive Verification & Acceptance Suite for Step 16:
 * Canva Creative Design Editing Workflow, Natural-Language Feedback,
 * Draft Transactions, Previews, Versioning (V1 -> V2), Approval, and Safe Commit.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");
const User = require("./models/User");
const CreativeAsset = require("./models/CreativeAsset");
const CanvaDesignLink = require("./models/CanvaDesignLink");
const CanvaElementMap = require("./models/CanvaElementMap");
const CreativeEditRequest = require("./models/CreativeEditRequest");
const ApprovalRequest = require("./models/ApprovalRequest");
const SocialPublication = require("./models/SocialPublication");

const creativeEditInterpreter = require("./ai/creative/CreativeEditInterpreter");
const canvaCapabilityRegistry = require("./ai/creative/canva/CanvaCapabilityRegistry");
const canvaEditWorkflowService = require("./ai/creative/canva/CanvaEditWorkflowService");

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedCount++;
  }
}

async function runTests() {
  console.log("\n===============================================================================");
  console.log("🚀 STARTING STEP 16: CANVA CREATIVE DESIGN EDITING WORKFLOW TEST SUITE");
  console.log("===============================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);
  console.log("📦 Connected to MongoDB: [REDACTED]\n");

  try {
    // 0. Setup Mock Customer and User
    const customer = await Customer.findOneAndUpdate(
      { email: "canva_test_salon@digitalness.ai" },
      {
        $set: {
          name: "Toni & Guy Ameenpur",
          brandName: "Toni & Guy",
          companyName: "Toni & Guy Salon",
          phone: "+919988776655",
        },
      },
      { upsert: true, new: true }
    );

    const userManager = await User.findOneAndUpdate(
      { email: "creative.manager@digitalness.ai" },
      {
        $set: {
          name: "Creative Manager",
          role: "Manager",
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );

    const initialAsset = await CreativeAsset.create({
      assetId: `AST-CANVA-V1-${Date.now()}`,
      customerId: customer._id,
      title: "Festive Season Promo Poster",
      version: 1,
      status: "READY",
      storageProvider: "Cloudinary",
      storageKey: "mock_poster_v1_key",
      assetUrl: "https://res.cloudinary.com/digitalness/image/upload/v1/mock_poster_v1.jpg",
      canvaDesignId: "DES-CANVA-998877",
      publishReady: true,
    });

    await CanvaElementMap.create([
      {
        designId: "DES-CANVA-998877",
        pageId: "page_1",
        elementId: "elem_logo_1",
        semanticRole: "LOGO",
        elementType: "IMAGE",
      },
      {
        designId: "DES-CANVA-998877",
        pageId: "page_1",
        elementId: "elem_headline_1",
        semanticRole: "HEADLINE",
        elementType: "TEXT",
      },
      {
        designId: "DES-CANVA-998877",
        pageId: "page_1",
        elementId: "elem_phone_1",
        semanticRole: "PHONE",
        elementType: "TEXT",
      },
    ]);

    // -------------------------------------------------------------------------
    // TEST 1: Telugu-English Natural Language Feedback Interpretation
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Natural-Language Feedback Interpretation ---");
    const feedback1 = "Logo koncham bigger chey, phone number change chey to +91 9876543210, main heading size thagginchu";
    const interpretation1 = await creativeEditInterpreter.interpret({
      rawFeedback: feedback1,
      designId: "DES-CANVA-998877",
      customerId: customer._id,
    });

    assert(interpretation1.interpretedOperations.length === 3, "Interpreted all 3 requested operations");
    const logoOp = interpretation1.interpretedOperations.find((o) => o.targetRole === "LOGO");
    const phoneOp = interpretation1.interpretedOperations.find((o) => o.targetRole === "PHONE");
    const headingOp = interpretation1.interpretedOperations.find((o) => o.targetRole === "HEADLINE");

    assert(logoOp && logoOp.intent === "RESIZE_ELEMENT" && logoOp.parameters.scale > 1.0, "Logo scale increased");
    assert(phoneOp && phoneOp.intent === "REPLACE_TEXT" && phoneOp.parameters.newText.includes("9876543210"), "Phone number extracted accurately");
    assert(headingOp && headingOp.intent === "FORMAT_TEXT" && headingOp.parameters.fontSizeDelta < 0, "Heading size reduction extracted");

    // -------------------------------------------------------------------------
    // TEST 2: Explicit Unsupported Operation Detection (No Fake Success)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Unsupported Operations Detection ---");
    const feedback2 = "Poppins font petti background gradient blue chey";
    const interpretation2 = await creativeEditInterpreter.interpret({
      rawFeedback: feedback2,
      designId: "DES-CANVA-998877",
      customerId: customer._id,
    });

    assert(interpretation2.unsupportedOperations.length >= 2, "Detected unsupported font family & background gradient");
    const fontUnop = interpretation2.unsupportedOperations.find((u) => u.reasonCode === "FONT_FAMILY_CHANGE_NOT_SUPPORTED");
    const gradUnop = interpretation2.unsupportedOperations.find((u) => u.reasonCode === "BACKGROUND_GRADIENT_CHANGE_NOT_SUPPORTED");

    assert(fontUnop !== undefined, "Flagged FONT_FAMILY_CHANGE_NOT_SUPPORTED");
    assert(gradUnop !== undefined, "Flagged BACKGROUND_GRADIENT_CHANGE_NOT_SUPPORTED");
    assert(interpretation2.executionMode === "MANUAL_REQUIRED", "Execution mode flagged as MANUAL_REQUIRED");

    // -------------------------------------------------------------------------
    // TEST 3: Responsive Page Layout Restriction
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Responsive Layout Restriction ---");
    const responsiveOps = [{ intent: "RESIZE_ELEMENT", targetRole: "LOGO" }];
    const responsiveValidation = canvaCapabilityRegistry.validateOperations(responsiveOps, { isResponsive: true });

    assert(responsiveValidation.valid === false, "Rejected layout resize on responsive canvas");
    assert(responsiveValidation.unsupportedOps[0].reasonCode === "CANVA_RESPONSIVE_OPERATION_UNSUPPORTED", "Flagged CANVA_RESPONSIVE_OPERATION_UNSUPPORTED");

    // -------------------------------------------------------------------------
    // TEST 4: Canva Draft Transaction & Visual Preview Generation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Draft Transaction & Visual Preview Generation ---");
    const editReq = await canvaEditWorkflowService.createEditRequest({
      creativeAssetId: initialAsset._id,
      rawFeedback: "Make logo bigger and update phone number to +91 9988776655",
      requestedBy: userManager._id,
    });

    assert(editReq.status === "PREVIEW_READY", "Edit request reached PREVIEW_READY status");
    assert(editReq.canvaTransactionReference.startsWith("CTX-"), "Canva draft transaction reference created");
    assert(editReq.previewReference.beforePreviewUrl.length > 0, "Before preview URL populated");
    assert(editReq.previewReference.afterPreviewUrl.length > 0, "After preview URL populated");
    assert(editReq.approvalId !== null, "R1 ApprovalRequest created for visual review");

    // -------------------------------------------------------------------------
    // TEST 5: Zero Commit Calls Before Approval
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: No Commit Before Approval Invariant ---");
    const unapprovedAsset = await CreativeAsset.findById(initialAsset._id);
    assert(unapprovedAsset.version === 1, "Creative asset version remained V1 before approval");

    // -------------------------------------------------------------------------
    // TEST 6: Approved Commit Creates Version V2 While Preserving V1
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Approved Commit & Version Lineage (V1 -> V2) ---");
    const commitResult = await canvaEditWorkflowService.commitApprovedEdit(editReq._id, userManager._id);

    assert(commitResult.success === true, "Commit executed successfully");
    assert(commitResult.version === 2, "Resulting asset is Version 2");
    assert(commitResult.newAsset.parentAssetId === initialAsset.assetId, "Parent asset preserved in version lineage");
    assert(commitResult.newAsset.revisionSource === "CANVA_EDIT", "revisionSource recorded as CANVA_EDIT");

    // Verify V1 is NOT overwritten
    const preservedV1 = await CreativeAsset.findById(initialAsset._id);
    assert(preservedV1.version === 1 && preservedV1.assetUrl === initialAsset.assetUrl, "Original V1 asset was preserved completely intact");

    // -------------------------------------------------------------------------
    // TEST 7: Cloudinary Export & QA Validation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Cloudinary Export & QA Guardian ---");
    assert(commitResult.newAsset.storageProvider === "Cloudinary", "Storage provider is Cloudinary");
    assert(commitResult.newAsset.format === "JPG", "Format exported as standard JPG");
    assert(commitResult.newAsset.qaReport.passed === true, "QA Guardian evaluated asset as passed");
    assert(commitResult.newAsset.publishReady === true, "publishReady marked true");

    // -------------------------------------------------------------------------
    // TEST 8: Transaction Cancellation Discards Draft
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Transaction Cancellation ---");
    const editReq2 = await canvaEditWorkflowService.createEditRequest({
      creativeAssetId: initialAsset._id,
      rawFeedback: "Make logo smaller",
      requestedBy: userManager._id,
    });

    const cancelResult = await canvaEditWorkflowService.cancelEdit(editReq2._id, userManager._id);
    assert(cancelResult.success === true, "Draft cancellation succeeded");
    assert(cancelResult.editRequest.status === "CANCELLED", "Edit request status set to CANCELLED");

    // -------------------------------------------------------------------------
    // TEST 9: Creative Approval Is NOT Social Publishing Approval
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Governance Invariant: Creative Approval != Social Publishing ---");
    const socialPubCount = await SocialPublication.countDocuments({ creativeAssetId: commitResult.newAsset._id });
    assert(socialPubCount === 0, "Security Invariant: Approved Canva edit did NOT trigger autonomous social publishing");

    console.log("\n===============================================================================");
    console.log(`🎉 STEP 16 TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("===============================================================================\n");

  } catch (err) {
    console.error("\n💥 STEP 16 TEST SUITE EXECUTION ERROR:", err);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Disconnected from MongoDB.");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
