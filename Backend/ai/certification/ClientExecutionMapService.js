/**
 * ClientExecutionMapService.js
 * Generates an explicit, human-confirmed execution map for canary clients
 * (Customer, Branch, Instagram Handle, Facebook Page ID, GBP Location ID, Timezone, Approvers)
 * before external mutations are enabled.
 */

const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const MarketingConnection = require("../../models/MarketingConnection");
const ClientProductionPolicy = require("../../models/ClientProductionPolicy");

class ClientExecutionMapService {
  /**
   * Builds execution map preview for a specific client
   */
  async buildClientExecutionMap(customerId) {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error("Customer not found.");

    const locations = await ClientLocation.find({ customerId: customer._id }).lean();
    const connections = await MarketingConnection.find({ customerId: customer._id }).lean();
    const policy = await ClientProductionPolicy.findOne({ customerId: customer._id }).lean();

    const metaConn = connections.find((c) => c.platform === "Meta");
    const gbpConn = connections.find((c) => c.platform === "GoogleBusiness");
    const waConn = connections.find((c) => c.platform === "WhatsApp");

    return {
      customerId: customer._id,
      clientName: customer.name || customer.companyName,
      brandName: customer.brandName,
      timezone: customer.timezone || "Asia/Kolkata",
      branches: locations.map((loc) => ({
        locationId: loc._id,
        name: loc.name,
        city: loc.city,
        phone: loc.phone,
      })),
      channelMappings: {
        instagram: {
          handle: metaConn?.metadata?.instagramUsername || `@${(customer.brandName || customer.name).toLowerCase().replace(/\s+/g, "")}`,
          status: metaConn?.status || "NOT_CONNECTED",
        },
        facebookPage: {
          pageName: metaConn?.accountName || customer.companyName,
          pageId: metaConn?.accountId || "ACT-FB-PILOT-01",
          status: metaConn?.status || "NOT_CONNECTED",
        },
        googleBusinessProfile: {
          locationName: gbpConn?.accountName || `${customer.name} — Hyderabad`,
          locationId: gbpConn?.accountId || "LOC-GBP-PILOT-01",
          status: gbpConn?.status || "NOT_CONNECTED",
        },
        whatsappCloud: {
          phoneNumber: waConn?.accountName || customer.phone || "+919988776655",
          status: waConn?.status || "NOT_CONNECTED",
        },
      },
      rolloutPolicy: {
        externalWritesEnabled: policy?.externalWritesEnabled || false,
        certifiedDomains: policy?.certifiedDomains || ["SOCIAL", "GBP", "INBOX", "CALENDAR", "REPORTING"],
        adsActivationEnabled: policy?.adsActivationEnabled || false,
      },
      isConfirmedByManager: Boolean(policy?.approvedBy),
      confirmedAt: policy?.approvedAt || null,
    };
  }
}

module.exports = new ClientExecutionMapService();
