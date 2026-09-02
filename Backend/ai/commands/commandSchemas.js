/**
 * commandSchemas.js
 * Parameter validation schemas and sanitizer for Universal CRM Commands.
 */

const SCHEMAS = {
  // Customer Schemas
  "customer.search": {
    fields: {
      query: { type: "string", required: false, default: "" },
      city: { type: "string", required: false },
      status: { type: "string", required: false, default: "Active" },
      limit: { type: "number", required: false, default: 10 },
    },
  },
  "customer.get": {
    fields: {
      customerId: { type: "string", required: true },
    },
  },
  "customer.create": {
    fields: {
      name: {
        type: "string",
        required: true,
        priority: 1,
        question: "What is the client or company name?",
        category: "REQUIRED",
        label: "Client / Company Name",
      },
      contactNumbers: {
        type: "phone",
        required: true,
        priority: 2,
        question: "What is the primary contact phone number?",
        category: "REQUIRED",
        parser: "phone",
        label: "Contact Number",
      },
      businessType: {
        type: "string",
        required: true,
        priority: 3,
        question: "What is the business category / industry?",
        category: "REQUIRED",
        label: "Business Type",
        default: "Digital Marketing Client",
      },
      city: {
        type: "string",
        required: false,
        priority: 4,
        question: "Which city is the client located in?",
        category: "RECOMMENDED",
        label: "City / Location",
      },
      email: {
        type: "string",
        required: false,
        priority: 5,
        question: "What is their official billing email?",
        category: "OPTIONAL",
        parser: "email",
        label: "Email Address",
      },
      branchId: {
        type: "string",
        required: false,
        priority: 6,
        category: "OPTIONAL",
        default: "BR001",
      },
    },
  },
  "customer.update": {
    fields: {
      customerId: { type: "string", required: true },
      updates: { type: "object", required: true },
    },
  },

  // Client 360 Schemas
  "client.intake": {
    fields: {
      name: { type: "string", required: true, label: "Client / Company Name" },
      contactPerson: { type: "string", required: false, label: "Contact Person" },
      phone: { type: "string", required: true, label: "Contact Phone Number" },
      email: { type: "string", required: false, label: "Email Address" },
      city: { type: "string", required: false, label: "City / Location" },
      website: { type: "string", required: false, label: "Website URL" },
      industry: { type: "string", required: false, label: "Industry / Category" },
      services: { type: "array", required: false, label: "Core Services / Products" },
      usp: { type: "string", required: false, label: "Unique Selling Proposition" },
      targetAudience: { type: "array", required: false, label: "Target Audience" },
      brandColors: { type: "array", required: false, label: "Brand Colors" },
      toneOfVoice: { type: "string", required: false, label: "Tone of Voice" },
      visualStyle: { type: "string", required: false, label: "Visual Style" },
      primaryPlatforms: { type: "array", required: false, label: "Primary Platforms" },
      postingFrequency: { type: "string", required: false, label: "Posting Frequency" },
      ctaPreferences: { type: "array", required: false, label: "Call to Action" },
      monthlyAdBudget: { type: "number", required: false, label: "Monthly Ad Budget" },
    },
  },
  "client.get360": {
    fields: {
      customerId: { type: "string", required: true },
    },
  },
  "client.update360": {
    fields: {
      customerId: { type: "string", required: true },
      section: { type: "string", required: true },
      data: { type: "object", required: true },
    },
  },
  "client.getReadiness": {
    fields: {
      customerId: { type: "string", required: true },
    },
  },

  // Lead Schemas
  "lead.search": {
    fields: {
      query: { type: "string", required: false, default: "" },
      status: { type: "string", required: false },
      leadScore: { type: "string", required: false },
      city: { type: "string", required: false },
      assignedTo: { type: "string", required: false },
      limit: { type: "number", required: false, default: 20 },
    },
  },
  "lead.get": {
    fields: {
      leadId: { type: "string", required: true },
    },
  },
  "lead.create": {
    fields: {
      name: {
        type: "string",
        required: true,
        priority: 1,
        question: "What's the company or lead name?",
        category: "REQUIRED",
        label: "Company / Lead Name",
      },
      phone: {
        type: "phone",
        required: true,
        priority: 2,
        question: "What is the contact mobile number?",
        category: "REQUIRED",
        parser: "phone",
        label: "Mobile Number",
      },
      requirements: {
        type: "array",
        required: true,
        priority: 3,
        question: "What service or requirement are they interested in?",
        category: "REQUIRED",
        parser: "services",
        label: "Requirements",
      },
      contactPerson: {
        type: "string",
        required: false,
        priority: 4,
        question: "What's the contact person's name?",
        category: "RECOMMENDED",
        label: "Contact Person",
      },
      city: {
        type: "string",
        required: false,
        priority: 5,
        question: "Where is the client/lead located?",
        category: "RECOMMENDED",
        label: "Location / City",
      },
      email: {
        type: "string",
        required: false,
        priority: 6,
        question: "Do you have their email address?",
        category: "OPTIONAL",
        parser: "email",
        label: "Email Address",
      },
      budget: {
        type: "currency",
        required: false,
        priority: 7,
        question: "What is their approximate budget?",
        category: "OPTIONAL",
        parser: "budget",
        label: "Budget",
      },
      source: {
        type: "string",
        required: false,
        priority: 8,
        question: "What is the lead source (e.g. Instagram, Google, Referral)?",
        category: "OPTIONAL",
        label: "Lead Source",
        default: "Telecaller",
      },
      assignedTo: {
        type: "entity",
        entityType: "Employee",
        required: false,
        priority: 9,
        question: "Who should this lead be assigned to?",
        category: "OPTIONAL",
        parser: "employee",
        label: "Assigned Employee",
      },
      notes: {
        type: "string",
        required: false,
        priority: 10,
        question: "Any additional notes or preferences?",
        category: "OPTIONAL",
        label: "Notes",
        default: "",
      },
    },
  },
  "lead.assign": {
    fields: {
      leadId: { type: "string", required: true },
      assignedTo: { type: "string", required: true },
    },
  },
  "lead.followup": {
    fields: {
      leadId: { type: "string", required: true },
      callStatus: { type: "string", required: false, default: "Follow Up" },
      notes: { type: "string", required: true },
      followUpDate: { type: "date", required: false },
    },
  },
  "lead.convert": {
    fields: {
      leadId: { type: "string", required: true },
    },
  },

  // Task / Work Schemas
  "task.getPending": {
    fields: {
      customerId: { type: "string", required: false },
      assignedTo: { type: "string", required: false },
      limit: { type: "number", required: false, default: 20 },
    },
  },
  "task.search": {
    fields: {
      query: { type: "string", required: false, default: "" },
      status: { type: "string", required: false },
      customerId: { type: "string", required: false },
      assignedTo: { type: "string", required: false },
      limit: { type: "number", required: false, default: 20 },
    },
  },
  "task.get": {
    fields: {
      taskId: { type: "string", required: true },
    },
  },
  "task.create": {
    fields: {
      title: {
        type: "string",
        required: true,
        priority: 1,
        question: "What is the task title or deliverable to create?",
        category: "REQUIRED",
        label: "Task Title",
      },
      customer: {
        type: "entity",
        entityType: "Customer",
        required: true,
        priority: 2,
        question: "Which client is this task for?",
        category: "REQUIRED",
        parser: "customer",
        label: "Target Client",
      },
      workType: {
        type: "string",
        required: false,
        priority: 3,
        question: "What is the deliverable category (e.g. Graphic Design, Video, SEO, Website)?",
        category: "RECOMMENDED",
        label: "Work Type",
        default: "Graphic Design",
      },
      assignedTo: {
        type: "entity",
        entityType: "Employee",
        required: false,
        priority: 4,
        question: "Who should this task be assigned to?",
        category: "RECOMMENDED",
        parser: "employee",
        label: "Assigned Team Member",
      },
      priority: {
        type: "string",
        required: false,
        priority: 5,
        question: "What is the task priority (Urgent, High, Medium, Low)?",
        category: "OPTIONAL",
        label: "Priority",
        default: "Medium",
      },
      dueDate: {
        type: "date",
        required: false,
        priority: 6,
        question: "When is this task due?",
        category: "OPTIONAL",
        parser: "date",
        label: "Due Date",
      },
      description: {
        type: "string",
        required: false,
        priority: 7,
        question: "Any specific instructions or creative details?",
        category: "OPTIONAL",
        label: "Description",
        default: "",
      },
    },
  },
  // Employee Schemas
  "employee.create": {
    fields: {
      name: {
        type: "string",
        required: true,
        priority: 1,
        question: "What is the new team member's full name?",
        category: "REQUIRED",
        label: "Full Name",
      },
      role: {
        type: "enum",
        options: [
          "Graphic Designer",
          "UI/UX",
          "Performance Marketer",
          "Content Writer",
          "BDE",
          "Telecaller",
          "Frontend Dev",
          "Backend Dev",
          "Operational Manager",
        ],
        required: true,
        priority: 2,
        question: "What role and department will they be joining?",
        category: "REQUIRED",
        label: "Role",
      },
      phone: {
        type: "string",
        required: true,
        priority: 3,
        question: "What is their official contact number?",
        category: "REQUIRED",
        label: "Phone Number",
      },
      email: {
        type: "string",
        required: false,
        priority: 4,
        question: "What is their official email address?",
        category: "OPTIONAL",
        label: "Email Address",
      },
      branchId: {
        type: "enum",
        options: ["BR001", "BR002", "BR003"],
        required: false,
        priority: 5,
        question: "Which branch will they be assigned to?",
        category: "OPTIONAL",
        label: "Branch",
        default: "BR001",
      },
      salary: {
        type: "number",
        required: false,
        priority: 6,
        question: "What is the monthly compensation/salary?",
        category: "OPTIONAL",
        label: "Salary",
        default: 45000,
      },
      skills: {
        type: "string",
        required: false,
        priority: 7,
        question: "What are their primary skills or tools?",
        category: "OPTIONAL",
        label: "Skills",
      },
    },
  },
  "employee.get360": {
    fields: {
      employeeId: { type: "string", required: false },
      name: { type: "string", required: false },
      query: { type: "string", required: false },
    },
  },
  "employee.update": {
    fields: {
      employeeId: { type: "string", required: false },
      name: { type: "string", required: false },
      role: { type: "string", required: false },
      salary: { type: "number", required: false },
      branchId: { type: "string", required: false },
      phone: { type: "string", required: false },
    },
  },
  "employee.deactivate": {
    fields: {
      employeeId: { type: "string", required: false },
      name: { type: "string", required: false },
      reassignTo: { type: "string", required: false },
    },
  },
  "employee.list": {
    fields: {
      department: { type: "string", required: false },
      branchId: { type: "string", required: false },
      role: { type: "string", required: false },
    },
  },

  "task.assign": {
    fields: {
      taskId: {
        type: "entity",
        entityType: "Task",
        required: true,
        priority: 1,
        question: "Which task would you like to assign?",
        category: "REQUIRED",
        parser: "task",
        label: "Target Task",
      },
      assignedTo: {
        type: "entity",
        entityType: "Employee",
        required: true,
        priority: 2,
        question: "Who should I assign this task to?",
        category: "REQUIRED",
        parser: "employee",
        label: "Assignee",
      },
    },
  },
  "task.update": {
    fields: {
      taskId: { type: "string", required: true },
      status: { type: "string", required: false },
      priority: { type: "string", required: false },
      description: { type: "string", required: false },
    },
  },
  "task.assignCustomer": {
    fields: {
      taskId: { type: "string", required: false },
      customerId: { type: "string", required: false },
      customerName: { type: "string", required: false },
      query: { type: "string", required: false },
    },
  },
  "task.updateStatus": {
    fields: {
      taskId: { type: "string", required: false },
      status: { type: "string", required: false },
      title: { type: "string", required: false },
      query: { type: "string", required: false },
    },
  },
  "task.complete": {
    fields: {
      taskId: { type: "string", required: true },
      note: { type: "string", required: false, default: "Task marked completed via AI command" },
    },
  },

  // Content Schemas
  "content.getPending": {
    fields: {
      customerId: { type: "string", required: false },
      limit: { type: "number", required: false, default: 20 },
    },
  },
  "content.search": {
    fields: {
      query: { type: "string", required: false, default: "" },
      customerId: { type: "string", required: false },
      approvalStatus: { type: "string", required: false },
    },
  },
  "content.create": {
    fields: {
      title: { type: "string", required: true },
      customerId: { type: "string", required: true },
      headline: { type: "string", required: false, default: "" },
      caption: { type: "string", required: false, default: "" },
      platforms: { type: "array", required: false, default: ["Instagram", "Facebook"] },
      scheduledFor: { type: "date", required: false },
    },
  },
  "content.approve": {
    fields: {
      contentItemId: { type: "string", required: true },
    },
  },
  "content.reject": {
    fields: {
      contentItemId: { type: "string", required: true },
      reason: { type: "string", required: false, default: "Rejected by manager" },
    },
  },

  // Payment Schemas
  "payment.getDue": {
    fields: {
      customerId: { type: "string", required: false },
      limit: { type: "number", required: false, default: 20 },
    },
  },
  "payment.getOverdue": {
    fields: {
      customerId: { type: "string", required: false },
      limit: { type: "number", required: false, default: 20 },
    },
  },
  "payment.getClientHistory": {
    fields: {
      customerId: { type: "string", required: true },
    },
  },
  "payment.record": {
    fields: {
      customerId: {
        type: "entity",
        entityType: "Customer",
        required: true,
        priority: 1,
        question: "Which client or customer is this payment for?",
        category: "REQUIRED",
        parser: "customer",
        label: "Customer / Client",
      },
      amount: {
        type: "currency",
        required: true,
        priority: 2,
        question: "How much payment was collected (amount in ₹)?",
        category: "REQUIRED",
        parser: "budget",
        label: "Payment Amount",
      },
      paymentMode: {
        type: "string",
        required: false,
        priority: 3,
        question: "What payment mode was used (UPI, Bank Transfer, Cash, Cheque)?",
        category: "RECOMMENDED",
        label: "Payment Mode",
        default: "UPI",
      },
      referenceNumber: {
        type: "string",
        required: false,
        priority: 4,
        question: "Do you have a transaction reference or receipt ID?",
        category: "OPTIONAL",
        label: "Reference Number",
        default: "",
      },
    },
  },

  // Report Schemas
  "report.revenue": {
    fields: {
      period: { type: "string", required: false, default: "this_month" },
      branchId: { type: "string", required: false },
    },
  },
  "report.client": {
    fields: {
      customerId: { type: "string", required: true },
    },
  },
  "report.tasks": {
    fields: {
      customerId: { type: "string", required: false },
      status: { type: "string", required: false },
    },
  },
  "report.leads": {
    fields: {
      period: { type: "string", required: false, default: "this_month" },
      branchId: { type: "string", required: false },
    },
  },
  "report.payments": {
    fields: {
      period: { type: "string", required: false, default: "this_month" },
    },
  },

  // Employee Schemas
  "employee.search": {
    fields: {
      query: { type: "string", required: false, default: "" },
      role: { type: "string", required: false },
      status: { type: "string", required: false, default: "Active" },
    },
  },
  "employee.get": {
    fields: {
      employeeId: { type: "string", required: true },
    },
  },

  // ----------------------------------------------------
  // PHASE 5B: ZERO-TOUCH CLIENT PIPELINE SCHEMAS
  // ----------------------------------------------------
  "client.previewPipeline": {
    fields: {
      customerId: { type: "string", required: true },
      packageId: { type: "string", required: false },
      month: { type: "number", required: false },
      year: { type: "number", required: false },
    },
  },
  "client.generatePipeline": {
    fields: {
      customerId: { type: "string", required: true },
      packageId: { type: "string", required: false },
      month: { type: "number", required: false },
      year: { type: "number", required: false },
      deliverables: { type: "array", required: false },
    },
  },
  "client.regeneratePipeline": {
    fields: {
      customerId: { type: "string", required: true },
      packageId: { type: "string", required: false },
      month: { type: "number", required: false },
      year: { type: "number", required: false },
    },
  },
  "lead.convertAndOnboard": {
    fields: {
      leadId: { type: "string", required: true },
      packageId: { type: "string", required: false },
      month: { type: "number", required: false },
      year: { type: "number", required: false },
    },
  },
  "workload.getCapacity": {
    fields: {
      department: { type: "string", required: false },
    },
  },
  "workload.suggestAssignee": {
    fields: {
      preferredRole: { type: "string", required: false, default: "Graphic Designer" },
    },
  },
  "package.list": {
    fields: {},
  },
  "package.get": {
    fields: {
      packageId: { type: "string", required: true },
    },
  },

  // ----------------------------------------------------
  // PHASE 5C: CONTENT INTELLIGENCE & CALENDAR SCHEMAS
  // ----------------------------------------------------
  "content.previewCalendar": {
    fields: {
      customerId: { type: "string", required: true },
      month: { type: "number", required: false },
      year: { type: "number", required: false },
      duration: { type: "number", required: false, default: 30 },
    },
  },
  "content.generateCalendar": {
    fields: {
      customerId: { type: "string", required: true },
      month: { type: "number", required: false },
      year: { type: "number", required: false },
      items: { type: "array", required: false },
    },
  },
  "content.regenerateCalendar": {
    fields: {
      customerId: { type: "string", required: true },
      month: { type: "number", required: false },
      year: { type: "number", required: false },
    },
  },
  "content.batchApprove": {
    fields: {
      calendarId: { type: "string", required: true },
      itemKeys: { type: "array", required: false },
    },
  },
  "content.getOpportunities": {
    fields: {
      days: { type: "number", required: false, default: 30 },
      industry: { type: "string", required: false },
    },
  },

  // ----------------------------------------------------
  // PHASE 5D: SLA GUARDIAN SCHEMAS
  // ----------------------------------------------------
  "sla.scan": {
    fields: {},
  },
  "sla.getAtRiskTasks": {
    fields: {},
  },
  "sla.getCritical": {
    fields: {},
  },
  "sla.getCriticalTasks": {
    fields: {},
  },
  "sla.explainRisk": {
    fields: {
      workId: { type: "string", required: true },
    },
  },
  "sla.rebalanceWorkload": {
    fields: {
      incidentIds: { type: "array", required: false },
    },
  },
  "sla.reassignTask": {
    fields: {
      workId: { type: "string", required: true },
      targetEmployeeId: { type: "string", required: true },
    },
  },
  "sla.extendDeadline": {
    fields: {
      workId: { type: "string", required: true },
      hours: { type: "number", required: false, default: 24 },
    },
  },

  // ----------------------------------------------------
  // PHASE 5E: CASH-FLOW & PAYMENT RECOVERY SCHEMAS
  // ----------------------------------------------------
  "finance.scanDues": {
    fields: {},
  },
  "finance.getAgingSummary": {
    fields: {},
  },
  "finance.getExpectedCollections": {
    fields: {},
  },
  "finance.generateReminder": {
    fields: {
      invoiceId: { type: "string", required: true },
      channel: { type: "string", required: false, default: "WHATSAPP" },
    },
  },
  "finance.recordPromiseToPay": {
    fields: {
      invoiceId: { type: "string", required: true },
      promisedAmount: { type: "number", required: true },
      promisedDate: { type: "string", required: true },
      notes: { type: "string", required: false },
    },
  },
  "finance.generatePaymentLink": {
    fields: {
      invoiceId: { type: "string", required: true },
    },
  },

  // ----------------------------------------------------
  // PHASE 5F: EXECUTIVE BRIEFING SCHEMAS
  // ----------------------------------------------------
  "briefing.getCurrentBrief": {
    fields: {},
  },
  "briefing.getMorningBrief": {
    fields: {
      date: { type: "string", required: false },
    },
  },
  "briefing.getEodWrap": {
    fields: {
      date: { type: "string", required: false },
    },
  },
  "briefing.getPriorities": {
    fields: {},
  },
  "briefing.getAgencyHealth": {
    fields: {},
  },
  "briefing.getTomorrowPlan": {
    fields: {},
  },

  // ----------------------------------------------------
  // PHASE 5G: UNIFIED DECISION INBOX SCHEMAS
  // ----------------------------------------------------
  "decision.getInbox": {
    fields: {},
  },
  "decision.batchApproveSafe": {
    fields: {},
  },

  // ----------------------------------------------------
  // ADS AGENT CAMPAIGN & STRATEGY SCHEMAS
  // ----------------------------------------------------
  "ads.campaign.create": {
    fields: {
      customerId: {
        type: "string",
        required: true,
        priority: 1,
        question: "Which client is this advertising campaign for?",
        category: "REQUIRED",
        label: "Target Client",
      },
      platform: {
        type: "string",
        required: true,
        priority: 2,
        question: "Which advertising platform would you like to run on?",
        category: "REQUIRED",
        label: "Platform",
        default: "Meta",
        options: ["Meta (Facebook & Instagram)", "Google Search & Display", "Omnichannel (Meta + Google)"],
      },
      objective: {
        type: "string",
        required: true,
        priority: 3,
        question: "What is the primary campaign objective?",
        category: "REQUIRED",
        label: "Campaign Goal",
        default: "LEAD_GENERATION",
        options: ["Lead Generation", "WhatsApp Enquiries", "Direct Phone Calls", "Website Traffic", "Brand Awareness"],
      },
      conversionType: {
        type: "string",
        required: true,
        priority: 4,
        question: "Where should interested customers be directed?",
        category: "REQUIRED",
        label: "Conversion Destination",
        default: "INSTANT_FORM",
        options: ["Instant Lead Form", "Direct WhatsApp Chat", "Direct Call", "Website Landing Page"],
      },
      dailyBudget: {
        type: "number",
        required: false,
        priority: 5,
        question: "What is your target daily advertising budget?",
        category: "RECOMMENDED",
        label: "Daily Budget (₹)",
        default: 1000,
        options: ["₹500 / day", "₹1,000 / day", "₹2,000 / day", "₹5,000 / day", "Custom"],
      },
      durationDays: {
        type: "number",
        required: false,
        priority: 6,
        question: "How many days should this initial campaign flight run?",
        category: "RECOMMENDED",
        label: "Duration (Days)",
        default: 10,
        options: ["7 Days (Quick Test)", "10 Days (Recommended)", "14 Days", "30 Days (Full Month)"],
      },
      promotedServices: {
        type: "array",
        required: false,
        priority: 7,
        question: "Which specific services or products should be highlighted in the ad creative?",
        category: "RECOMMENDED",
        label: "Promoted Services",
      },
      targetLocations: {
        type: "array",
        required: false,
        priority: 8,
        question: "Which cities or local radiuses should we target?",
        category: "RECOMMENDED",
        label: "Target Locations",
      },
      creativeFormats: {
        type: "array",
        required: false,
        priority: 9,
        question: "Which creative formats do you want to generate?",
        category: "RECOMMENDED",
        label: "Creative Formats",
        default: ["Poster / Banner", "Reel / Story"],
        options: ["Poster / Banner (1:1)", "Reel / Story (9:16)", "Carousel Format", "Both Banner & Reels"],
      },
      offerDetails: {
        type: "string",
        required: false,
        priority: 10,
        category: "OPTIONAL",
        label: "Special Offer / Discount Badge",
      },
      targetAudienceNotes: {
        type: "string",
        required: false,
        priority: 11,
        category: "OPTIONAL",
        label: "Custom Audience Instructions",
      },
    },
  },

  "ads.campaign.revise": {
    fields: {
      campaignId: { type: "string", required: true },
      revisionInstruction: { type: "string", required: true },
      updatedBudget: { type: "number", required: false },
      updatedAudiences: { type: "array", required: false },
      updatedCreativeFormats: { type: "array", required: false },
    },
  },

  "ads.strategy.create": {
    fields: {
      customerId: { type: "string", required: true },
      objective: { type: "string", required: false, default: "LEAD_GENERATION" },
      monthlyBudget: { type: "number", required: false },
    },
  },

  "ads.audience.recommend": {
    fields: {
      customerId: { type: "string", required: true },
      platform: { type: "string", required: false, default: "Meta" },
      targetLocations: { type: "array", required: false },
    },
  },

  "ads.budget.recommend": {
    fields: {
      customerId: { type: "string", required: true },
      targetLeadsPerMonth: { type: "number", required: false, default: 30 },
      platform: { type: "string", required: false, default: "Meta" },
    },
  },
};

/**
 * Validates command parameters against schema
 */
exports.validateCommandParams = (commandName, params = {}) => {
  const schema = SCHEMAS[commandName];
  if (!schema) {
    // If no explicit schema, allow pass-through with empty errors
    return {
      isValid: true,
      errors: [],
      cleanParams: { ...params },
      missingParams: [],
    };
  }

  const errors = [];
  const missingParams = [];
  const cleanParams = {};

  for (const [field, rule] of Object.entries(schema.fields)) {
    const val = params[field];

    if (val === undefined || val === null || val === "") {
      if (rule.required) {
        errors.push(`Missing required parameter: '${field}' for command '${commandName}'.`);
        missingParams.push(field);
      } else if (rule.default !== undefined) {
        cleanParams[field] = rule.default;
      }
    } else {
      // Type coercion / basic check
      if (rule.type === "number") {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push(`Parameter '${field}' must be a valid number, got: ${val}`);
        } else {
          cleanParams[field] = num;
        }
      } else if (rule.type === "array") {
        cleanParams[field] = Array.isArray(val) ? val : [val];
      } else if (rule.type === "date") {
        const dateObj = new Date(val);
        cleanParams[field] = isNaN(dateObj.getTime()) ? new Date() : dateObj;
      } else {
        cleanParams[field] = val;
      }
    }
  }

  // Include any extra passed fields cleanly
  for (const [key, val] of Object.entries(params)) {
    if (cleanParams[key] === undefined && val !== undefined) {
      cleanParams[key] = val;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanParams,
    missingParams,
  };
};

exports.SCHEMAS = SCHEMAS;
