/**
 * audit_canary_evidence.js
 * Comprehensive provenance inspection of Canary records in MongoDB.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("../models/Customer");
const ClientLocation = require("../models/ClientLocation");
const MarketingConnection = require("../models/MarketingConnection");
const SocialPublication = require("../models/SocialPublication");
const GBPPublication = require("../models/GBPPublication");
const ApprovalRequest = require("../models/ApprovalRequest");
const ProductionCertification = require("../models/ProductionCertification");

async function audit() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digitalness_crm";
  await mongoose.connect(mongoUri);

  console.log("=== CANARY EVIDENCE AUDIT ===");

  const customer = await Customer.findOne({ email: "canary.siya@digitalness.ai" }).lean();
  console.log("Customer:", customer ? { _id: customer._id, createdAt: customer.createdAt, name: customer.name } : "NOT FOUND");

  const location = await ClientLocation.findOne({ customerId: customer?._id }).lean();
  console.log("Location:", location ? { _id: location._id, createdAt: location.createdAt, name: location.name } : "NOT FOUND");

  const connections = await MarketingConnection.find({ customerId: customer?._id }).lean();
  console.log("Connections:", connections.map(c => ({
    platform: c.platform,
    status: c.status,
    accountId: c.accountId,
    accountName: c.accountName,
    hasLiveToken: Boolean(c.encryptedAccessToken && c.encryptedAccessToken.length > 20),
    isMock: !c.encryptedAccessToken || c.encryptedAccessToken === "mock_token" || c.status !== "Connected",
    createdAt: c.createdAt
  })));

  const approvals = await ApprovalRequest.find({ customerId: customer?._id }).lean();
  console.log("Approvals:", approvals.map(a => ({
    approvalId: a.approvalId,
    riskLevel: a.riskLevel,
    actionType: a.actionType,
    status: a.status,
    createdAt: a.createdAt
  })));

  const socialPubs = await SocialPublication.find({ customerId: customer?._id }).lean();
  console.log("Social Publications:", socialPubs.map(s => ({
    _id: s._id,
    status: s.status,
    idempotencyKey: s.idempotencyKey,
    receipts: s.receipts,
    createdAt: s.createdAt
  })));

  const gbpPubs = await GBPPublication.find({ customerId: customer?._id }).lean();
  console.log("GBP Publications:", gbpPubs.map(g => ({
    _id: g._id,
    status: g.status,
    idempotencyKey: g.idempotencyKey,
    googleLocalPostName: g.googleLocalPostName,
    createdAt: g.createdAt
  })));

  const cert = await ProductionCertification.findOne({ environment: "PILOT" }).lean();
  console.log("Certification Status:", cert ? { status: cert.status, gatesCount: cert.gates?.length } : "NOT FOUND");

  await mongoose.connection.close();
}

audit().catch(console.error);
