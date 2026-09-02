const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const {
  markClockIn,
  markClockOut,
} = require("../services/attendanceService.js");

const ADMIN_ROLES = ["Admin", "admin"];
const MANAGER_ROLES = ["Operational Manager", "Branch Manager"];

const JWT_SECRET = process.env.JWT_SECRET || "digitalnesscrmsecret";

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

const normalizeStatus = (status) => {
  if (!status) return "Active";

  const cleanStatus = String(status).trim().toLowerCase();

  if (cleanStatus === "active") return "Active";
  if (cleanStatus === "inactive") return "Inactive";

  return "Active";
};

const getUserId = (user) => user?._id || user?.id || user;

const canManageUser = (currentUser, targetUser) => {
  if (ADMIN_ROLES.includes(currentUser?.role)) return true;

  if (MANAGER_ROLES.includes(currentUser?.role)) {
    return String(currentUser.branchId || "") === String(targetUser.branchId || "");
  }

  return String(getUserId(currentUser)) === String(getUserId(targetUser));
};

const generateEmployeeId = async () => {
  const year = new Date().getFullYear();
  const count = await User.countDocuments();
  return `DIG-${year}-${String(count + 1).padStart(4, "0")}`;
};

const employeeWelcomeTemplate = ({ user, plainPassword, loginUrl }) => {
  return `
    <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:24px">
      <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e5e7eb">
        <h2 style="margin:0 0 12px;color:#111827">Welcome to Digitalness CRM</h2>

        <p style="font-size:15px;color:#374151;line-height:1.6">
          Hi ${user.name || "Employee"},
        </p>

        <p style="font-size:15px;color:#374151;line-height:1.6">
          Welcome to Digitalness. Your employee CRM account has been created successfully.
        </p>

        <div style="background:#ecfdf5;border-radius:12px;padding:16px;margin-top:18px;border:1px solid #bbf7d0">
          <h3 style="margin-top:0;color:#065f46">CRM Login Details</h3>
          <p><b>Login URL:</b> <a href="${loginUrl}" target="_blank">${loginUrl}</a></p>
          <p><b>Email:</b> ${user.email || "-"}</p>
          <p><b>Password:</b> ${plainPassword || "-"}</p>
        </div>

        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-top:18px">
          <h3 style="margin-top:0;color:#111827">Employee Details</h3>
          <p><b>Employee ID:</b> ${user.employeeId || "-"}</p>
          <p><b>Name:</b> ${user.name || "-"}</p>
          <p><b>Phone:</b> ${user.phone || "-"}</p>
          <p><b>Role:</b> ${user.role || "-"}</p>
          <p><b>Department:</b> ${user.department || "-"}</p>
          <p><b>Designation:</b> ${user.designation || "-"}</p>
          <p><b>Branch:</b> ${user.branchId || "-"}</p>
        </div>

        <a href="${loginUrl}" target="_blank" style="display:inline-block;margin-top:20px;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px">
          Login Now
        </a>
      </div>
    </div>
  `;
};

const sendEmployeeWelcomeMail = async ({ user, plainPassword }) => {
  if (!user?.email) return;

  const loginUrl = `${process.env.CLIENT_URL || "http://localhost:8080"}/login`;

  await sendMail({
    to: user.email,
    subject: "Welcome to Digitalness CRM - Employee Login Details",
    html: employeeWelcomeTemplate({
      user,
      plainPassword,
      loginUrl,
    }),
  });
};

exports.registerUser = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      password,
      phone,
      alternatePhone,
      role,
      department,
      designation,
      salary,
      address,
      city,
      state,
      dateOfJoining,
      dateOfBirth,
      branchId,
      status,
      skills,
      emergencyContact,
      bankDetails,
      documents,
      profileImage,
      notes,
    } = req.body;

    if (!name || !email || !password || !phone || !role || !department) {
      return res.status(400).json({
        message: "Name, email, password, phone, role and department are required",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const finalEmployeeId = employeeId || (await generateEmployeeId());

    const employeeIdExists = await User.findOne({ employeeId: finalEmployeeId });

    if (employeeIdExists) {
      return res.status(400).json({
        message: "Employee ID already exists",
      });
    }

    const user = await User.create({
      employeeId: finalEmployeeId,
      name: String(name).trim(),
      email: cleanEmail,
      password,
      phone,
      alternatePhone,
      role,
      department,
      designation,
      salary: Number(salary) || 0,
      address,
      city,
      state,
      dateOfJoining,
      dateOfBirth: dateOfBirth || null,
      branchId,
      status: normalizeStatus(status),
      skills: Array.isArray(skills)
        ? skills
        : typeof skills === "string"
        ? skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      emergencyContact: emergencyContact || {},
      bankDetails: bankDetails || {},
      documents: Array.isArray(documents) ? documents : [],
      profileImage,
      notes,
    });

    await sendEmployeeWelcomeMail({
      user,
      plainPassword: password,
    });

    res.status(201).json({
      message: "User registered successfully and welcome mail sent",
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const userStatus = normalizeStatus(user.status);

    if (userStatus !== "Active") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact admin.",
      });
    }

    user.status = userStatus;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    let attendance = null;

    try {
      attendance = await markClockIn(user, req);
    } catch (attendanceError) {
      console.log("Attendance clock-in error:", attendanceError.message);
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        designation: user.designation,
        branchId: user.branchId,
        status: userStatus,
      },
      attendance,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const attendance = await markClockOut(req.user, req);

    res.json({
      success: true,
      message: "Logout successful. Attendance updated.",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    if (ADMIN_ROLES.includes(user.role)) {
      filter = {};
    } else if (MANAGER_ROLES.includes(user.role)) {
      filter = { branchId: user.branchId };
    } else {
      filter = { _id: getUserId(user) };
    }

    const users = await User.find(filter).select("-password").sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: users.length,
      data: users,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).select("-password");

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!canManageUser(req.user, targetUser)) {
      return res.status(403).json({
        message: "You do not have permission to view this user",
      });
    }

    res.json({
      success: true,
      data: targetUser,
      user: targetUser,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!canManageUser(req.user, existingUser)) {
      return res.status(403).json({
        message: "You do not have permission to update this user",
      });
    }

    const updates = { ...req.body };

    delete updates._id;
    delete updates.id;
    delete updates.password;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    if (updates.email) {
      updates.email = String(updates.email).trim().toLowerCase();

      const duplicateEmail = await User.findOne({
        _id: { $ne: req.params.id },
        email: updates.email,
      });

      if (duplicateEmail) {
        return res.status(400).json({
          message: "Another user already exists with this email",
        });
      }
    }

    if (updates.employeeId) {
      const duplicateEmployeeId = await User.findOne({
        _id: { $ne: req.params.id },
        employeeId: updates.employeeId,
      });

      if (duplicateEmployeeId) {
        return res.status(400).json({
          message: "Another user already exists with this employee ID",
        });
      }
    }

    if (updates.status !== undefined) {
      updates.status = normalizeStatus(updates.status);
    }

    if (updates.salary !== undefined) {
      updates.salary = Number(updates.salary) || 0;
    }

    if (typeof updates.skills === "string") {
      updates.skills = updates.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    if (!ADMIN_ROLES.includes(req.user.role)) {
      delete updates.role;
      delete updates.salary;
      delete updates.bankDetails;
      updates.branchId = req.user.branchId;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).select("-password");

    res.status(200).json({
      message: "User updated successfully",
      user,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!canManageUser(req.user, user)) {
      return res.status(403).json({
        message: "You do not have permission to reset this password",
      });
    }

    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.addUserDocument = async (req, res) => {
  try {
    const { fileName, fileUrl, fileType } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!canManageUser(req.user, user)) {
      return res.status(403).json({
        message: "You do not have permission to update this user",
      });
    }

    user.documents.push({
      fileName: fileName || "Employee Document",
      fileUrl: fileUrl || "",
      fileType: fileType || "",
    });

    await user.save();

    res.json({
      success: true,
      message: "Document added successfully",
      data: user,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.deleteUserDocument = async (req, res) => {
  try {
    const { id, documentIndex } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!canManageUser(req.user, user)) {
      return res.status(403).json({
        message: "You do not have permission to update this user",
      });
    }

    const index = Number(documentIndex);

    if (Number.isNaN(index) || index < 0 || index >= user.documents.length) {
      return res.status(400).json({
        message: "Invalid document index",
      });
    }

    user.documents.splice(index, 1);
    await user.save();

    res.json({
      success: true,
      message: "Document deleted successfully",
      data: user,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        message: "Only Admin can delete users",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};