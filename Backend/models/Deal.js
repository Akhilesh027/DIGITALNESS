const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    contactNumber: {
      type: String,
      required: true,
    },

    businessType: {
      type: String,
      default: "",
    },

    branchId: {
      type: String,
      default: "BR001",
    },

    stage: {
      type: String,
      enum:["New", "Contacted", "Discovery", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
      default: "New",
    },

    dealValue: {
      type: Number,
      default: 0,
    },

    probability: {
      type: Number,
      default: 50,
    },

    expectedCloseDate: {
      type: Date,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
proposalId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Proposal",
},

proposalCreated: {
  type: Boolean,
  default: false,
},
customerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Customer",
},

customerCreated: {
  type: Boolean,
  default: false,
},
    notes: {
      type: String,
      default: "",
    },

    callLogs: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deal", dealSchema);