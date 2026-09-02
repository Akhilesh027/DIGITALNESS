const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    branchId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      default: "HYD01",
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      default: "Telangana",
    },
    location: {
      type: String,
      default: "Gachibowli",
    },
    address: {
      type: String,
      default: "",
    },
    contactPhone: {
      type: String,
      default: "9876543210",
    },
    contactEmail: {
      type: String,
      default: "admin@digitalness.com",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branch", branchSchema);