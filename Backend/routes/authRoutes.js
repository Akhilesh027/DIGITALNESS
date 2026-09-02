const express = require("express");

const {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword,
  addUserDocument,
  deleteUserDocument,
} = require("../controllers/authController.js");

const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();
const User = require("../models/User");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/check-seed", async (req, res) => {
  try {
    const User = require("../models/User");
    const Customer = require("../models/Customer");
    const Lead = require("../models/Lead");
    const Work = require("../models/Work");
    const Ticket = require("../models/Ticket");
    const Branch = require("../models/Branch");

    const users = await User.find({}, "name email role status employeeId createdAt");
    let customersCount = await Customer.countDocuments();
    let leadsCount = await Lead.countDocuments();
    let worksCount = await Work.countDocuments();
    let ticketsCount = await Ticket.countDocuments();
    let branchesCount = await Branch.countDocuments();

    const qaCustomer = await Customer.findOne({ name: "GlowNest Salon" }) || await Customer.findOne();
    const adminUser = await User.findOne({ role: "Admin" }) || users[0];

    if (worksCount === 0 && qaCustomer && adminUser) {
      await Work.create([
        {
          title: "GlowNest Social Media Campaign & Creatives",
          workType: "Social Media Marketing",
          customer: qaCustomer._id,
          assignedTo: [adminUser._id],
          priority: "High",
          status: "In Progress",
          branchId: "BR001",
          createdBy: adminUser._id,
          description: "Design 15 Instagram posters and manage paid campaigns for Kukatpally branch.",
        },
        {
          title: "GlowNest Salon Website SEO Optimization",
          workType: "SEO",
          customer: qaCustomer._id,
          assignedTo: [adminUser._id],
          priority: "Medium",
          status: "Completed",
          branchId: "BR001",
          createdBy: adminUser._id,
          description: "Keyword research, meta tags, and local citation building.",
        },
        {
          title: "Lead Generation Ad Campaign Setup",
          workType: "Performance Marketing",
          customer: qaCustomer._id,
          assignedTo: [adminUser._id],
          priority: "Urgent",
          status: "Pending",
          branchId: "BR001",
          createdBy: adminUser._id,
          description: "Meta Ads setup targeting Kukatpally and Miyapur salons.",
        },
      ]);
      worksCount = await Work.countDocuments();
    }

    if (ticketsCount === 0 && qaCustomer && adminUser) {
      await Ticket.create([
        {
          ticketId: "TCK-2026-0001",
          customer: qaCustomer._id,
          subject: "Update weekend offer banner on Instagram",
          description: "Please change the discount percentage from 15% to 20% on the upcoming Saturday creative.",
          category: "Question",
          priority: "Medium",
          status: "Open",
          assignedTo: adminUser._id,
          branchId: "BR001",
          createdBy: adminUser._id,
        },
        {
          ticketId: "TCK-2026-0002",
          customer: qaCustomer._id,
          subject: "Monthly Performance Analytics Report Request",
          description: "Need monthly ROAS and appointment breakdown for last month.",
          category: "Feature Request",
          priority: "Low",
          status: "Resolved",
          assignedTo: adminUser._id,
          branchId: "BR001",
          createdBy: adminUser._id,
        },
      ]);
      ticketsCount = await Ticket.countDocuments();
    }

    res.json({
      success: true,
      counts: {
        users: users.length,
        customers: customersCount,
        leads: leadsCount,
        works: worksCount,
        tickets: ticketsCount,
        branches: branchesCount,
      },
      users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/test-token", async (req, res) => {
  try {
    const user = await User.findOne({ email: "admin@digitalness.com" }).select("+password");
    if (!user) return res.json({ error: "No admin user in DB" });
    const isMatch = await user.matchPassword("Admin@123456");
    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "digitalnesscrmsecret";
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "7d" });
    const decoded = jwt.verify(token, secret);
    const foundUser = await User.findById(decoded.id).select("-password");

    res.json({
      userFound: !!user,
      passwordMatches: isMatch,
      tokenGenerated: !!token,
      decodedId: decoded.id,
      verifiedUserFound: !!foundUser,
      userRole: foundUser?.role,
      userStatus: foundUser?.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(protect);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/logout", logoutUser);
router.put("/:id/reset-password", resetUserPassword);
router.post("/:id/documents", addUserDocument);
router.delete("/:id/documents/:documentIndex", deleteUserDocument);

module.exports = router;