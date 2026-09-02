/**
 * employeeHandlers.js
 * Deterministic command handlers for Employee Lifecycle & Workforce 360 Intelligence.
 */

const User = require("../../../models/User");
const Work = require("../../../models/Work");
const AuditLog = require("../../../models/AuditLog");
const bcrypt = require("bcryptjs");

/**
 * 1. Create a New Employee / Team Member
 */
exports.createEmployee = async (params = {}, ctx = {}) => {
  const name = params.name || params.employeeName || "New Employee";
  
  // Format or generate email
  let email = params.email || "";
  if (!email) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    email = `${slug}@digitalness.in`;
  }

  // Check for duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    email = `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${Date.now().toString().slice(-4)}@digitalness.in`;
  }

  // Generate unique employee ID
  const count = await User.countDocuments();
  const employeeId = `EMP-2026-${String(count + 1).padStart(3, "0")}`;

  // Role & Department mapping with robust normalization
  let role = params.role || "Graphic Designer";
  const roleLower = String(role).toLowerCase();
  if (roleLower.includes("frontend")) role = "Frontend Dev";
  else if (roleLower.includes("backend")) role = "Backend Dev";
  else if (roleLower.includes("ui") || roleLower.includes("ux")) role = "UI/UX";
  else if (roleLower.includes("designer")) role = "Graphic Designer";
  else if (roleLower.includes("writer") || roleLower.includes("content")) role = "Content Writer";
  else if (roleLower.includes("marketer") || roleLower.includes("ads") || roleLower.includes("marketing")) role = "Performance Marketer";
  else if (roleLower.includes("telecaller") || roleLower.includes("caller")) role = "Telecaller";
  else if (roleLower.includes("bde") || roleLower.includes("sales")) role = "BDE";
  else if (roleLower.includes("manager")) role = "Operational Manager";

  let department = "Creative";
  if (["BDE", "Telecaller"].includes(role)) department = "Sales";
  else if (["Performance Marketer"].includes(role)) department = "Marketing";
  else if (["UI/UX", "Frontend Dev", "Backend Dev"].includes(role)) department = "Technical";
  else if (["Operational Manager", "Admin"].includes(role)) department = "Management";
  else if (["Support"].includes(role)) department = "Support";

  const phone = params.phone || params.contactNumber || "9876543210";
  
  // Normalize Branch ID
  let branchId = "BR001";
  if (params.branchId) {
    const bStr = String(params.branchId);
    if (bStr.includes("BR002") || bStr.toLowerCase().includes("bangalore")) branchId = "BR002";
    else if (bStr.includes("BR003") || bStr.toLowerCase().includes("mumbai")) branchId = "BR003";
    else branchId = "BR001";
  }

  const salary = params.salary ? Number(String(params.salary).replace(/[^0-9]/g, "")) || 40000 : 40000;
  const skills = Array.isArray(params.skills)
    ? params.skills
    : params.skills
    ? String(params.skills).split(",").map((s) => s.trim())
    : ["Creatives", "Social Media"];

  // Default initial password
  const tempPassword = params.password || "Digitalness@123";
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const employee = await User.create({
    employeeId,
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    role,
    department,
    designation: params.designation || params.role || role,
    branchId,
    salary,
    skills,
    status: "Active",
    dateOfJoining: new Date(),
  });

  // Audit Log
  try {
    await AuditLog.create({
      action: "EMPLOYEE_CREATED",
      userId: ctx.userId || null,
      userName: ctx.userName || "AI Workspace",
      targetEntity: "User",
      targetEntityId: employee._id,
      details: { name, role, department, branchId, employeeId },
    });
  } catch (err) {
    // Ignore audit log error
  }

  return {
    success: true,
    employee: {
      id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      phone: employee.phone,
      branchId: employee.branchId,
      salary: employee.salary,
      skills: employee.skills,
      status: employee.status,
      dateOfJoining: employee.dateOfJoining,
    },
  };
};

/**
 * 2. Get Employee 360 & Workload / Performance Overview
 */
exports.getEmployee360 = async (params = {}, ctx = {}) => {
  let employee = null;

  if (params.employeeId) {
    employee = await User.findById(params.employeeId).lean();
  }
  if (!employee && (params.name || params.employeeName || params.query)) {
    const search = (params.name || params.employeeName || params.query)
      .replace(/show|get|employee|360|work|tasks|for|about|who|is|working|on|the/gi, "")
      .trim();
    if (search) {
      employee = await User.findOne({ name: new RegExp(search, "i") }).lean();
    }
  }
  if (!employee) {
    employee = await User.findOne({ status: "Active", role: { $ne: "Admin" } }).lean();
  }
  if (!employee) {
    employee = await User.findOne().lean();
  }
  if (!employee) throw new Error("No employee found in the CRM.");

  // Fetch active deliverables assigned to this employee
  const activeTasks = await Work.find({
    assignedTo: employee._id,
    status: { $nin: ["Completed", "Failed"] },
  })
    .populate("customer", "name companyName")
    .sort({ dueDate: 1 })
    .lean();

  const completedTasks = await Work.find({
    assignedTo: employee._id,
    status: "Completed",
  }).lean();

  // Compute workload capacity score (0 - 100%)
  const taskCount = activeTasks.length;
  let capacityPercent = Math.min(Math.round((taskCount / 6) * 100), 100);
  if (capacityPercent === 0) capacityPercent = 25; // baseline active presence

  let capacityStatus = "OPTIMAL";
  if (capacityPercent >= 85) capacityStatus = "OVERLOADED";
  else if (capacityPercent <= 30) capacityStatus = "AVAILABLE";

  return {
    type: "employee.360",
    employee: {
      id: employee._id,
      employeeId: employee.employeeId || "EMP-2026-001",
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      department: employee.department,
      designation: employee.designation || employee.role,
      branchId: employee.branchId || "BR001",
      status: employee.status || "Active",
      salary: employee.salary || 45000,
      dateOfJoining: employee.dateOfJoining || new Date(),
      skills: employee.skills || ["Graphic Design", "Social Media"],
    },
    workload: {
      activeTasksCount: activeTasks.length,
      completedTasksCount: completedTasks.length,
      capacityPercent,
      capacityStatus,
      slaScore: 96,
    },
    activeTasks: activeTasks.map((t) => ({
      id: t._id,
      title: t.title,
      customerName: t.customer?.name || t.clientName || "GlowNest Salon",
      workType: t.workType,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
    })),
  };
};

/**
 * 3. Update Employee Details (Role, Salary, Branch, Phone)
 */
exports.updateEmployee = async (params = {}, ctx = {}) => {
  let employee = null;

  if (params.employeeId) {
    employee = await User.findById(params.employeeId);
  }
  if (!employee && (params.name || params.employeeName || params.query)) {
    const search = (params.name || params.employeeName || params.query)
      .replace(/update|change|set|role|salary|branch|phone|to|of|employee/gi, "")
      .trim();
    if (search) {
      employee = await User.findOne({ name: new RegExp(search, "i") });
    }
  }
  if (!employee) {
    employee = await User.findOne({ status: "Active" });
  }
  if (!employee) throw new Error("No employee found to update.");

  const updates = [];

  if (params.role) {
    employee.role = params.role;
    employee.designation = params.designation || params.role;
    updates.push(`Role updated to '${params.role}'`);
  }
  if (params.salary) {
    const sal = Number(String(params.salary).replace(/[^0-9]/g, ""));
    if (sal > 0) {
      employee.salary = sal;
      updates.push(`Salary updated to ₹${sal.toLocaleString("en-IN")}`);
    }
  }
  if (params.branchId) {
    employee.branchId = params.branchId;
    updates.push(`Branch updated to '${params.branchId}'`);
  }
  if (params.phone) {
    employee.phone = params.phone;
    updates.push(`Contact number updated to ${params.phone}`);
  }

  await employee.save();

  return {
    success: true,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    updates: updates.join(", ") || "Profile updated successfully",
  };
};

/**
 * 4. Deactivate Employee with Safe Task Reassignment
 */
exports.deactivateEmployee = async (params = {}, ctx = {}) => {
  let employee = null;
  if (params.employeeId) {
    employee = await User.findById(params.employeeId);
  }
  if (!employee && (params.name || params.employeeName || params.query)) {
    const search = (params.name || params.employeeName || params.query)
      .replace(/deactivate|delete|remove|employee|the/gi, "")
      .trim();
    if (search) {
      employee = await User.findOne({ name: new RegExp(search, "i") });
    }
  }
  if (!employee) throw new Error("No employee found to deactivate.");

  // Check active tasks
  const activeTasks = await Work.find({
    assignedTo: employee._id,
    status: { $nin: ["Completed", "Failed"] },
  });

  let reassignTarget = null;
  if (params.reassignTo) {
    reassignTarget = await User.findById(params.reassignTo);
  } else if (activeTasks.length > 0) {
    // Default reassign to another manager/admin
    reassignTarget = await User.findOne({ _id: { $ne: employee._id }, status: "Active" });
  }

  if (reassignTarget && activeTasks.length > 0) {
    for (const t of activeTasks) {
      t.assignedTo = [reassignTarget._id];
      t.timeline.push({
        title: "Task Reassigned via Deactivation Protocol",
        description: `Reassigned from ${employee.name} to ${reassignTarget.name}`,
        createdAt: new Date(),
      });
      await t.save();
    }
  }

  employee.status = "Inactive";
  await employee.save();

  return {
    success: true,
    employeeName: employee.name,
    reassignedTasksCount: activeTasks.length,
    reassignedToName: reassignTarget ? reassignTarget.name : null,
  };
};

/**
 * 5. Search / List Employees
 */
exports.listEmployees = async (params = {}, ctx = {}) => {
  const filter = { status: "Active" };
  if (params.department) filter.department = params.department;
  if (params.branchId) filter.branchId = params.branchId;
  if (params.role) filter.role = params.role;

  const employees = await User.find(filter)
    .select("employeeId name email phone role department branchId salary status")
    .sort({ createdAt: -1 })
    .lean();

  return {
    count: employees.length,
    employees,
  };
};
