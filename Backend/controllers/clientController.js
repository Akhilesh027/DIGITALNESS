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

    const loginUrl = `${
      process.env.CLIENT_APP_URL || "http://localhost:8081"
    }/client-login`;

    if (client) {
      customer.userId = client._id;
      customer.email = normalizedEmail;
      await customer.save();

      await sendMail({
        to: normalizedEmail,
        subject: "Your Digitalness CRM Account Linked",
        html: `
          <h2>Welcome to Digitalness CRM</h2>
          <p>Hi ${customer.name}, your customer profile has been linked with your existing client login.</p>
          <p><b>Login URL:</b> ${loginUrl}</p>
          <p><b>Email:</b> ${normalizedEmail}</p>
        `,
      });

      return res.status(200).json({
        message: "Existing client linked successfully",
        client,
        customer,
      });
    }

    const plainPassword = password || generatePassword(customer.name);

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
        <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px">
          <div style="max-width:650px;margin:auto;background:#fff;border-radius:14px;padding:24px">
            <h2>Welcome to Digitalness CRM</h2>
            <p>Hi ${customer.name}, your client login has been created successfully.</p>

            <h3>Login Details</h3>
            <p><b>Login URL:</b> ${loginUrl}</p>
            <p><b>Email:</b> ${normalizedEmail}</p>
            <p><b>Password:</b> ${plainPassword}</p>

            <h3>Customer Details</h3>
            <p><b>Name:</b> ${customer.name}</p>
            <p><b>Business:</b> ${customer.businessType || "-"}</p>
            <p><b>Contact:</b> ${customer.contactNumbers?.[0] || customer.phone || "-"}</p>

            <p style="font-size:13px;color:#666">
              Please keep your login credentials safe.
            </p>
          </div>
        </div>
      `,
    });

    res.status(201).json({
      message: "Client login created successfully and mail sent",
      client,
      customer,
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