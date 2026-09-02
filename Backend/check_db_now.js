const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/Customer");
const ClientLocation = require("./models/ClientLocation");

async function checkDb() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("\n=== MONGODB DATABASE AUDIT ===");
  console.log("Database Name:", mongoose.connection.name);

  const customers = await Customer.find().lean();
  console.log(`\nCustomers Found (${customers.length}):`);
  customers.forEach((c, i) => {
    console.log(`  ${i + 1}. Name: "${c.name}" | ID: ${c._id} | Email: ${c.email}`);
  });

  const locations = await ClientLocation.find().lean();
  console.log(`\nLocations Found (${locations.length}):`);
  locations.forEach((l, i) => {
    console.log(`  ${i + 1}. Name: "${l.name}" | ID: ${l._id} | CustomerID: ${l.customerId}`);
  });

  await mongoose.disconnect();
}

checkDb().catch((err) => console.error("Audit error:", err));
