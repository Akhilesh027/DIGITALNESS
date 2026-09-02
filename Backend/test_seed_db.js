const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const Branch = require("./models/Branch");

async function seedDatabase() {
  console.log("Connecting to Database:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected successfully!");

  // 1. Seed Branch BR001
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
    console.log("✓ Seeded Branch: BR001 (Hyderabad Headquarters)");
  } else {
    console.log("✓ Branch BR001 already exists.");
  }

  // 2. Seed Admin 1
  let admin1 = await User.findOne({ email: "admin@digitalness.com" });
  if (!admin1) {
    await User.create({
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
    console.log("✓ Seeded Admin 1: admin@digitalness.com / Admin@123456");
  } else {
    console.log("✓ Admin 1 (admin@digitalness.com) already exists.");
  }

  // 3. Seed Owner Admin 2
  let owner = await User.findOne({ email: "akhileshreddy066@gmail.com" });
  if (!owner) {
    await User.create({
      employeeId: "DIG-2026-0000",
      name: "Akhilesh Reddy (System Owner)",
      email: "akhileshreddy066@gmail.com",
      password: "Admin@123456",
      phone: "9876543200",
      role: "Admin",
      department: "Executive Management",
      designation: "Managing Director",
      branchId: "BR001",
      status: "Active",
    });
    console.log("✓ Seeded Owner Admin: akhileshreddy066@gmail.com / Admin@123456");
  } else {
    console.log("✓ Owner Admin (akhileshreddy066@gmail.com) already exists.");
  }

  // 4. Seed Operations Manager
  let manager = await User.findOne({ email: "manager@digitalness.com" });
  if (!manager) {
    await User.create({
      employeeId: "DIG-2026-0002",
      name: "Operations Manager",
      email: "manager@digitalness.com",
      password: "Manager@123456",
      phone: "9876543211",
      role: "Operational Manager",
      department: "Operations",
      designation: "Operations Manager",
      branchId: "BR001",
      status: "Active",
    });
    console.log("✓ Seeded Manager: manager@digitalness.com / Manager@123456");
  } else {
    console.log("✓ Manager (manager@digitalness.com) already exists.");
  }

  await mongoose.disconnect();
  console.log("Database Seeding Completed Successfully.");
}

seedDatabase().catch((err) => console.error("Seeding Error:", err.message));
