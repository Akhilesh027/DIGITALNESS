const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "admin@digitalness.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin user already exists with email: ${adminEmail}`);
      // Update password to ensure known credentials
      existingAdmin.password = "Admin@123456";
      existingAdmin.status = "Active";
      await existingAdmin.save();
      console.log("Updated existing Admin password to: Admin@123456");
    } else {
      const admin = new User({
        employeeId: "DIG-2026-0001",
        name: "Super Admin",
        email: adminEmail,
        password: "Admin@123456",
        phone: "9876543210",
        role: "Admin",
        department: "Management",
        designation: "System Administrator",
        branchId: "BR001",
        status: "Active",
      });
      await admin.save();
      console.log("Admin user created successfully!");
    }

    // Also seed a Manager user for testing
    const managerEmail = "manager@digitalness.com";
    const existingManager = await User.findOne({ email: managerEmail });

    if (existingManager) {
      existingManager.password = "Manager@123456";
      existingManager.status = "Active";
      await existingManager.save();
      console.log("Updated existing Manager password to: Manager@123456");
    } else {
      const manager = new User({
        employeeId: "DIG-2026-0002",
        name: "Operations Manager",
        email: managerEmail,
        password: "Manager@123456",
        phone: "9876543211",
        role: "Operational Manager",
        department: "Management",
        designation: "Operations Manager",
        branchId: "BR001",
        status: "Active",
      });
      await manager.save();
      console.log("Manager user created successfully!");
    }

    mongoose.disconnect();
    console.log("Database disconnected.");
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
};

seedAdmin();
