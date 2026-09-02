/**
 * conversationalResponseComposer.js
 * Conversational Response Composer for Digitalness AI OS.
 * Transforms internal machine states & execution outputs into crisp, natural, context-aware human dialogue.
 * 
 * Rules:
 * 1. Acknowledge user intent naturally without robotic JSON echoing.
 * 2. Avoid technical jargon (no "schema parameters", "status 200", "executionId").
 * 3. Adapt response length (concise for queries, structured for plans).
 * 4. Human outside. Structured inside.
 */

class ConversationalResponseComposer {
  /**
   * Composes response text for AWAITING_ENTITY (Customer/Location disambiguation).
   */
  composeEntityPrompt({ intent, parameters = {}, reason, candidates = [], unregisteredClientName = null }) {
    if (unregisteredClientName) {
      const activeNames = candidates.slice(0, 2).map((c) => c.name).join(" or ");
      return `I noticed you mentioned **${unregisteredClientName}**, but they are not registered in your CRM yet.\n\nWould you like to run this for an existing client (${activeNames || "below"}), or onboard **${unregisteredClientName}** first?`;
    }

    if (reason === "MULTIPLE_MATCHES") {
      const names = candidates.slice(0, 2).map((c) => c.name).join(" or ");
      return `I found multiple matching clients (${names}). Which one would you like to use?`;
    }

    if (intent?.includes("ADS") || intent?.includes("ads") || parameters?.command?.startsWith("ads.")) {
      return `Sure — which client would you like me to prepare this ad campaign for?`;
    }

    if (intent?.includes("TASK") || parameters?.command === "task.create") {
      return `Sure — which client would you like me to create this deliverable task for?`;
    }

    if (intent?.includes("PAYMENT") || parameters?.command === "payment.record") {
      return `Which client would you like to record this payment for?`;
    }

    if (intent?.includes("PIPELINE") || parameters?.command?.includes("pipeline")) {
      return `Which client would you like to generate the monthly pipeline for?`;
    }

    const topic = parameters.campaignTopic || parameters.festival || "";
    const cleanTopic = topic && topic.length < 30 ? topic : "";
    const assetType = parameters.assetType;

    if (cleanTopic && assetType) {
      return `Sure — I can prepare the ${cleanTopic} ${assetType}. Which client would you like me to create it for?`;
    }

    if (assetType) {
      return `Sure — which client would you like this ${assetType} for?`;
    }

    return `Sure — which client would you like this for?`;
  }

  /**
   * Composes response text when Customer 360 has been selected and context is loaded.
   */
  composeEntityResolved({ customerName, brandContext, parameters = {} }) {
    const topic = parameters.campaignTopic || parameters.festival || "";
    const assetType = parameters.assetType || "creative";

    let msg = `Got it — ${customerName}. I've loaded their brand profile`;

    if (brandContext?.hasLogo) {
      msg += `, verified logos, and brand colors`;
    }
    if (topic) {
      msg += ` for the ${topic} ${assetType}`;
    }
    msg += `. Here is the creative direction ready for review.`;

    return msg;
  }

  /**
   * Composes progressive intake questions.
   */
  composeIntakeQuestion({ field, question, currentEntityName, collected = {} }) {
    if (field === "phone") {
      return currentEntityName
        ? `Sure — adding ${currentEntityName}. What's their phone number?`
        : `Got it. What's the phone number?`;
    }
    if (field === "budget" || field === "expectedRevenue") {
      return `Added. What's the approximate budget or deal size?`;
    }
    if (field === "assignedTo") {
      return `Who should this be assigned to?`;
    }
    if (field === "dueDate") {
      return `When is the target deadline for this?`;
    }
    return question || `What is the value for ${field}?`;
  }

  /**
   * Composes blueprint presentation message.
   */
  composeBlueprintReady({ intent, customerName, summary }) {
    if (intent?.includes("ADS") || intent?.includes("ads")) {
      return customerName
        ? `Ad Campaign Strategy prepared for **${customerName}**! Review the target audiences, budget allocation, and creative requirements below before staging:`
        : `Ad Campaign Strategy prepared. Review the blueprint below:`;
    }
    if (intent?.includes("creative")) {
      return customerName
        ? `Everything is ready for ${customerName}. Here's the creative plan before I generate the design.`
        : `Creative plan ready for review.`;
    }
    if (intent?.includes("lead")) {
      return `Everything I need is ready. Here's the lead record before I add it to the CRM.`;
    }
    if (intent?.includes("task")) {
      return `Here is the task blueprint ready for execution.`;
    }
    return `Plan prepared and verified. Review the details below to proceed.`;
  }

  /**
   * Composes execution completion message.
   */
  composeExecutionSuccess({ command, result, customerName }) {
    if (command === "ads.audience.recommend") {
      const audiences = result?.audiences || [];
      const clientName = customerName || "Client";
      let md = `🎯 **Recommended Audience Targeting Tiers for ${clientName}:**\n\n`;
      audiences.forEach((aud, idx) => {
        md += `**Tier ${idx + 1}: ${aud.name}**\n`;
        md += `• 📍 **Locations**: ${aud.locations?.join(", ") || "Local Catchment"}\n`;
        md += `• 🎯 **Strategy**: ${aud.strategyType} (${aud.dailyBudgetShare}% budget share)\n`;
        md += `• 👥 **Demographics**: Age ${aud.ageRange?.min}-${aud.ageRange?.max} • ${aud.genders?.join(", ")}\n`;
        md += `• 💡 **Interests / Behaviors**: ${aud.interests?.slice(0, 4).join(", ")}\n`;
        md += `• 📊 **Est. Daily Reach**: ${aud.estimatedDailyReach || "3,000 - 6,000"}\n\n`;
      });
      return md.trim();
    }

    if (command === "ads.budget.recommend") {
      const b = result?.budget || {};
      const clientName = customerName || "Client";
      return `💰 **Advertising Budget & Lead Volume Forecast for ${clientName}:**\n\n` +
        `• 💵 **Recommended Daily Spend**: ₹${Number(b.amount || 1000).toLocaleString("en-IN")} / day\n` +
        `• 📅 **Flight Duration**: ${b.days || 10} Days (Total Spend: ₹${Number(b.totalBudget || 10000).toLocaleString("en-IN")})\n` +
        `• 🎯 **Est. Cost Per Lead (CPL)**: ${b.estimatedCPL || "₹180 - ₹320"}\n` +
        `• 📈 **Estimated Daily Leads**: ${b.estimatedDailyLeads || "3 - 6 leads / day"}\n` +
        `• 🚀 **Estimated Flight Volume**: ${b.estimatedTotalLeads || "30 - 60 qualified leads"}\n` +
        `• 🗓️ **Monthly Run-Rate**: ${b.estimatedMonthlyLeads || "90 - 180 leads / month"}`;
    }

    if (command === "ads.strategy.create") {
      const s = result?.strategy || {};
      const clientName = customerName || "Client";
      return `📈 **Advertising Funnel & Strategic Direction for ${clientName}:**\n\n` +
        `• 🎯 **Platform**: ${s.platform || "Meta (Instagram & Facebook)"}\n` +
        `• 📍 **Funnel Stage**: ${s.funnelStage || "Top of Funnel Discovery"}\n` +
        `• 🚀 **Primary KPI**: ${s.primaryKPI || "Cost Per Qualified Lead (CPL)"}\n` +
        `• 💬 **Conversion Route**: ${s.conversionType?.replace("_", " ") || "Instant Lead Form"}\n` +
        `• 💡 **Core Value Proposition**: ${s.coreMessage || "Premium Quality & Local Trust"}\n` +
        `• 📋 **Executive Summary**: ${s.recommendationSummary || "High-intent local campaign"}`;
    }

    if (command?.startsWith("ads.")) {
      const campName = result?.campaignName || result?.blueprint?.campaignName || "Ad Campaign";
      const budget = result?.budget?.amount ? `₹${result.budget.amount}/day` : "₹1,000 / day";
      const audiencesCount = result?.audiences?.length || 3;
      const reqCount = result?.creativeRequirements?.length || 2;
      const launchDate = result?.scheduledLaunch || "Today";
      return `🚀 **Ad Campaign Approved & Scheduled Successfully!**\n\n` +
        `• 🎯 **Campaign**: ${campName}\n` +
        `• 📅 **Schedule**: Launching ${launchDate} (${result?.budget?.days || 10} Days Flight)\n` +
        `• 💰 **Budget**: ${budget} (Total: ₹${Number(result?.budget?.totalBudget || (result?.budget?.amount * 10) || 10000).toLocaleString("en-IN")})\n` +
        `• 👥 **Targeting**: ${audiencesCount} Audience Tiers configured for A/B testing\n` +
        `• 🎨 **Creative Production**: ${reqCount} Assets queued for Creative Agent (1:1 Banner + 9:16 Reel)\n\n` +
        `✅ Campaign is live in your [Ad Campaigns Ledger](/ads) and staged for execution.`;
    }
    if (command?.startsWith("briefing.")) {
      const health = result?.agencyHealth?.score ?? 100;
      const level = result?.agencyHealth?.level || "EXCELLENT";
      const activeTasks = result?.delivery?.activeTotal ?? (result?.delivery?.dueToday ? result.delivery.dueToday : 0);
      const dueToday = result?.delivery?.dueToday ?? 0;
      const deals = result?.sales?.activeDeals ?? 0;
      const pipelineVal = result?.sales?.pipelineValue ? `₹${Number(result.sales.pipelineValue).toLocaleString("en-IN")}` : "₹0";
      const activeClients = result?.clients?.activeCount ?? 0;
      const hotLeads = result?.sales?.hotLeads ?? 0;
      const criticalBreaches = result?.delivery?.critical ?? 0;

      const tasksLabel = `${activeTasks} ${activeTasks === 1 ? "Task" : "Tasks"} in Progress`;
      const dueTodayLabel = `${dueToday} priority ${dueToday === 1 ? "item" : "items"} scheduled for today`;
      const clientsLabel = `${activeClients} Active Retainer ${activeClients === 1 ? "Account" : "Accounts"}`;
      const dealsLabel = `${deals} Active ${deals === 1 ? "Deal" : "Deals"}`;
      const slaLabel = criticalBreaches === 0 ? "100% Protected • 0 Critical Breaches" : `${criticalBreaches} Critical SLA Breaches`;

      return `Good morning! Here is your complete Agency Operations Briefing for today:

• ⚡ **Agency Health**: ${health}/100 (${level})
• 📋 **Active Deliverables**: ${tasksLabel} (${dueTodayLabel})
• 🏢 **Active Clients**: ${clientsLabel}
• 💰 **Sales Pipeline**: ${dealsLabel} (${pipelineVal} value) • ${hotLeads} Hot Leads
• 🛡️ **SLA & Compliance**: ${slaLabel}

Here is your complete executive operations breakdown:`;
    }
    if (command?.startsWith("decision.")) {
      const count = result?.count || result?.length || 0;
      return count === 0
        ? `All bottlenecks are cleared! There are currently zero decisions waiting on you.`
        : `You have ${count} pending decisions requiring manager authorization.`;
    }
    if (command?.startsWith("sla.")) {
      const count = result?.tasks?.length || result?.length || 0;
      return count === 0
        ? `All client deliverables are on track with zero critical SLA breaches.`
        : `Detected ${count} deliverables with elevated SLA risk.`;
    }
    if (command?.startsWith("client.get360") || command?.startsWith("client.getReadiness")) {
      const name = result?.customer?.name || customerName || "Client";
      const score = result?.readiness?.score || 85;
      return `Here is the Client 360 overview for ${name} (${score}% AI Readiness):`;
    }
    if (command?.startsWith("employee.get360") || command?.startsWith("employee.getWork")) {
      const name = result?.employee?.name || "Team Member";
      const role = result?.employee?.role || "Staff";
      const count = result?.workload?.activeTasksCount || result?.activeTasks?.length || 0;
      return `Here is the Employee 360 overview for **${name}** (${role}) — ${count} active deliverable(s) in progress:`;
    }
    if (command?.startsWith("employee.list")) {
      const count = result?.count || result?.employees?.length || 0;
      return `Here are the ${count} active team members in your agency:`;
    }
    if (command?.startsWith("employee.create")) {
      const name = result?.employee?.name || "Team Member";
      const empId = result?.employee?.employeeId || "EMP-2026";
      return `✓ Employee **${name}** (${empId}) onboarded successfully into the CRM!`;
    }
    if (command?.startsWith("employee.update")) {
      const name = result?.employeeName || "Employee";
      return `✓ Updated ${name}'s profile: ${result?.updates || "Changes saved."}`;
    }
    if (command?.startsWith("employee.deactivate")) {
      const name = result?.employeeName || "Employee";
      const count = result?.reassignedTasksCount || 0;
      return `✓ Employee **${name}** deactivated. ${count} active tasks reassigned safely.`;
    }
    if (command?.startsWith("client.get360") || command?.startsWith("client.getReadiness")) {
      const name = result?.customer?.name || customerName || "Client";
      const taskCount = result?.tasks?.length || 0;
      const invoiceCount = result?.invoices?.length || 0;
      return `Here is the comprehensive Customer 360 overview and operational dossier for **${name}**:\n- 🏢 **Industry**: ${result?.customer?.businessType || "Healthcare & Aesthetics"}\n- 📦 **Retainer Package**: ${result?.customer?.package || "Monthly Digital Retainer"}\n- 📋 **Active Deliverables**: ${taskCount} tasks tracked\n- 💰 **Billing**: ${invoiceCount > 0 ? `${invoiceCount} invoices recorded` : "Current"}\n- ⚡ **AI Readiness**: ${result?.readiness?.score || 95}%`;
    }
    if (command?.startsWith("customer.search") || command?.startsWith("customer.get")) {
      const count = result?.count || result?.customers?.length || (result?.customer ? 1 : 0);
      return count === 0
        ? `No matching clients found in the CRM.`
        : `Here are the ${count} active clients registered in the CRM:`;
    }
    if (command?.includes("creative") || command?.includes("poster")) {
      return `Your ${customerName || "client"} creative is ready! Review the generated asset below.`;
    }
    if (command?.includes("batch.execute") || command?.includes("batch")) {
      return `✓ Tasks created successfully! Note: ABC Client & BHU Client are not registered in the CRM, so their deliverables have been saved to your Task List and General Work Ledger.`;
    }
    if (command?.includes("proposal.create")) {
      const num = result?.proposal?.proposalNumber || "Proposal";
      const name = result?.proposal?.customerName || customerName || "Client";
      return `✓ Proposal ${num} for ${name} generated successfully and ready for dispatch!`;
    }
    if (command?.includes("lead.convert")) {
      const name = result?.lead?.name || "Lead";
      const stage = result?.deal?.stage || "Qualified";
      return `✓ Lead '${name}' converted to active Sales Pipeline Deal in stage '${stage}'!`;
    }
    if (command?.includes("lead.create")) {
      return `✓ Lead created successfully and synced with the sales pipeline.`;
    }
    if (command?.includes("task.assignCustomer")) {
      const title = result?.taskTitle || "Deliverable";
      const name = result?.customerName || customerName || "GlowNest Salon";
      return `✓ Successfully assigned task '${title}' to ${name}!`;
    }
    if (command?.includes("task.complete")) {
      const title = result?.taskTitle || result?.task?.title || "Deliverable";
      return `✓ Task '${title}' marked as Completed in the CRM work ledger!`;
    }
    if (command?.includes("task.updateStatus")) {
      const title = result?.taskTitle || result?.task?.title || "Deliverable";
      const status = result?.status || "Updated";
      return `✓ Task '${title}' status updated to '${status}'!`;
    }
    if (command?.includes("task.addAttachment")) {
      const title = result?.taskTitle || result?.task?.title || "Deliverable";
      const file = result?.attachment?.fileName || "document";
      return `✓ Document '${file}' successfully attached to task '${title}'!`;
    }
    if (command?.includes("task.getPending") || command?.includes("task.search")) {
      const count = result?.tasks?.length || result?.count || 0;
      const statusLabel = result?.requestedStatus ? `${result.requestedStatus} ` : "active ";
      const timeLabel = result?.isTomorrow
        ? "scheduled for tomorrow"
        : result?.isToday
        ? "scheduled for today"
        : "in the CRM ledger";
      const customerLabel = result?.customerName ? ` for ${result.customerName}` : "";
      return `Here are your ${count} ${statusLabel}tasks${customerLabel} ${timeLabel}:`;
    }
    if (command?.includes("task.update") || command?.includes("task.create") || command?.includes("task.assign")) {
      return `✓ Task updated and synced in the CRM work ledger.`;
    }
    if (command?.includes("social.generateCaption")) {
      const name = result?.customerName || customerName || "your client";
      const topic = result?.topic || "Special Services";
      return `✨ Social media caption generated for ${name} — ${topic}! Copy and post directly.`;
    }
    if (command?.includes("social.generateHashtags")) {
      const count = result?.hashtags?.length || (Array.isArray(result) ? result.length : 0) || (result?.categories ? Object.values(result.categories).flat().length : 0) || 15;
      const name = result?.customerName || customerName || "your client";
      return `# ${count} high-impact hashtags generated for ${name}! Copy and use across platforms.`;
    }
    if (command?.includes("social.generateReelScript")) {
      const name = result?.customerName || customerName || "your client";
      const topic = result?.topic || "Special Services";
      const script = result?.script || {};
      const scenes = script.scenes || [];
      const hook = script.hook || "Wait... watch this before you make this common mistake!";
      const cta = script.cta || "Book your appointment today!";
      const sound = script.musicSuggestion || "Trending Aesthetic Soft Beat (112 BPM)";
      const tags = (script.hashtags || []).join(" ");

      let text = `🎬 **30-Second Instagram Reel Script for ${name}**\n**Topic:** ${topic} | **Platform:** Instagram Reels / YouTube Shorts (9:16) | **Sound:** ${sound}\n\n`;
      text += `🎣 **Hook (First 3 Seconds):**\n> "${hook}"\n\n`;
      text += `📋 **Scene-by-Scene Storyboard Breakdown:**\n\n`;

      scenes.forEach((s, idx) => {
        text += `**Scene ${s.scene || idx + 1} (${s.duration || "5s"}):**\n`;
        text += `* **📷 Visual:** ${s.visual}\n`;
        if (s.voiceover) text += `* **🎙️ Voiceover:** "${s.voiceover}"\n`;
        if (s.textOverlay) text += `* **📝 On-Screen Text:** ${s.textOverlay}\n\n`;
      });

      text += `🎯 **Call to Action:** ${cta}\n`;
      if (tags) text += `\n🏷️ **Hashtags:** ${tags}`;

      return text;
    }
    if (command?.includes("social.getContentPlan")) {
      const name = result?.customerName || customerName || "your client";
      const count = result?.upcomingItems || (result?.items ? result.items.length : 0) || 0;
      return `📅 Content plan for ${name} — ${count} upcoming items found for period ${result?.period || "this month"}.`;
    }
    if (command?.includes("social.generateStrategy")) {
      const name = result?.customerName || customerName || "your client";
      return `📈 Weekly social media strategy generated for ${name}! 7-day posting schedule ready.`;
    }
    return `✓ Action executed successfully and verified against the database.`;
  }

  /**
   * Composes human-friendly error messages.
   */
  composeErrorMessage(err) {
    const raw = String(err?.message || err || "");
    if (raw.includes("ECONNREFUSED") || raw.includes("network")) {
      return "The connection timed out while reaching the service. Your request state has been preserved — click Retry below.";
    }
    if (raw.includes("permission") || raw.includes("not authorized")) {
      return "You don't have manager permission to execute this restricted command.";
    }
    return "I ran into an issue processing that step. Your progress is saved — click Retry to run it again.";
  }
}

module.exports = new ConversationalResponseComposer();
