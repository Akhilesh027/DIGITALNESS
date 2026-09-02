const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
  require("dotenv").config({ path: path.join(__dirname, "../Backend/.env") });
}
const mongoose = require("mongoose");
const cleanResetDB = require("./clean_reset_db");
const leadAutoAssignService = require("./services/leadAutoAssignService");
const clientAutoProvisioningService = require("./services/clientAutoProvisioningService");
const recurringInvoiceService = require("./services/recurringInvoiceService");
const { handlePaymentWebhook } = require("./controllers/paymentWebhookController");
const notificationDispatcher = require("./services/notificationDispatcherService");

const Customer = require("./models/Customer");
const Lead = require("./models/Lead");
const Work = require("./models/Work");
const Invoice = require("./models/Invoice");
const Communication = require("./models/Communication");
const User = require("./models/User");

async function runCompleteTestSuite() {
  console.log("==================================================================");
  console.log("DIGITALNESS ZERO-TOUCH CRM & WORKFLOW AUTOMATION TEST SUITE");
  console.log("==================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/digitalness";
  await mongoose.connect(mongoUri);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------------------
    // TEST 0: Clean DB Baseline
    // ----------------------------------------------------------------
    console.log("\n--- TEST 0: Executing Clean Database Baseline ---");
    await cleanResetDB();
    await mongoose.connect(mongoUri); // Reconnect after clean reset

    const customerCount = await Customer.countDocuments();
    const leadCount = await Lead.countDocuments();
    const workCount = await Work.countDocuments();
    const invoiceCount = await Invoice.countDocuments();
    const userCount = await User.countDocuments();

    assert(customerCount === 0 && leadCount === 0 && workCount === 0 && invoiceCount === 0, "DB Clean Baseline Verified (0 transactional records)", `Customers: ${customerCount}, Leads: ${leadCount}, Works: ${workCount}, Invoices: ${invoiceCount}`);
    assert(userCount >= 5, "Base Operational Users Seeded", `Found ${userCount} users (Admin, Sales, Designer, Marketer, Manager).`);

    // ----------------------------------------------------------------
    // TEST 1: Inbound Lead Webhook & Instant Assignment Engine
    // ----------------------------------------------------------------
    console.log("\n--- TEST 1: Inbound Lead Auto-Ingestion & Assignment ---");
    const mockInboundLead = {
      name: "Aura Dental Care",
      phone: "9876500112",
      email: "info@auradental.com",
      businessType: "Dental & Healthcare",
      requirement: "Immediate Google Ads & Social Media Marketing Campaign needed ASAP",
      budget: 35000,
      source: "Meta Lead Ads Webhook",
    };

    const leadResult = await leadAutoAssignService.ingestAndAssignLead(mockInboundLead);

    assert(leadResult.success === true, "Lead Ingested Successfully via Autonomous Router");
    assert(leadResult.leadScore.score === "Hot", "Lead Auto-Scored as 'Hot' (High Intent + Budget >= 30K)", `Score: ${leadResult.leadScore.score}`);
    assert(Boolean(leadResult.assignedRep), "Lead Auto-Assigned to Sales Rep", `Assigned to: ${leadResult.assignedRep?.name}`);

    const welcomeGreeting = await Communication.findOne({ recipientId: leadResult.lead._id, channel: "WhatsApp" });
    assert(Boolean(welcomeGreeting), "Instant WhatsApp Auto-Greeting Generated", `Subject: ${welcomeGreeting?.subject}`);

    // ----------------------------------------------------------------
    // TEST 2: Zero-Touch Client Onboarding & Deliverable Pipeline Provisioning
    // ----------------------------------------------------------------
    console.log("\n--- TEST 2: Zero-Touch Client Onboarding & Deliverables ---");
    const admin = await User.findOne({ email: "admin@digitalness.com" });

    // Create client
    const newClient = await Customer.create({
      name: "Aura Dental Care",
      companyName: "Aura Dental Care Pvt Ltd",
      contactPerson: "Dr. Vikram Seth",
      contactNumbers: ["9876500112"],
      email: "info@auradental.com",
      businessType: "Dental & Healthcare",
      package: "25",
      branchId: "BR001",
      createdBy: admin._id,
      brandProfile: {
        brandName: "Aura Dental Care",
        brandColors: ["#0F3D3E", "#22D3EE"],
        tone: "Professional Medical",
      },
    });

    const provResult = await clientAutoProvisioningService.provisionClient({
      customerId: newClient._id,
      createdBy: admin._id,
    });

    assert(Boolean(provResult.readiness), "Client AI Readiness Calculated", `Score: ${provResult.readiness?.score || 85}%`);

    const deliverables = await Work.find({ customer: newClient._id });
    assert(deliverables.length > 0, "1st Month Deliverable Pipeline Auto-Scheduled in Work Collection", `Created ${deliverables.length} scheduled tasks.`);

    const onboardingInvoice = await Invoice.findOne({ customer: newClient._id });
    assert(Boolean(onboardingInvoice), "Initial Onboarding Retainer Invoice Auto-Generated", `Invoice Number: ${onboardingInvoice?.invoiceNumber}, Total: ₹${onboardingInvoice?.total}`);

    // ----------------------------------------------------------------
    // TEST 3: Recurring Billing & Payment Gateway Webhook Reconciliation
    // ----------------------------------------------------------------
    console.log("\n--- TEST 3: Recurring Invoicing & Payment Webhook Reconciliation ---");
    const recurringRun = await recurringInvoiceService.generateMonthlyRecurringInvoices({ createdBy: admin._id });
    assert(recurringRun.totalCustomers >= 1, "Monthly Recurring Billing Engine Scanned Active Customers", `Customers Scanned: ${recurringRun.totalCustomers}`);

    // Mock incoming Razorpay / Stripe Payment Webhook
    const mockPaymentReq = {
      body: {
        invoiceNumber: onboardingInvoice.invoiceNumber,
        amount: onboardingInvoice.balanceAmount,
        transactionId: `rzp_live_${Date.now()}`,
        paymentMethod: "UPI / NetBanking",
        gateway: "Razorpay",
        status: "SUCCESS",
      },
    };

    let paymentWebhookRes = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          paymentWebhookRes = { code, data };
          return data;
        },
      }),
    };

    await handlePaymentWebhook(mockPaymentReq, mockRes);

    assert(paymentWebhookRes?.code === 200, "Payment Gateway Webhook Processed Successfully (HTTP 200)");

    const updatedInvoice = await Invoice.findById(onboardingInvoice._id);
    assert(updatedInvoice.paymentStatus === "PAID" && updatedInvoice.balanceAmount === 0, "Invoice Marked 'PAID' with 0 Balance", `Status: ${updatedInvoice.paymentStatus}, Balance: ₹${updatedInvoice.balanceAmount}`);

    const updatedCustomer = await Customer.findById(newClient._id);
    assert(updatedCustomer.totalPaid > 0, "Customer Financial Ledger Balance Reconciled", `Total Paid: ₹${updatedCustomer.totalPaid}, Pending: ₹${updatedCustomer.totalPending}`);

    const paymentReceiptComm = await Communication.findOne({ recipientId: newClient._id, subject: /Payment Received/i });
    assert(Boolean(paymentReceiptComm), "Automated Payment Receipt Dispatched to Client", `Subject: ${paymentReceiptComm?.subject}`);

    // ----------------------------------------------------------------
    // TEST 4: Multi-Channel WhatsApp & Notification Dispatch Hub
    // ----------------------------------------------------------------
    console.log("\n--- TEST 4: WhatsApp & Notification Dispatch Hub ---");
    const briefDispatch = await notificationDispatcher.dispatchExecutiveBriefing({
      briefingData: {
        finance: { todayRevenue: 25000, pendingCollections: 0 },
        operations: { atRiskDeliverables: 0 },
        sales: { newLeadsToday: 1 },
        healthScore: 99,
      },
      type: "MORNING",
    });

    assert(briefDispatch.success === true && briefDispatch.count > 0, "Daily Morning Executive Brief Dispatched to Leadership", `Delivered to ${briefDispatch.count} agency managers/admins.`);

    const clientApprovalDispatch = await notificationDispatcher.dispatchClientApprovalRequest({
      customer: newClient,
      work: deliverables[0] || { title: "Grand Opening Poster" },
      previewImageUrl: "https://example.com/demo-preview.png",
      headline: "Sparkling Smiles Start Here",
    });

    assert(clientApprovalDispatch.success === true, "1-Click Client Approval Link Generated & Dispatched", `Approval Token: ${clientApprovalDispatch.approvalToken}`);

    // ----------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`AUTOMATION SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");
  } catch (suiteErr) {
    console.error("Test Suite Execution Error:", suiteErr);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runCompleteTestSuite();
}

module.exports = runCompleteTestSuite;
