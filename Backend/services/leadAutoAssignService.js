/**
 * leadAutoAssignService.js
 * Autonomous Inbound Lead Processing, Quality Scoring & Auto-Assignment Service.
 */

const Lead = require("../models/Lead");
const User = require("../models/User");
const Communication = require("../models/Communication");
const AuditLog = require("../models/AuditLog");

class LeadAutoAssignService {
  /**
   * Scores an inbound lead based on intent, budget, and business details.
   */
  calculateLeadScore({ requirement = "", budget = 0, timeline = "", message = "", businessType = "" }) {
    const text = `${requirement} ${message} ${timeline} ${businessType}`.toLowerCase();

    const highIntentKeywords = ["immediate", "urgent", "asap", "ready to start", "high budget", "growth", "ads", "website"];
    const hasHighIntent = highIntentKeywords.some((kw) => text.includes(kw));

    const numBudget = Number(budget) || 0;

    if (numBudget >= 30000 || hasHighIntent || text.includes("call me today")) {
      return {
        score: "Hot",
        confidence: 0.95,
        reason: "High commercial intent or budget threshold met.",
      };
    }

    if (numBudget >= 15000 || text.includes("pricing") || text.includes("quote") || text.includes("package")) {
      return {
        score: "Warm",
        confidence: 0.85,
        reason: "Standard business inquiry seeking package/quote.",
      };
    }

    return {
      score: "Cold",
      confidence: 0.7,
      reason: "General or early exploratory inquiry.",
    };
  }

  /**
   * Finds the best sales representative via round-robin or lowest active lead count.
   */
  async findBestSalesRep({ branchId = "BR001" } = {}) {
    // 1. Query active sales reps or employees
    let reps = await User.find({
      status: "Active",
      $or: [
        { department: "Sales" },
        { jobTitle: /sales|telecaller|executive|manager/i },
        { role: "Employee" },
      ],
    }).select("_id name email phone department").lean();

    if (!reps || reps.length === 0) {
      // Fallback to any active user/admin
      const fallback = await User.findOne({ status: "Active" }).select("_id name email phone").lean();
      return fallback;
    }

    // 2. Count active leads per rep to balance workload
    const repIds = reps.map((r) => r._id);
    const activeLeadCounts = await Lead.aggregate([
      { $match: { assignedTo: { $in: repIds }, status: { $in: ["New", "Contacted", "Follow-up Scheduled"] } } },
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    activeLeadCounts.forEach((c) => countMap.set(String(c._id), c.count));

    reps.sort((a, b) => {
      const countA = countMap.get(String(a._id)) || 0;
      const countB = countMap.get(String(b._id)) || 0;
      return countA - countB;
    });

    return reps[0];
  }

  /**
   * Universal Ingestion Pipeline for a newly arrived Lead.
   */
  async ingestAndAssignLead({
    name,
    phone,
    contactNumber,
    email,
    businessType,
    requirement,
    budget,
    timeline,
    source = "Website Webhook",
    notes = "",
    branchId = "BR001",
  }) {
    const finalPhone = phone || contactNumber || "";
    if (!name || !finalPhone) {
      throw new Error("Lead name and contact number/phone are required.");
    }

    // 1. Calculate Automated Lead Quality Score
    const scoring = this.calculateLeadScore({ requirement, budget, timeline, message: notes, businessType });

    // 2. Resolve Assigned Rep
    const assignedRep = await this.findBestSalesRep({ branchId });

    let normalizedSource = "Website";
    const lowerSource = String(source || "").toLowerCase();
    if (lowerSource.includes("ad") || lowerSource.includes("meta") || lowerSource.includes("google") || lowerSource.includes("facebook")) normalizedSource = "Ad";
    else if (lowerSource.includes("tele") || lowerSource.includes("call")) normalizedSource = "Telecaller";
    else if (lowerSource.includes("ai") || lowerSource.includes("workspace")) normalizedSource = "AI Workspace";

    let normalizedTimeline = "Normal";
    const lowerTimeline = String(timeline || "").toLowerCase();
    if (lowerTimeline.includes("urgent") || lowerTimeline.includes("immediate") || lowerTimeline.includes("asap")) normalizedTimeline = "Urgent";
    else if (lowerTimeline.includes("later")) normalizedTimeline = "Later";

    // 3. Persist Lead to Database
    const initialNotes = [];
    if (notes && String(notes).trim()) {
      initialNotes.push(String(notes).trim());
    }
    initialNotes.push(`[Auto-Ingested from ${source}] Lead Score: ${scoring.score} (${scoring.reason})`);

    const reqArray = Array.isArray(requirement)
      ? requirement.filter(Boolean)
      : (requirement ? [requirement] : ["Website Inbound"]);

    const lead = await Lead.create({
      name: name.trim(),
      contactNumber: finalPhone.trim(),
      email: email ? email.trim().toLowerCase() : "",
      businessType: businessType || "Business",
      city: city || "",
      leadScore: scoring.score,
      source: normalizedSource,
      timeline: normalizedTimeline,
      budgetRange: budget ? `₹${Number(budget).toLocaleString("en-IN")}` : "₹25,000",
      requirements: reqArray.length > 0 ? reqArray : ["Website Inbound"],
      status: "New",
      assignedTo: assignedRep ? assignedRep._id : null,
      branchId: branchId || "BR001",
      notes: initialNotes,
    });

    // 4. Generate Instant Auto-Greeting Communication Record
    let autoGreeting = null;
    try {
      const firstName = name.split(" ")[0];
      const greetingMsg = `Hi ${firstName}, thank you for contacting Digitalness! We received your request regarding ${requirement || "digital marketing growth"}. Our senior consultant ${assignedRep ? assignedRep.name : "from Digitalness"} will reach out to you shortly. In the meantime, feel free to check our work at digitalness.agency.`;

      autoGreeting = await Communication.create({
        recipientType: "Lead",
        recipientId: lead._id,
        recipientName: lead.name,
        channel: "WhatsApp",
        direction: "Outbound",
        status: "Sent",
        subject: "Welcome to Digitalness",
        content: greetingMsg,
        metadata: {
          autoTriggered: true,
          trigger: "LEAD_INBOUND_AUTOREPLY",
        },
      });
    } catch (commErr) {
      console.warn("[LeadAutoAssignService] Note creating greeting comms:", commErr.message);
    }

    // 5. Audit Log
    try {
      await AuditLog.create({
        actorType: "AI Agent",
        actorName: "Inbound Lead Autonomous Router",
        action: "LEAD_AUTO_INGESTED_AND_ASSIGNED",
        entityType: "Lead",
        entityId: lead._id,
        details: `Auto-scored as '${scoring.score}' and assigned to '${assignedRep ? assignedRep.name : "Unassigned"}'. Auto-greeting dispatched.`,
      });
    } catch (auditErr) {}

    return {
      success: true,
      lead,
      assignedRep: assignedRep ? { id: assignedRep._id, name: assignedRep.name, email: assignedRep.email } : null,
      leadScore: scoring,
      autoGreetingDispatched: Boolean(autoGreeting),
    };
  }
}

module.exports = new LeadAutoAssignService();
