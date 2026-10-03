const jwt = require("jsonwebtoken");
const Client = require("../models/Client.js");
const Customer = require("../models/Customer");
const sendMail = require("../utils/sendMail");

const generateToken = (id) => {
  return jwt.sign({ id, type: "client" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const generatePassword = (name = "client") => {
  const cleanName = name.replace(/\s+/g, "").slice(0, 4).toLowerCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}@${random}`;
};

exports.createClientLogin = async (req, res) => {
  try {
    const { customerId, email, password } = req.body;

    if (!customerId || !email) {
      return res.status(400).json({
        message: "Customer and email are required",
      });
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let client = await Client.findOne({ email: normalizedEmail });

    const clientBase = process.env.CLIENT_APP_URL || "http://localhost:5174";
    const loginUrl = `${clientBase.replace(/\/+$/, "")}/login`;
    const plainPassword = password || generatePassword(customer.name);

    if (client) {
      // Update existing client password and link
      client.password = plainPassword;
      client.customerId = customer._id;
      if (!client.name) client.name = customer.name;
      client.status = "active";
      if (customer.branchId) client.branchId = customer.branchId;
      await client.save();

      customer.userId = client._id;
      customer.email = normalizedEmail;
      await customer.save();

      await sendMail({
        to: normalizedEmail,
        subject: "Welcome to Digitalness CRM - Login Credentials",
        html: `
          <div style="font-family:Arial,sans-serif;background:#0f172a;padding:32px;color:#f8fafc">
            <div style="max-width:620px;margin:auto;background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155">
              <div style="text-align:center;margin-bottom:24px">
                <h1 style="color:#f59e0b;margin:0;font-size:24px;font-weight:900">Digitalness Client Portal</h1>
                <p style="color:#94a3b8;font-size:13px;margin-top:4px">Real-time Marketing & Deliverables Desk</p>
              </div>

              <p style="font-size:15px;line-height:1.6">Hi <b>${customer.name}</b>,</p>
              <p style="font-size:14px;color:#cbd5e1;line-height:1.6">
                Your client portal account has been configured with direct live access to your campaigns, deliverables, invoices, and agency squad.
              </p>

              <div style="background:#0f172a;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #334155">
                <h3 style="margin:0 0 12px 0;color:#f59e0b;font-size:13px;text-transform:uppercase;letter-spacing:1px">Login Credentials</h3>
                <p style="margin:8px 0;font-size:14px"><b>Login URL:</b> <a href="${loginUrl}" style="color:#38bdf8;text-decoration:none">${loginUrl}</a></p>
                <p style="margin:8px 0;font-size:14px"><b>Email:</b> <span style="font-family:monospace;color:#f1f5f9">${normalizedEmail}</span></p>
                <p style="margin:8px 0;font-size:14px"><b>Password:</b> <span style="font-family:monospace;color:#34d399;font-weight:bold;font-size:16px;background:#1e293b;padding:3px 8px;border-radius:6px">${plainPassword}</span></p>
              </div>

              <div style="background:#334155/60;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:24px;border-radius:4px">
                <p style="margin:0;font-size:13px;color:#e2e8f0">
                  🔒 <b>Change Password:</b> You can change this password anytime after signing in by navigating to <b>Client Profile &rarr; Password</b>.
                </p>
              </div>

              <div style="text-align:center;margin:28px 0">
                <a href="${loginUrl}" style="background:linear-gradient(to right, #f59e0b, #d97706);color:#0f172a;font-weight:900;text-decoration:none;padding:14px 32px;border-radius:10px;display:inline-block;font-size:14px">
                  Sign In to Client Portal &rarr;
                </a>
              </div>

              <p style="font-size:12px;color:#64748b;text-align:center;margin-top:24px;border-top:1px solid #334155;padding-top:16px">
                © Digitalness Media & Technology • Keep your login credentials safe
              </p>
            </div>
          </div>
        `,
      });

      return res.status(200).json({
        message: "Client login updated successfully and credentials sent to email",
        client,
        customer,
        email: normalizedEmail,
        password: plainPassword,
        loginUrl,
      });
    }

    client = await Client.create({
      customerId: customer._id,
      name: customer.name,
      email: normalizedEmail,
      password: plainPassword,
      phone: customer.contactNumbers?.[0] || customer.phone || "",
      businessType: customer.businessType || "",
      branchId: customer.branchId || "BR001",
      status: "active",
      createdBy: req.user?._id,
    });

    customer.userId = client._id;
    customer.email = normalizedEmail;
    await customer.save();

    await sendMail({
      to: normalizedEmail,
      subject: "Welcome to Digitalness CRM - Login Credentials",
      html: `
        <div style="font-family:Arial,sans-serif;background:#0f172a;padding:32px;color:#f8fafc">
          <div style="max-width:620px;margin:auto;background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155">
            <div style="text-align:center;margin-bottom:24px">
              <h1 style="color:#f59e0b;margin:0;font-size:24px;font-weight:900">Digitalness Client Portal</h1>
              <p style="color:#94a3b8;font-size:13px;margin-top:4px">Real-time Marketing & Deliverables Desk</p>
            </div>

            <p style="font-size:15px;line-height:1.6">Hi <b>${customer.name}</b>,</p>
            <p style="font-size:14px;color:#cbd5e1;line-height:1.6">
              Your client portal account has been created successfully. You now have direct 24/7 access to all campaigns, deliverables, invoices, and direct agency desk.
            </p>

            <div style="background:#0f172a;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #334155">
              <h3 style="margin:0 0 12px 0;color:#f59e0b;font-size:13px;text-transform:uppercase;letter-spacing:1px">Login Credentials</h3>
              <p style="margin:8px 0;font-size:14px"><b>Login URL:</b> <a href="${loginUrl}" style="color:#38bdf8;text-decoration:none">${loginUrl}</a></p>
              <p style="margin:8px 0;font-size:14px"><b>Email:</b> <span style="font-family:monospace;color:#f1f5f9">${normalizedEmail}</span></p>
              <p style="margin:8px 0;font-size:14px"><b>Password:</b> <span style="font-family:monospace;color:#34d399;font-weight:bold;font-size:16px;background:#1e293b;padding:3px 8px;border-radius:6px">${plainPassword}</span></p>
            </div>

            <div style="background:#334155/60;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:24px;border-radius:4px">
              <p style="margin:0;font-size:13px;color:#e2e8f0">
                🔒 <b>Change Password:</b> You can change this password anytime after signing in by navigating to <b>Client Profile &rarr; Password</b>.
              </p>
            </div>

            <div style="text-align:center;margin:28px 0">
              <a href="${loginUrl}" style="background:linear-gradient(to right, #f59e0b, #d97706);color:#0f172a;font-weight:900;text-decoration:none;padding:14px 32px;border-radius:10px;display:inline-block;font-size:14px">
                Sign In to Client Portal &rarr;
              </a>
            </div>

            <p style="font-size:12px;color:#64748b;text-align:center;margin-top:24px;border-top:1px solid #334155;padding-top:16px">
              © Digitalness Media & Technology • Keep your login credentials safe
            </p>
          </div>
        </div>
      `,
    });

    res.status(201).json({
      message: "Client login created successfully and credentials sent to email",
      client,
      customer,
      email: normalizedEmail,
      password: plainPassword,
      loginUrl,
      generatedPassword: !password,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.loginClient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const client = await Client.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!client) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (client.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact Digitalness.",
      });
    }

    const isMatch = await client.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const customer = await Customer.findById(client.customerId);

    const token = generateToken(client._id);

    res.status(200).json({
      message: "Client login successful",
      token,
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        businessType: client.businessType,
        branchId: client.branchId,
        status: client.status,
        customerId: client.customerId,
      },
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getClientMe = async (req, res) => {
  try {
    const clientId = req.client?._id || req.user?._id;
    if (!clientId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client record not found" });
    }

    const customer = await Customer.findById(client.customerId);

    return res.status(200).json({
      success: true,
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        businessType: client.businessType,
        branchId: client.branchId,
        status: client.status,
        customerId: client.customerId,
      },
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.updateClientProfile = async (req, res) => {
  try {
    const clientId = req.client?._id || req.user?._id;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client record not found" });
    }

    const customer = await Customer.findById(client.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Linked customer record not found" });
    }

    const {
      name,
      phone,
      companyName,
      businessType,
      address,
      city,
      state,
      pincode,
      website,
      socialLinks,
      instagram,
      facebook,
      linkedin,
      notes,
    } = req.body;

    if (name) {
      client.name = name;
      customer.name = name;
    }
    if (phone) {
      client.phone = phone;
      if (!customer.contactNumbers) customer.contactNumbers = [];
      if (!customer.contactNumbers.includes(phone)) {
        customer.contactNumbers.unshift(phone);
      }
      customer.phone = phone;
    }
    if (businessType) {
      client.businessType = businessType;
      customer.businessType = businessType;
    }
    if (companyName) customer.companyName = companyName;
    if (address !== undefined) customer.address = address;
    if (city !== undefined) customer.city = city;
    if (state !== undefined) customer.state = state;
    if (pincode !== undefined) customer.pincode = pincode;
    if (website !== undefined) customer.website = website;
    if (notes !== undefined) customer.notes = notes;

    if (socialLinks || instagram || facebook || linkedin) {
      customer.socialLinks = {
        ...(customer.socialLinks || {}),
        ...(socialLinks || {}),
        ...(instagram ? { instagram } : {}),
        ...(facebook ? { facebook } : {}),
        ...(linkedin ? { linkedin } : {}),
      };
    }

    await client.save();
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        businessType: client.businessType,
        branchId: client.branchId,
        status: client.status,
        customerId: client.customerId,
      },
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.changeClientPassword = async (req, res) => {
  try {
    const clientId = req.client?._id || req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const client = await Client.findById(clientId).select("+password");
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    if (currentPassword) {
      const isMatch = await client.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    client.password = newPassword;
    await client.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.forgotPasswordClient = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Registered email address is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const client = await Client.findOne({ email: normalizedEmail });

    if (!client) {
      return res.status(404).json({ message: "No client account found for this email address" });
    }

    const customer = await Customer.findById(client.customerId);
    const clientName = customer?.name || client.name || "Client";
    const newPassword = generatePassword(clientName);

    client.password = newPassword;
    await client.save();

    const clientBase = process.env.CLIENT_APP_URL || "http://localhost:5174";
    const loginUrl = `${clientBase.replace(/\/+$/, "")}/login`;

    await sendMail({
      to: normalizedEmail,
      subject: "Your Digitalness Client Portal Password Reset",
      html: `
        <div style="font-family:Arial,sans-serif;background:#0f172a;padding:32px;color:#f8fafc">
          <div style="max-width:620px;margin:auto;background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155">
            <div style="text-align:center;margin-bottom:24px">
              <h1 style="color:#f59e0b;margin:0;font-size:24px;font-weight:900">Digitalness Client Portal</h1>
              <p style="color:#94a3b8;font-size:13px;margin-top:4px">Password Reset Notification</p>
            </div>

            <p style="font-size:15px;line-height:1.6">Hi <b>${clientName}</b>,</p>
            <p style="font-size:14px;color:#cbd5e1;line-height:1.6">
              A temporary password has been generated for your client portal account. You can use this to sign in immediately and update your password under your profile settings.
            </p>

            <div style="background:#0f172a;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #334155">
              <h3 style="margin:0 0 12px 0;color:#f59e0b;font-size:13px;text-transform:uppercase;letter-spacing:1px">Your New Credentials</h3>
              <p style="margin:8px 0;font-size:14px"><b>Login URL:</b> <a href="${loginUrl}" style="color:#38bdf8;text-decoration:none">${loginUrl}</a></p>
              <p style="margin:8px 0;font-size:14px"><b>Email:</b> <span style="font-family:monospace;color:#f1f5f9">${normalizedEmail}</span></p>
              <p style="margin:8px 0;font-size:14px"><b>New Password:</b> <span style="font-family:monospace;color:#34d399;font-weight:bold;font-size:16px;background:#1e293b;padding:3px 8px;border-radius:6px">${newPassword}</span></p>
            </div>

            <div style="background:#334155/60;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:24px;border-radius:4px">
              <p style="margin:0;font-size:13px;color:#e2e8f0">
                🔒 <b>Recommendation:</b> After logging in, you can update this password in your <b>Client Profile &rarr; Password</b> section.
              </p>
            </div>

            <div style="text-align:center;margin:28px 0">
              <a href="${loginUrl}" style="background:linear-gradient(to right, #f59e0b, #d97706);color:#0f172a;font-weight:900;text-decoration:none;padding:14px 32px;border-radius:10px;display:inline-block;font-size:14px">
                Log In to Client Portal &rarr;
              </a>
            </div>

            <p style="font-size:12px;color:#64748b;text-align:center;margin-top:24px;border-top:1px solid #334155;padding-top:16px">
              If you did not request this password reset, please contact Digitalness support immediately.
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "New password generated and sent to your email",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};