const bcrypt = require("bcryptjs");

const Customer = require("../models/Customer.js");
const Client = require("../models/Client.js");
const sendMail = require("../utils/sendMail");
const clientAutoProvisioningService = require("../services/clientAutoProvisioningService");

const ADMIN_ROLES = ["Admin"];
const MANAGER_ROLES = ["Operational Manager", "Branch Manager"];

const getUserId = (user) => user?._id || user?.id;

const getClientActiveStatus = () => {
  const enumValues = Client.schema.path("status")?.enumValues || [];

  if (enumValues.includes("active")) return "active";
  if (enumValues.includes("Active")) return "Active";
  if (enumValues.includes("approved")) return "approved";
  if (enumValues.includes("Approved")) return "Approved";

  return enumValues[0] || undefined;
};

const populateCustomer = (query) => {
  return query
    .populate("assignedTo", "name email phone role department branchId status")
    .populate("assignedManager", "name email phone role department branchId status")
    .populate("createdBy", "name email role branchId")
    .populate("leadId", "name businessType status")
    .populate("userId", "name email status phone businessType branchId customerId");
};

const getPrimaryPhone = (customer) => {
  if (customer?.contactNumbers?.length) return customer.contactNumbers[0];
  return customer?.contactNumber || customer?.phone || "";
};

const getCustomerEmail = (customer) => {
  return (
    customer?.email ||
    customer?.clientEmail ||
    customer?.customerEmail ||
    customer?.billingEmail ||
    ""
  );
};

const generatePassword = (name = "client") => {
  const cleanName = String(name || "client")
    .replace(/\s+/g, "")
    .slice(0, 4)
    .toLowerCase();

  const random = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName || "client"}@${random}`;
};

const normalizePayload = (body = {}) => {
  const data = { ...body };

  if (data.contactNumber && !data.contactNumbers) {
    data.contactNumbers = [data.contactNumber];
    delete data.contactNumber;
  }

  if (typeof data.contactNumbers === "string") {
    data.contactNumbers = data.contactNumbers
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof data.requirements === "string") {
    data.requirements = data.requirements
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (data.email) data.email = String(data.email).trim().toLowerCase();
  if (data.panNumber) data.panNumber = String(data.panNumber).trim().toUpperCase();
  if (data.gstNumber) data.gstNumber = String(data.gstNumber).trim().toUpperCase();

  return data;
};

const validateCustomerPayload = (data) => {
  if (!data.name) return "Customer name is required";
  if (!data.businessType) return "Business type is required";
  if (!data.branchId) return "Branch is required";

  if (!Array.isArray(data.contactNumbers) || data.contactNumbers.length === 0) {
    return "At least one contact number is required";
  }

  return null;
};

const getRoleFilter = (user) => {
  if (ADMIN_ROLES.includes(user?.role)) return {};

  if (MANAGER_ROLES.includes(user?.role)) {
    return { branchId: user.branchId };
  }

  return {
    $or: [
      { assignedTo: getUserId(user) },
      { assignedManager: getUserId(user) },
    ],
  };
};

const canAccessCustomer = (user, customer) => {
  if (!user || !customer) return false;

  if (ADMIN_ROLES.includes(user.role)) return true;

  if (MANAGER_ROLES.includes(user.role)) {
    return String(customer.branchId) === String(user.branchId);
  }

  return (
    String(customer.assignedTo?._id || customer.assignedTo) === String(getUserId(user)) ||
    String(customer.assignedManager?._id || customer.assignedManager) === String(getUserId(user))
  );
};

const sendCustomerWelcomeMail = async ({
  customer,
  email,
  password,
  isExistingClient,
}) => {
  if (!email) return;

  const loginUrl = `${process.env.CLIENT_URL || "http://localhost:8080"}/client-login`;

  await sendMail({
    to: email,
    subject: isExistingClient
      ? "Welcome to Digitalness CRM"
      : "Welcome to Digitalness CRM - Login Credentials",
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px">
        <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e5e7eb">
          <h2 style="margin:0 0 12px;color:#111827">Welcome to Digitalness CRM</h2>

          <p style="font-size:15px;color:#374151;line-height:1.6">
            Hi ${customer?.name || "Customer"}, your customer account has been created successfully.
          </p>

          <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-top:18px">
            <p><b>Customer Name:</b> ${customer?.name || "-"}</p>
            <p><b>Company Name:</b> ${customer?.companyName || "-"}</p>
            <p><b>Business Type:</b> ${customer?.businessType || "-"}</p>
            <p><b>Contact:</b> ${getPrimaryPhone(customer) || "-"}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Package:</b> ${customer?.package || "-"}</p>
          </div>

          <div style="background:#ecfdf5;border-radius:12px;padding:16px;margin-top:18px;border:1px solid #bbf7d0">
            <h3 style="margin:0 0 10px;color:#065f46">Login Details</h3>
            <p><b>Login URL:</b> ${loginUrl}</p>
            <p><b>Email:</b> ${email}</p>
            ${
              isExistingClient
                ? `<p>You already have login access with this email.</p>`
                : `<p><b>Password:</b> ${password}</p>`
            }
          </div>
        </div>
      </div>
    `,
  });
};

exports.createCustomer = async (req, res) => {
  try {
    const user = req.user;
    const userId = getUserId(user);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing from token.",
      });
    }

    if (!ADMIN_ROLES.includes(user.role) && !MANAGER_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Operational Manager can create customers",
      });
    }

    const customerData = normalizePayload(req.body);

    customerData.createdBy = userId;

    if (!customerData.branchId) {
      customerData.branchId = user.branchId;
    }

    if (MANAGER_ROLES.includes(user.role)) {
      customerData.branchId = user.branchId;
      customerData.assignedManager = customerData.assignedManager || userId;
    }

    const validationError = validateCustomerPayload(customerData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const customerEmail = getCustomerEmail(customerData);
    const plainPassword = customerData.password || generatePassword(customerData.name);

    delete customerData.password;

    customerData.activityLogs = [
      {
        title: "Customer Created",
        message: "Customer profile was created in CRM",
        type: "created",
        createdBy: userId,
      },
    ];

    const createdCustomer = await Customer.create(customerData);

    let client = null;
    let isExistingClient = false;
    let clientLoginCreated = false;

    if (customerEmail) {
      try {
        client = await Client.findOne({ email: customerEmail });

        if (client) {
          isExistingClient = true;

          client.customerId = client.customerId || createdCustomer._id;
          client.name = client.name || customerData.name;
          client.phone = client.phone || getPrimaryPhone(customerData);
          client.businessType = client.businessType || customerData.businessType;
          client.branchId = client.branchId || customerData.branchId;

          await client.save();
        } else {
          const hashedPassword = await bcrypt.hash(plainPassword, 10);
          const clientStatus = getClientActiveStatus();

          const clientPayload = {
            customerId: createdCustomer._id,
            name: customerData.name,
            email: customerEmail,
            password: hashedPassword,
            phone: getPrimaryPhone(customerData),
            contactNumber: getPrimaryPhone(customerData),
            contactNumbers: customerData.contactNumbers || [],
            businessType: customerData.businessType,
            companyName: customerData.companyName || customerData.name,
            branchId: customerData.branchId,
            createdBy: userId,
          };

          if (clientStatus) {
            clientPayload.status = clientStatus;
          }

          client = await Client.create(clientPayload);
          clientLoginCreated = true;
        }

        createdCustomer.userId = client._id;
        createdCustomer.email = customerEmail;
        await createdCustomer.save();
      } catch (clientError) {
        console.log("Client login creation failed:", clientError.message);

        createdCustomer.activityLogs.push({
          title: "Client Login Failed",
          message: clientError.message,
          type: "system",
          createdBy: userId,
        });

        await createdCustomer.save();
      }
    }

    const customer = await populateCustomer(Customer.findById(createdCustomer._id));

    if (customerEmail && client) {
      try {
        await sendCustomerWelcomeMail({
          customer,
          email: customerEmail,
          password: plainPassword,
          isExistingClient,
        });
      } catch (mailError) {
        console.log("Customer mail failed:", mailError.message);
      }
    }

    // Zero-Touch Auto-Provisioning: Deliverables pipeline, initial invoice & AI readiness
    clientAutoProvisioningService.provisionClient({
      customerId: createdCustomer._id,
      packageId: createdCustomer.package,
      createdBy: userId,
    }).catch((provErr) => console.log("[Auto-Provisioning Background Warning]:", provErr.message));

    return res.status(201).json({
      success: true,
      message: client
        ? "Customer created successfully, client login linked, and monthly deliverable pipeline auto-provisioned."
        : "Customer created successfully. Client login was not created.",
      data: customer,
      clientLoginCreated,
      existingClientLinked: isExistingClient,
    });
  } catch (error) {
    console.log("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const filter = getRoleFilter(req.user);

    const customers = await populateCustomer(
      Customer.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.log("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await populateCustomer(Customer.findById(req.params.id));

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!canAccessCustomer(req.user, customer)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this customer",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.log("Get customer by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: error.message,
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const user = req.user;
    const userId = getUserId(user);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing from token.",
      });
    }

    const existingCustomer = await Customer.findById(id);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!canAccessCustomer(user, existingCustomer)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this customer",
      });
    }

    const updates = normalizePayload(req.body);

    delete updates._id;
    delete updates.id;
    delete updates.createdBy;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.password;
    delete updates.userId;
    delete updates.activityLogs;
    delete updates.__v;

    // Deep merge nested profiles so sibling fields are preserved
    const profileKeys = [
      "brandProfile",
      "businessProfile",
      "creativePreferences",
      "marketingPreferences",
      "socialProfile",
      "adsProfile",
      "seoProfile",
      "leadPreferences",
      "reportingPreferences",
    ];

    profileKeys.forEach((key) => {
      if (updates[key] && typeof updates[key] === "object") {
        const existingData = existingCustomer[key]?.toObject ? existingCustomer[key].toObject() : (existingCustomer[key] || {});
        updates[key] = {
          ...existingData,
          ...updates[key],
        };
      }
    });

    if (updates.logoUrl) {
      if (!updates.brandProfile) {
        updates.brandProfile = existingCustomer.brandProfile?.toObject ? existingCustomer.brandProfile.toObject() : (existingCustomer.brandProfile || {});
      }
      updates.brandProfile.logoUrl = updates.logoUrl;
    }

    if (!updates.branchId) {
      updates.branchId = existingCustomer.branchId || user.branchId || "BR001";
    }
    if (!updates.businessType) {
      updates.businessType = existingCustomer.businessType || "Salon & Beauty Services";
    }
    if (!updates.name) {
      updates.name = existingCustomer.name;
    }
    if (!updates.contactNumbers || updates.contactNumbers.length === 0) {
      updates.contactNumbers = existingCustomer.contactNumbers;
    }

    if (MANAGER_ROLES.includes(user.role) && user.branchId) {
      updates.branchId = user.branchId;
    }

    const customer = await populateCustomer(
      Customer.findByIdAndUpdate(
        id,
        {
          $set: updates,
          $push: {
            activityLogs: {
              title: "Customer Updated",
              message: "Customer details were updated",
              type: "updated",
              createdBy: userId,
            },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found after update",
      });
    }

    if (customer?.userId) {
      try {
        const clientUpdate = {
          name: customer.name,
          email: customer.email,
          phone: getPrimaryPhone(customer),
          contactNumber: getPrimaryPhone(customer),
          contactNumbers: customer.contactNumbers || [],
          businessType: customer.businessType,
          companyName: customer.companyName || customer.name,
          branchId: customer.branchId,
          customerId: customer._id,
        };

        const clientStatus = getClientActiveStatus();
        if (clientStatus) {
          clientUpdate.status = clientStatus;
        }

        await Client.findByIdAndUpdate(
          customer.userId._id || customer.userId,
          { $set: clientUpdate },
          {
            new: true,
            runValidators: false,
          }
        );
      } catch (clientError) {
        console.log("Client update failed:", clientError.message);

        await Customer.findByIdAndUpdate(id, {
          $push: {
            activityLogs: {
              title: "Client Login Update Failed",
              message: clientError.message,
              type: "system",
              createdBy: userId,
            },
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.log("Update customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin can delete customers",
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.log("Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: error.message,
    });
  }
};

exports.getCustomersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!ADMIN_ROLES.includes(req.user.role)) {
      if (String(req.user.branchId) !== String(branchId)) {
        return res.status(403).json({
          success: false,
          message: "You can access only your branch customers",
        });
      }
    }

    const customers = await populateCustomer(
      Customer.find({ branchId }).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.log("Get customers by branch error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers by branch",
      error: error.message,
    });
  }
};
exports.addCustomerCommunication = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const { id } = req.params;
    const { type, subject, message } = req.body;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!canAccessCustomer(req.user, customer)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this customer",
      });
    }

    customer.communications.push({
      type: type || "Note",
      subject: subject || "",
      message: message || "",
      createdBy: userId,
    });

    customer.activityLogs.push({
      title: "Communication Added",
      message: `${type || "Note"} added for customer`,
      type: "communication",
      createdBy: userId,
    });

    await customer.save();

    const populatedCustomer = await populateCustomer(Customer.findById(id));

    return res.status(200).json({
      success: true,
      message: "Communication added successfully",
      data: populatedCustomer,
    });
  } catch (error) {
    console.log("Add communication error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add communication",
      error: error.message,
    });
  }
};

exports.addCustomerDocument = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const { id } = req.params;
    const { fileName, fileUrl, fileType } = req.body;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!canAccessCustomer(req.user, customer)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this customer",
      });
    }

    if (!fileName && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Document file name or file URL is required",
      });
    }

    customer.supportingDocuments.push({
      fileName: fileName || "Customer Document",
      fileUrl: fileUrl || "",
      fileType: fileType || "",
      uploadedAt: new Date(),
    });

    customer.activityLogs.push({
      title: "Document Added",
      message: fileName || "Customer document added",
      type: "document",
      createdBy: userId,
    });

    await customer.save();

    const populatedCustomer = await populateCustomer(Customer.findById(id));

    return res.status(200).json({
      success: true,
      message: "Document added successfully",
      data: populatedCustomer,
    });
  } catch (error) {
    console.log("Add document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add document",
      error: error.message,
    });
  }
};

exports.deleteCustomerDocument = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const { id, documentIndex } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!canAccessCustomer(req.user, customer)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this customer",
      });
    }

    const index = Number(documentIndex);

    if (
      Number.isNaN(index) ||
      index < 0 ||
      index >= customer.supportingDocuments.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid document index",
      });
    }

    const removedDocument = customer.supportingDocuments[index];

    customer.supportingDocuments.splice(index, 1);

    customer.activityLogs.push({
      title: "Document Removed",
      message: removedDocument?.fileName || "Customer document removed",
      type: "document",
      createdBy: userId,
    });

    await customer.save();

    const populatedCustomer = await populateCustomer(Customer.findById(id));

    return res.status(200).json({
      success: true,
      message: "Document removed successfully",
      data: populatedCustomer,
    });
  } catch (error) {
    console.log("Delete document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
      error: error.message,
    });
  }
};

exports.resetCustomerPassword = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!canAccessCustomer(req.user, customer)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this customer",
      });
    }

    if (!customer.userId) {
      return res.status(404).json({
        success: false,
        message: "Client login not found for this customer",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Client.findByIdAndUpdate(
      customer.userId,
      { $set: { password: hashedPassword } },
      { runValidators: false }
    );

    customer.activityLogs.push({
      title: "Password Reset",
      message: "Customer login password was updated",
      type: "login",
      createdBy: userId,
    });

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer password updated successfully",
    });
  } catch (error) {
    console.log("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset customer password",
      error: error.message,
    });
  }
};

exports.getCustomerReadiness = async (req, res) => {
  try {
    const { calculateCustomerReadiness } = require("../services/agentContextService");
    const readiness = await calculateCustomerReadiness(req.params.id);
    return res.status(200).json({
      success: true,
      data: readiness,
    });
  } catch (error) {
    const statusCode = error.message?.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getContextPreview = async (req, res) => {
  try {
    const { buildAgentContext } = require("../services/agentContextService");
    const { agentType, locationId } = req.query;

    const context = await buildAgentContext({
      customerId: req.params.id,
      locationId: locationId || null,
      agentType: agentType || "Parent",
    });

    return res.status(200).json({
      success: true,
      agentType: agentType || "Parent",
      data: context,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.seedGlowNestQA = async (req, res) => {
  try {
    const ClientLocation = require("../models/ClientLocation");
    const User = require("../models/User");
    const Branch = require("../models/Branch");

    let branch = await Branch.findOne({ branchId: "BR001" });
    if (!branch) {
      branch = await Branch.create({
        branchId: "BR001",
        name: "Hyderabad Headquarters",
        code: "HYD01",
        city: "Hyderabad",
        state: "Telangana",
        address: "Gachibowli Main Road, Hyderabad",
        contactPhone: "9876543210",
        contactEmail: "admin@digitalness.com",
        status: "Active",
      });
    }

    let adminUser = await User.findOne({ email: "admin@digitalness.com" });
    if (!adminUser) {
      adminUser = await User.create({
        employeeId: "DIG-2026-0001",
        name: "Super Admin",
        email: "admin@digitalness.com",
        password: "Admin@123456",
        phone: "9876543210",
        role: "Admin",
        department: "Management",
        designation: "System Administrator",
        branchId: "BR001",
        status: "Active",
      });
    }

    await Customer.deleteMany({ name: "GlowNest Salon" });
    await ClientLocation.deleteMany({ name: "Kukatpally" });

    const qaData = {
      name: "GlowNest Salon",
      companyName: "GlowNest Salon & Beauty Studio",
      contactPerson: "Riya Sharma",
      contactNumbers: ["9000012345"],
      phone: "9000012345",
      email: "glownest.qa@example.com",
      businessType: "Salon & Beauty Services",
      gstNumber: "36ABCDE1234F1Z5",
      panNumber: "ABCDE1234F",
      address: "Road No. 5, Test Colony",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500072",
      website: "https://example.com/glownest",
      status: "Active",
      package: "25",
      branchId: "BR001",
      createdBy: adminUser._id,
      assignedManager: adminUser._id,

      brandProfile: {
        brandName: "GlowNest Salon",
        tagline: "Style That Feels Like You",
        description: "A modern premium salon focused on personalized hair, beauty and grooming services.",
        brandColors: ["#1A1A1A"],
        secondaryColors: ["#F7F2ED"],
        additionalColors: ["#C79A6B"],
        fonts: ["Poppins", "Playfair Display"],
        toneOfVoice: ["Premium", "Friendly", "Modern"],
        contentLanguages: ["English", "Telugu"],
        approvedWords: ["Premium", "Personalized", "Professional", "Transformation"],
        restrictedWords: ["Cheap", "Guaranteed", "Lowest Price"],
        visualStyle: "Modern luxury editorial salon photography",
        logoPreferences: "Place logo in top header corner. Use exact brand mark proportions.",
        logoUrl: "https://glownest.com/assets/logo-glownest.png",
        brandGuidelines: "Use clean layouts, premium visuals, minimal text and consistent brand colors.",
      },

      businessProfile: {
        industry: "Beauty & Wellness",
        summary: "GlowNest Salon provides premium hair, beauty and grooming services for men and women.",
        products: ["Professional Hair Care Products", "Beauty Care Products"],
        services: ["Haircut", "Hair Colour", "Hair Spa", "Keratin Treatment", "Facial", "Manicure", "Pedicure"],
        usp: "Experienced stylists, Premium products, Personalized consultations",
        targetAudience: ["Women 20-45", "Men 20-45", "Working Professionals", "College Students"],
        serviceAreas: ["Kukatpally", "Miyapur", "Hyderabad"],
        competitors: ["StyleHub Salon", "UrbanGlow Studio"],
        businessGoals: "Increase appointment bookings, Generate qualified local leads, Improve social media visibility",
        priorityServices: ["Hair Colour", "Keratin Treatment", "Haircut"],
      },

      creativePreferences: {
        preferredStyles: ["Luxury Editorial", "Minimal", "Modern"],
        dislikedStyles: ["Crowded", "Cartoonish", "Excessive gradients"],
        contentRatio: "80% Visual / 20% Content",
        posterSizes: ["1080x1080", "1080x1350"],
        preferredCTA: "Book Appointment",
        preferredImageStyle: "Premium realistic salon photography with editorial lighting",
        typographyPreference: "Clean modern typography with strong visual hierarchy",
        restrictedCreativeDirections: "Do not overcrowd the poster, Do not modify the brand logo, Avoid excessive text",
        referenceNotes: "Keep all social media creatives premium, modern and suitable for Instagram.",
      },

      socialProfile: {
        primaryPlatforms: ["Instagram", "Facebook"],
        postingFrequency: "5 Posts Per Week",
        preferredContentTypes: ["Poster", "Carousel", "Reel", "Offer", "Educational", "Before & After"],
        contentLanguages: ["English", "Telugu"],
        toneOfVoice: "Premium",
        ctaPreferences: ["Book Appointment", "Call Now", "DM Us"],
        hashtagStrategy: "Use Hyderabad, Kukatpally, salon, haircare and beauty-related hashtags.",
        approvedWords: ["Premium", "Transformation", "Professional", "Style"],
        restrictedWords: ["Cheap", "Guaranteed"],
        socialNotes: "Focus on transformations, premium services, offers and educational content.",
      },

      adsProfile: {
        monthlyMetaBudget: 15000,
        monthlyGoogleBudget: 10000,
        primaryCampaignGoals: "Lead Generation, Appointment Bookings",
        targetLocations: ["Kukatpally", "Miyapur"],
        targetAudienceNotes: "Target men and women aged 20-45 living within nearby salon service areas.",
        promotedServices: "Hair Colour, Keratin Treatment, Haircut",
        promotedOffers: "20% Off Selected Services for New Customers",
        leadObjective: "Appointment Enquiry",
        campaignRestrictions: "Do not advertise expired offers, Do not make unsupported claims",
        adsNotes: "Prioritize high-value services and appointment-generation campaigns.",
      },

      seoProfile: {
        website: "https://example.com/glownest",
        primaryDomain: "example.com",
        targetCities: "Hyderabad",
        targetAreas: "Kukatpally, Miyapur",
        priorityServices: "Hair Colour, Keratin Treatment, Haircut",
        targetKeywords: "best salon in Kukatpally, hair colour salon Kukatpally, keratin treatment Hyderabad, premium salon near Miyapur",
        competitors: "StyleHub Salon",
        seoGoals: "Increase local search visibility, Generate organic appointment enquiries",
        priorityLandingPages: "/, /services, /hair-colour",
        seoNotes: "Focus on high-intent local service keywords.",
      },

      leadPreferences: {
        leadQualificationRules: "A valid lead should provide phone number, service interest and preferred location.",
        priorityServices: ["Hair Colour", "Keratin Treatment"],
        targetLeadTypes: ["Appointment", "Price Enquiry", "Service Enquiry"],
        serviceLocations: ["Kukatpally"],
        defaultSalesContact: "Riya Sharma",
        followUpTone: "Professional and friendly",
        followUpNotes: "Follow up with qualified leads promptly during business hours.",
        offerDetails: "20% Off Selected Services for First-Time Customers",
        exclusions: ["Job Enquiry", "Vendor Enquiry", "Spam"],
      },

      reportingPreferences: {
        reportFrequency: "Monthly",
        primaryKPIs: "Leads Generated, Appointments, Cost Per Lead, ROAS",
        secondaryKPIs: "Reach, Engagement, Follower Growth",
        clientReportingNotes: "Prioritize appointment bookings and qualified leads over vanity metrics.",
        comparisonPreference: "Month over Month",
        summaryStyle: "Executive Summary",
      },
    };

    const qaCustomer = await Customer.create(qaData);

    const locData = {
      customerId: qaCustomer._id,
      name: "Kukatpally",
      address: "Plot 18, KPHB Main Road",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500072",
      phone: "9000012346",
      email: "kukatpally.glownest@example.com",
      openingHours: "10:00 AM - 9:00 PM",
      website: "https://example.com/glownest/kukatpally",
      services: ["Haircut", "Hair Colour", "Hair Spa", "Keratin Treatment", "Facial"],
      activeOffers: [{ title: "20% Off Selected Services", description: "Special introductory offer for new customers" }],
      ctaPreferences: "Book Kukatpally Appointment",
      socialHandles: {
        instagram: "@glownest_salon_qa",
        facebook: "GlowNest Salon QA",
      },
      gbpIdentity: {
        businessName: "GlowNest Salon Kukatpally",
        category: "Beauty Salon",
      },
      status: "Active",
    };

    const qaLocation = await ClientLocation.create(locData);

    return res.status(200).json({
      success: true,
      message: "GlowNest Salon & Kukatpally location seeded successfully to MongoDB!",
      customer: qaCustomer,
      location: qaLocation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};