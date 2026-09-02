/**
 * entityResolver.js
 * Universal Entity Resolver for Digitalness CRM V2.
 * Resolves natural language references into MongoDB IDs with ambiguity protection.
 */

const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const User = require("../../models/User");
const Work = require("../../models/Work");
const Lead = require("../../models/Lead");
const ContentItem = require("../../models/ContentItem");

/**
 * Universal Entity Resolution Function
 */
exports.resolveEntities = async (prompt = "", explicitHints = {}) => {
  const lowerPrompt = prompt.toLowerCase();
  const result = {
    customer: null,
    location: null,
    employee: null,
    task: null,
    lead: null,
    contentItem: null,
    isAmbiguous: false,
    ambiguityDetails: null,
  };

  // 1. Resolve Customer
  if (explicitHints.customerId) {
    result.customer = await Customer.findById(explicitHints.customerId).lean();
  } else {
    const customers = await Customer.find({ status: "Active" }).lean();
    const matchedCustomers = [];

    for (const cust of customers) {
      const custName = (cust.name || "").toLowerCase().trim();
      const compName = (cust.companyName || "").toLowerCase().trim();

      // 1. Full name match
      const nameMatch = custName.length >= 3 && lowerPrompt.includes(custName);
      const compMatch = compName.length >= 3 && lowerPrompt.includes(compName);

      // 2. Normalized alias match
      const normalizedPrompt = lowerPrompt.replace(/&/g, "and").replace(/\s+/g, " ");
      const normalizedName = custName.replace(/&/g, "and").replace(/\s+/g, " ");
      const aliasMatch = normalizedName.length >= 3 && normalizedPrompt.includes(normalizedName);

      // 3. Significant first word / brand keyword match (e.g. "GlowNest" for "GlowNest Salon")
      const firstWordName = custName.split(/\s+/)[0];
      const firstWordComp = compName.split(/\s+/)[0];
      const brandWordMatch =
        (firstWordName.length >= 4 && !["salon", "hotel", "clinic", "studio", "group"].includes(firstWordName) && lowerPrompt.includes(firstWordName)) ||
        (firstWordComp.length >= 4 && !["salon", "hotel", "clinic", "studio", "group"].includes(firstWordComp) && lowerPrompt.includes(firstWordComp));

      if (nameMatch || compMatch || aliasMatch || brandWordMatch) {
        matchedCustomers.push(cust);
      }
    }

    if (matchedCustomers.length === 1) {
      result.customer = matchedCustomers[0];
    } else if (matchedCustomers.length > 1) {
      // Sort by longest matching name first
      matchedCustomers.sort((a, b) => b.name.length - a.name.length);
      const longest = matchedCustomers[0].name.toLowerCase();
      const secondLongest = matchedCustomers[1].name.toLowerCase();

      // If the top match strictly contains the second, top match wins
      if (longest.includes(secondLongest)) {
        result.customer = matchedCustomers[0];
      } else {
        // Genuine customer ambiguity
        result.isAmbiguous = true;
        result.ambiguityDetails = {
          entityType: "Customer",
          message: `Multiple customers match your request: ${matchedCustomers.map((c) => c.name).join(", ")}. Please specify.`,
          candidates: matchedCustomers.map((c) => ({ id: c._id, name: c.name, companyName: c.companyName, city: c.city })),
        };
        return result;
      }
    } else if (!result.customer) {
      // ONLY check if prompt explicitly mentioned a specific client via "for <Client>" or "client <Client>"
      const forMatch = prompt.match(/\b(?:for|client|customer|onboard)\s+([A-Za-z0-9\s&]+?)(?:\s+(?:promoting|promote|featuring|with|having|at\s+₹|at\s+rs|₹|rs\.?|\d+\s*per|\d+\s*\/day|and\s+create|to\s+create|to\s+build|to\s+complete)|\.|,|$)/i);
      if (forMatch && forMatch[1]) {
        let candidate = forMatch[1].trim();
        candidate = candidate.replace(/^(?:the|a|an|new|our)\s+/i, "").trim();
        const nonClientWords = [
          "lead", "leads", "sales", "campaign", "campaigns", "task", "tasks", "customer", "client",
          "poster", "reel", "post", "banner", "meta", "google", "today", "tomorrow", "this",
          "this customer", "this client", "deliverable", "work", "item", "website", "seo", "branding",
          "social media", "marketing", "content", "me", "us", "him", "her", "them",
          "ganesh", "chaturthi", "ganesh chaturthi", "vinayaka chavithi", "diwali", "deepavali",
          "eid", "ramzan", "navratri", "dussehra", "christmas", "new year", "independence day",
          "republic day", "raksha bandhan", "onam", "pongal", "holi", "good morning", "daily post"
        ];
        if (
          candidate.length >= 3 &&
          !nonClientWords.some(nc => candidate.toLowerCase() === nc || candidate.toLowerCase().includes(nc) || nc.includes(candidate.toLowerCase())) &&
          !candidate.toLowerCase().startsWith("task") &&
          !candidate.toLowerCase().startsWith("lead") &&
          !candidate.toLowerCase().startsWith("create")
        ) {
          result.unregisteredClientName = candidate;
        }
      }
    }
  }

  // 2. Resolve Client Location (if customer resolved)
  if (result.customer) {
    if (explicitHints.locationId) {
      result.location = await ClientLocation.findById(explicitHints.locationId).lean();
    } else {
      const locations = await ClientLocation.find({ customerId: result.customer._id, status: "Active" }).lean();
      for (const loc of locations) {
        const locName = (loc.name || "").toLowerCase();
        const locCity = (loc.city || "").toLowerCase();
        if ((locName && lowerPrompt.includes(locName)) || (locCity && lowerPrompt.includes(locCity))) {
          result.location = loc;
          break;
        }
      }
      if (!result.location && locations.length === 1) {
        result.location = locations[0];
      }
    }
  }

  // 3. Resolve Employee / User
  if (explicitHints.employeeId) {
    result.employee = await User.findById(explicitHints.employeeId).select("-password").lean();
  } else {
    // Look for active employees / managers
    const employees = await User.find({ status: "Active" }).select("name email role").lean();
    const matchedEmployees = [];

    for (const emp of employees) {
      const fullName = (emp.name || "").toLowerCase().trim();
      const parts = fullName.split(" ");
      const firstName = parts[0] || "";

      // Exact full name match
      if (fullName && lowerPrompt.includes(fullName)) {
        matchedEmployees.push({ emp, score: 2, matchedOn: "fullName" });
      }
      // First name match (if length >= 3 to avoid short tokens like "al", "an")
      else if (firstName.length >= 3) {
        // Regex word boundary match for first name
        const wordRegex = new RegExp(`\\b${firstName}\\b`, "i");
        if (wordRegex.test(lowerPrompt)) {
          matchedEmployees.push({ emp, score: 1, matchedOn: "firstName" });
        }
      }
    }

    if (matchedEmployees.length === 1) {
      result.employee = matchedEmployees[0].emp;
    } else if (matchedEmployees.length > 1) {
      // Prioritize full name matches over first name matches
      const fullMatches = matchedEmployees.filter((m) => m.matchedOn === "fullName");
      if (fullMatches.length === 1) {
        result.employee = fullMatches[0].emp;
      } else {
        // AMBIGUITY: Multiple employees match (e.g. Ravi Kumar vs Ravi Reddy)
        result.isAmbiguous = true;
        result.ambiguityDetails = {
          entityType: "Employee",
          message: `Multiple employees found with name (${matchedEmployees.map((m) => m.emp.name).join(", ")}). Please specify the full name.`,
          candidates: matchedEmployees.map((m) => ({ id: m.emp._id, name: m.emp.name, role: m.emp.role, email: m.emp.email })),
        };
        return result;
      }
    }
  }

  // 4. Resolve Work / Task
  if (explicitHints.taskId) {
    result.task = await Work.findById(explicitHints.taskId).lean();
  } else {
    const taskQuery = {};
    if (result.customer) {
      taskQuery.customer = result.customer._id;
    }

    // Only search active/pending tasks if looking for assignment/completion
    const tasks = await Work.find({
      ...taskQuery,
      status: { $in: ["Pending", "In Progress", "Review", "Revision", "Not Started"] },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const matchedTasks = [];
    for (const t of tasks) {
      const titleLower = (t.title || "").toLowerCase();
      const descLower = (t.description || "").toLowerCase();

      let isMatch = false;
      if (lowerPrompt.includes("poster") && (titleLower.includes("poster") || descLower.includes("poster"))) {
        isMatch = true;
      } else if (lowerPrompt.includes("banner") && (titleLower.includes("banner") || descLower.includes("banner"))) {
        isMatch = true;
      } else if (lowerPrompt.includes("post") && (titleLower.includes("post") || descLower.includes("post"))) {
        isMatch = true;
      } else if (titleLower.length >= 4 && lowerPrompt.includes(titleLower)) {
        isMatch = true;
      }

      if (isMatch) {
        matchedTasks.push(t);
      }
    }

    if (matchedTasks.length === 1) {
      result.task = matchedTasks[0];
    } else if (matchedTasks.length > 1) {
      // If customer was explicitly resolved, pick the most recent pending deliverable
      if (result.customer) {
        result.task = matchedTasks[0];
      } else {
        // If no customer resolved and multiple tasks match, check ambiguity
        result.task = matchedTasks[0];
      }
    }
  }

  // 5. Resolve Lead
  if (explicitHints.leadId) {
    result.lead = await Lead.findById(explicitHints.leadId).lean();
  } else {
    const leads = await Lead.find().sort({ createdAt: -1 }).limit(50).lean();
    for (const l of leads) {
      const name = (l.name || "").toLowerCase();
      if (name.length >= 3 && lowerPrompt.includes(name)) {
        result.lead = l;
        break;
      }
    }
  }

  return result;
};
