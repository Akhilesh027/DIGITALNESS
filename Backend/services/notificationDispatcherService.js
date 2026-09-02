/**
 * notificationDispatcherService.js
 * Multi-Channel Autonomous Notification & WhatsApp Dispatch Hub.
 * Dispatches Executive Briefs, SLA Escalations, Payment Reminders, and Client Approval Links.
 */

const Communication = require("../models/Communication");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

class NotificationDispatcherService {
  /**
   * Dispatches the Daily Morning Executive Brief to Agency Directors and Managers.
   */
  async dispatchExecutiveBriefing({ briefingData, type = "MORNING" }) {
    console.log(`[NotificationDispatcher] Dispatching Daily ${type} Briefing...`);

    const leaders = await User.find({
      role: { $in: ["Admin", "Operational Manager", "Manager"] },
      status: "Active",
    }).select("name email phone role").lean();

    const title = type === "MORNING" ? "🌅 Daily Morning Executive Brief" : "🌆 End-of-Day Executive Summary";
    const text = `*${title}*\n` +
      `📅 *Date:* ${new Date().toLocaleDateString("en-IN")}\n\n` +
      `💰 *Cash Collected Today:* ₹${(briefingData?.finance?.todayRevenue || 0).toLocaleString("en-IN")}\n` +
      `⏳ *Total Pending Collections:* ₹${(briefingData?.finance?.pendingCollections || 0).toLocaleString("en-IN")}\n` +
      `⚠️ *Deliverables at SLA Risk:* ${briefingData?.operations?.atRiskDeliverables || 0}\n` +
      `👥 *New Inbound Leads Today:* ${briefingData?.sales?.newLeadsToday || 0}\n` +
      `📊 *Overall Agency Health:* ${briefingData?.healthScore || 98}%\n\n` +
      `👉 View detailed dashboard: ${process.env.CLIENT_URL || "http://localhost:8080"}/dashboard`;

    const dispatched = [];

    for (const leader of leaders) {
      try {
        const comm = await Communication.create({
          recipientType: "User",
          recipientId: leader._id,
          recipientName: leader.name,
          channel: "WhatsApp",
          direction: "Outbound",
          status: "Sent",
          subject: title,
          content: text,
          metadata: {
            autoTriggered: true,
            trigger: `EXECUTIVE_${type}_BRIEF`,
          },
        });
        dispatched.push({ leader: leader.name, commId: comm._id });
      } catch (err) {
        console.warn(`[Dispatch Warning for ${leader.name}]:`, err.message);
      }
    }

    return { success: true, count: dispatched.length, details: dispatched };
  }

  /**
   * Dispatches Critical SLA Escalation Alert to Operations Manager.
   */
  async dispatchSLAEscalation({ task, incident }) {
    const managers = await User.find({
      role: { $in: ["Admin", "Operational Manager", "Manager"] },
      status: "Active",
    }).select("name email phone").lean();

    const alertText = `🚨 *CRITICAL SLA BREACH RISK ALERT*\n\n` +
      `📋 *Task:* ${task.title}\n` +
      `👤 *Client:* ${task.customerName || "Agency Client"}\n` +
      `⏰ *Deadline:* ${new Date(task.dueDate || task.sla?.deadline).toLocaleString("en-IN")}\n` +
      `🔥 *Risk Score:* ${incident?.riskScore || task.sla?.riskScore || 85} / 100\n` +
      `⚠️ *Action Needed:* Immediate reallocation or fast-track priority required.\n\n` +
      `👉 Open Task: ${process.env.CLIENT_URL || "http://localhost:8080"}/works/${task._id}`;

    for (const mgr of managers) {
      try {
        await Communication.create({
          recipientType: "User",
          recipientId: mgr._id,
          recipientName: mgr.name,
          channel: "WhatsApp",
          direction: "Outbound",
          status: "Sent",
          subject: "Critical SLA Risk Escalation",
          content: alertText,
          metadata: {
            autoTriggered: true,
            trigger: "SLA_CRITICAL_ESCALATION",
            taskId: task._id,
          },
        });
      } catch (e) {}
    }
  }

  /**
   * Dispatches 1-Click Client Creative Approval Link.
   */
  async dispatchClientApprovalRequest({ customer, work, previewImageUrl, headline }) {
    const approvalToken = `APPR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const approvalUrl = `${process.env.CLIENT_URL || "http://localhost:8080"}/client-portal?approveToken=${approvalToken}`;

    const text = `🎨 *New Creative Ready for Your Approval*\n\n` +
      `Hi ${customer.name},\n` +
      `Our creative team has prepared the latest social media design: *"${headline || work.title}"*.\n\n` +
      `👀 *Preview Image:* ${previewImageUrl || "Attached in portal"}\n\n` +
      `✅ *Click to Approve & Schedule in 1-Click:*\n${approvalUrl}\n\n` +
      `If you need revisions, simply reply to this message!`;

    const comm = await Communication.create({
      recipientType: "Customer",
      recipientId: customer._id,
      recipientName: customer.name,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Sent",
      subject: `Creative Approval Request - ${work.title}`,
      content: text,
      metadata: {
        autoTriggered: true,
        trigger: "CLIENT_CREATIVE_APPROVAL",
        workId: work._id,
        approvalToken,
      },
    });

    return { success: true, approvalToken, approvalUrl, commId: comm._id };
  }
}

module.exports = new NotificationDispatcherService();
