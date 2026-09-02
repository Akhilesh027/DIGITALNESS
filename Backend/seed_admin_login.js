/**
 * seed_admin_login.js
 * Seeds or updates the primary admin user with credentials:
 * Email: admin@digitalness.in
 * Password: DLNS@2026
 * Role: Admin
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const User = require("./models/User");

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB Atlas.");

  const email = "admin@digitalness.in";
  const rawPassword = "DLNS@2026";

  const existing = await User.findOne({ email });
  if (existing) {
    existing.password = rawPassword; // pre('save') hook automatically hashes with bcrypt
    existing.role = "Admin";
    existing.status = "Active";
    existing.name = "Super Admin";
    existing.designation = "System Administrator";
    existing.department = "Management";
    existing.branchId = "BR001";
    await existing.save();
    console.log(`✓ Updated existing admin account: ${email}`);
  } else {
    const admin = new User({
      employeeId: "DIG-ADMIN-01",
      name: "Super Admin",
      email,
      password: rawPassword, // pre('save') hook automatically hashes with bcrypt
      phone: "+91 9900112233",
      role: "Admin",
      department: "Management",
      designation: "System Administrator",
      branchId: "BR001",
      status: "Active",
    });
    await admin.save();
    console.log(`✓ Created new admin account: ${email}`);
  }

  console.log("\n=================================");
  console.log("ADMIN ACCOUNT CONFIGURED:");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${rawPassword}`);
  console.log(`Role:     Admin`);
  console.log("=================================\n");

  await mongoose.disconnect();
  console.log("Database disconnected successfully.");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Error seeding admin:", err);
  process.exit(1);
});
