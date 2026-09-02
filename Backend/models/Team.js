const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientLocation",
      default: null,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    leadUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    capabilities: {
      type: [String],
      default: ["WHATSAPP", "GBP_REVIEW", "LEAD_QUALIFICATION"],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    roundRobinPointer: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

let TeamModel;
try {
  TeamModel = mongoose.model("Team");
} catch (e) {
  TeamModel = mongoose.model("Team", teamSchema);
}

module.exports = TeamModel;
