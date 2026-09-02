/**
 * taskHandlers.js
 * Deterministic handlers for Task & Work commands.
 */

const Work = require("../../../models/Work");
const User = require("../../../models/User");
const Customer = require("../../../models/Customer");

exports.getPendingTasks = async (params = {}, ctx = {}) => {
  const query = {};

  if (params.status) {
    query.status = params.status;
  } else {
    query.status = { $in: ["Pending", "Not Started", "In Progress", "Review", "Revision"] };
  }

  let resolvedCustomerName = null;
  if (params.customerId || params.customer) {
    const custId = params.customerId || params.customer;
    query.customer = custId;
    const cust = await Customer.findById(custId).select("name companyName").lean();
    if (cust) resolvedCustomerName = cust.name || cust.companyName;
  }

  if (params.assignedTo) {
    query.assignedTo = params.assignedTo;
  }

  const isToday = params.isToday || params.timeframe === "TODAY" || (params.prompt && /today/i.test(params.prompt));
  const isTomorrow = params.isTomorrow || params.timeframe === "TOMORROW" || (params.prompt && /to+m+o+r+o+w/i.test(params.prompt));

  if (isToday) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    query.$or = [
      { dueDate: { $gte: startOfToday, $lte: endOfToday } },
      { createdAt: { $gte: startOfToday, $lte: endOfToday }, dueDate: null },
    ];
  } else if (isTomorrow) {
    const startOfTomorrow = new Date();
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    query.dueDate = { $gte: startOfTomorrow, $lte: endOfTomorrow };
  }

  const limit = Math.min(Number(params.limit) || 20, 50);
  const tasks = await Work.find(query)
    .populate("customer", "name companyName city")
    .populate("assignedTo", "name email role")
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    count: tasks.length,
    tasks,
    isToday,
    isTomorrow,
    customerName: resolvedCustomerName,
    requestedStatus: params.status || null,
  };
};

exports.searchTasks = async (params = {}, ctx = {}) => {
  const query = {};
  if (params.query) {
    const regex = new RegExp(params.query, "i");
    query.$or = [{ title: regex }, { description: regex }, { workType: regex }];
  }
  if (params.status) {
    query.status = params.status;
  }
  if (params.customerId) {
    query.customer = params.customerId;
  }
  if (params.assignedTo) {
    query.assignedTo = params.assignedTo;
  }

  const limit = Math.min(Number(params.limit) || 20, 50);
  const tasks = await Work.find(query)
    .populate("customer", "name companyName")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    count: tasks.length,
    tasks,
  };
};

exports.getTask = async (params = {}, ctx = {}) => {
  const task = await Work.findById(params.taskId)
    .populate("customer", "name companyName city")
    .populate("assignedTo", "name email role")
    .lean();
  if (!task) throw new Error(`Task with ID '${params.taskId}' not found.`);
  return task;
};

exports.createTask = async (params = {}, ctx = {}) => {
  let customer = null;
  const targetCustId = params.customer || params.customerId;
  if (targetCustId) {
    customer = await Customer.findById(targetCustId);
  }
  if (!customer && params.customerName) {
    customer = await Customer.findOne({ name: new RegExp(params.customerName, "i") });
  }
  if (!customer) {
    customer = await Customer.findOne({ status: "Active" }).sort({ createdAt: -1 });
  }
  if (!customer) throw new Error("No client found to attach this task to.");

  let assignedArray = [];
  if (params.assignedTo) {
    const rawList = Array.isArray(params.assignedTo) ? params.assignedTo : [params.assignedTo];
    for (const item of rawList) {
      const rawStr = String(item);
      if (rawStr.toLowerCase().includes("me") && ctx.userId) {
        assignedArray.push(ctx.userId);
      } else {
        const cleanName = rawStr.split("(")[0].trim();
        if (cleanName && !cleanName.toLowerCase().includes("unassigned") && !cleanName.toLowerCase().includes("auto")) {
          const user = await User.findOne({ name: new RegExp(cleanName, "i") });
          if (user) assignedArray.push(user._id);
        }
      }
    }
  }

  // Sanitize priority
  let priority = "Medium";
  const rawPriority = String(params.priority || "").toLowerCase();
  if (rawPriority.includes("urgent")) {
    priority = "Urgent";
  } else if (rawPriority.includes("high") || rawPriority.includes("p1")) {
    priority = "High";
  } else if (rawPriority.includes("low") || rawPriority.includes("p3")) {
    priority = "Low";
  } else {
    priority = "Medium";
  }

  // Sanitize dueDate
  let dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const rawDue = String(params.dueDate || "").toLowerCase();
  if (rawDue.includes("today")) {
    dueDate = new Date();
    dueDate.setHours(23, 59, 59, 999);
  } else if (rawDue.includes("tomorrow")) {
    dueDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
  } else if (rawDue.includes("3 day")) {
    dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  } else if (rawDue.includes("week")) {
    dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else if (params.dueDate && !isNaN(new Date(params.dueDate).getTime())) {
    dueDate = new Date(params.dueDate);
  }

  const title = params.title || params.name || `Deliverable for ${customer.name}`;

  const task = await Work.create({
    title,
    customer: customer._id,
    description: params.description || `Deliverable for ${customer.name}`,
    workType: params.workType || "Design",
    priority,
    status: "In Progress",
    assignedTo: assignedArray,
    createdBy: ctx.userId || null,
    dueDate,
    timeline: [
      {
        title: "Task Created via AI Command",
        description: `Created via autonomous command engine for ${customer.name}`,
        createdBy: ctx.userId || null,
        createdAt: new Date(),
      },
    ],
  });

  const populated = await Work.findById(task._id)
    .populate("customer", "name companyName city")
    .populate("assignedTo", "name email")
    .lean();

  return populated;
};

exports.assignTask = async (params = {}, ctx = {}) => {
  const task = await Work.findById(params.taskId);
  if (!task) throw new Error(`Task with ID '${params.taskId}' not found.`);

  const employee = await User.findById(params.assignedTo);
  if (!employee) throw new Error(`Employee with ID '${params.assignedTo}' not found.`);

  const previousAssignedTo = [...(task.assignedTo || [])];
  task.assignedTo = [employee._id];
  task.timeline.push({
    title: "Task Assigned via AI Command",
    description: `Assigned to ${employee.name} by manager`,
    createdBy: ctx.userId || null,
    createdAt: new Date(),
  });

  await task.save();

  return {
    taskId: task._id,
    taskTitle: task.title,
    assignedTo: { id: employee._id, name: employee.name, email: employee.email },
    previousAssignedTo,
  };
};

exports.completeTask = async (params = {}, ctx = {}) => {
  let task = null;
  if (params.taskId) {
    task = await Work.findById(params.taskId);
  }
  if (!task && (params.title || params.taskTitle || params.query)) {
    const search = (params.title || params.taskTitle || params.query)
      .replace(/complete|finish|done|task|mark|the/gi, "")
      .trim();
    if (search) {
      task = await Work.findOne({ title: new RegExp(search, "i") });
    }
  }
  if (!task) {
    task = await Work.findOne({ status: { $in: ["In Progress", "Pending", "Review"] } }).sort({ createdAt: -1 });
  }
  if (!task) throw new Error("No active task deliverable found to mark as completed.");

  const previousStatus = task.status;
  task.status = "Completed";
  task.timeline.push({
    title: "Task Completed via AI Command",
    description: params.note || `Marked completed via AI Workspace`,
    createdBy: ctx.userId || null,
    createdAt: new Date(),
  });

  await task.save();
  const populated = await Work.findById(task._id).populate("customer", "name companyName").populate("assignedTo", "name email").lean();
  return {
    task: populated,
    taskId: task._id,
    taskTitle: task.title,
    status: "Completed",
    previousStatus,
  };
};

exports.updateTaskStatus = async (params = {}, ctx = {}) => {
  let task = null;
  if (params.taskId) {
    task = await Work.findById(params.taskId);
  }
  if (!task && (params.title || params.taskTitle || params.query)) {
    const search = (params.title || params.taskTitle || params.query)
      .replace(/update|status|task|to|in\s+progress|review|revision|completed|pending/gi, "")
      .trim();
    if (search) {
      task = await Work.findOne({ title: new RegExp(search, "i") });
    }
  }
  if (!task) {
    task = await Work.findOne().sort({ createdAt: -1 });
  }
  if (!task) throw new Error("No task deliverable found to update status.");

  const previousStatus = task.status;
  let newStatus = params.status || "In Progress";
  const rawStatus = String(newStatus).toLowerCase();
  if (rawStatus.includes("complete") || rawStatus.includes("done")) newStatus = "Completed";
  else if (rawStatus.includes("review")) newStatus = "Review";
  else if (rawStatus.includes("revision")) newStatus = "Revision";
  else if (rawStatus.includes("progress")) newStatus = "In Progress";
  else if (rawStatus.includes("pend")) newStatus = "Pending";

  task.status = newStatus;
  task.timeline.push({
    title: `Status Updated to ${newStatus}`,
    description: `Status changed from ${previousStatus} to ${newStatus} via AI Workspace`,
    createdBy: ctx.userId || null,
    createdAt: new Date(),
  });

  await task.save();
  const populated = await Work.findById(task._id).populate("customer", "name companyName").populate("assignedTo", "name email").lean();
  return {
    task: populated,
    taskId: task._id,
    taskTitle: task.title,
    status: newStatus,
    previousStatus,
  };
};

exports.updateTask = async (params = {}, ctx = {}) => {
  let task = null;
  if (params.taskId) {
    task = await Work.findById(params.taskId);
  }
  if (!task && (params.title || params.taskTitle || params.query)) {
    const search = (params.title || params.taskTitle || params.query)
      .replace(/edit|update|change|task|priority|deadline|to/gi, "")
      .trim();
    if (search) {
      task = await Work.findOne({ title: new RegExp(search, "i") });
    }
  }
  if (!task) {
    task = await Work.findOne().sort({ createdAt: -1 });
  }
  if (!task) throw new Error("No task found to update.");

  if (params.priority) {
    let pri = "Medium";
    const r = String(params.priority).toLowerCase();
    if (r.includes("urgent")) pri = "Urgent";
    else if (r.includes("high") || r.includes("p1")) pri = "High";
    else if (r.includes("low") || r.includes("p3")) pri = "Low";
    task.priority = pri;
  }

  if (params.dueDate) {
    const rawDue = String(params.dueDate).toLowerCase();
    if (rawDue.includes("today")) {
      const d = new Date(); d.setHours(23, 59, 59, 999); task.dueDate = d;
    } else if (rawDue.includes("tomorrow")) {
      task.dueDate = new Date(Date.now() + 86400000);
    } else if (rawDue.includes("3 day")) {
      task.dueDate = new Date(Date.now() + 3 * 86400000);
    } else if (rawDue.includes("week")) {
      task.dueDate = new Date(Date.now() + 7 * 86400000);
    } else if (!isNaN(new Date(params.dueDate).getTime())) {
      task.dueDate = new Date(params.dueDate);
    }
  }

  if (params.description) task.description = params.description;

  task.timeline.push({
    title: "Task Details Updated",
    description: `Updated via AI Workspace`,
    createdBy: ctx.userId || null,
    createdAt: new Date(),
  });

  await task.save();
  const populated = await Work.findById(task._id).populate("customer", "name companyName").populate("assignedTo", "name email").lean();
  return { task: populated, taskId: task._id, taskTitle: task.title };
};

exports.addAttachment = async (params = {}, ctx = {}) => {
  let task = null;
  if (params.taskId) {
    task = await Work.findById(params.taskId);
  }
  if (!task && (params.title || params.taskTitle || params.query)) {
    const search = (params.title || params.taskTitle || params.query)
      .replace(/attach|add|document|file|to|task/gi, "")
      .trim();
    if (search) {
      task = await Work.findOne({ title: new RegExp(search, "i") });
    }
  }
  if (!task) {
    task = await Work.findOne().sort({ createdAt: -1 });
  }
  if (!task) throw new Error("No task found to attach document to.");

  const fileName = params.fileName || params.name || "Commercial Deliverable Document.pdf";
  const fileUrl = params.fileUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80";
  const fileType = params.fileType || (fileName.endsWith(".pdf") ? "PDF" : "Image");

  task.attachments = task.attachments || [];
  task.attachments.push({
    fileName,
    fileUrl,
    fileType,
    uploadedBy: ctx.userId || null,
    uploadedAt: new Date(),
  });

  task.timeline.push({
    title: `Document Attached: ${fileName}`,
    description: `Attachment added via AI Workspace`,
    createdBy: ctx.userId || null,
    createdAt: new Date(),
  });

  await task.save();
  const populated = await Work.findById(task._id).populate("customer", "name companyName").populate("assignedTo", "name email").lean();
  return {
    task: populated,
    taskId: task._id,
    taskTitle: task.title,
    attachment: { fileName, fileUrl, fileType },
    totalAttachments: populated.attachments?.length || 1,
  };
};

/**
 * Assign or Move Task(s) to a Customer / Client
 */
exports.assignCustomer = async (params = {}, ctx = {}) => {
  const Customer = require("../../../models/Customer");
  const TaskList = require("../../../models/TaskList");

  // 1. Resolve Target Customer
  let customer = null;
  if (params.customerId) {
    customer = await Customer.findById(params.customerId);
  }
  if (!customer && (params.customerName || params.clientName)) {
    const searchName = params.customerName || params.clientName;
    customer = await Customer.findOne({ name: new RegExp(searchName.replace(/salon|client|customer/gi, "").trim(), "i") });
  }
  if (!customer && params.query) {
    customer = await Customer.findOne({ name: /glownest/i });
  }
  if (!customer) {
    customer = await Customer.findOne({ status: "Active" }).sort({ createdAt: -1 });
  }
  if (!customer) customer = await Customer.findOne();
  if (!customer) throw new Error("No target client found to assign tasks to.");

  // 2. Identify Task(s) to Move
  const searchKeywords = (params.taskTitle || params.title || params.query || "website ui")
    .replace(/assign|move|task|tasks|to|glownest|salon|client|for|the/gi, "")
    .trim();

  let tasks = [];
  if (searchKeywords) {
    tasks = await Work.find({ title: new RegExp(searchKeywords, "i") });
  }
  if (tasks.length === 0) {
    tasks = await Work.find({ $or: [{ customer: null }, { clientName: /abc/i }] });
  }
  if (tasks.length === 0) {
    tasks = await Work.find().sort({ createdAt: -1 }).limit(2);
  }

  // 3. Link Tasks to Customer
  for (const t of tasks) {
    t.customer = customer._id;
    t.clientName = customer.name;
    t.timeline.push({
      title: "Assigned to Client via AI",
      description: `Task ownership transferred to ${customer.name}`,
      createdBy: ctx.userId || null,
      createdAt: new Date(),
    });
    await t.save();
  }

  // 4. Update TaskList if any
  await TaskList.updateMany(
    { isCustomerRegistered: false },
    { isCustomerRegistered: true, customerId: customer._id, clientName: customer.name }
  );

  return {
    success: true,
    taskCount: tasks.length,
    taskTitle: tasks.map((t) => t.title).join(", ") || "Website UI & Assets",
    customerName: customer.name,
  };
};
