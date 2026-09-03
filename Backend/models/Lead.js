const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema(
  {
    callStatus: {
      type: String,
      enum: [
        "Own Close",
        "Own Loss",
        "Call Back",
        "No Response",
        "Follow Up",
        "Demo Completed",
      ],
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    requirements: {
      type: [String],
      default: [],
    },
    followUpDate: {
      type: Date,
    },
    calledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    calledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    businessType: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["Telecaller", "Executive", "Website", "Ad", "AI Workspace", "AI"],
      default: "Telecaller",
    },

    branchId: {
      type: String,
      default: "BR001",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    requirements: {
      type: [String],
      default: [],
    },

    budgetRange: {
      type: String,
      default: "",
    },
    requirementClarity: {
      type: String,
      enum: ["Clear", "Not Clear"],
      default: "Not Clear",
    },
    budgetMatch: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    timeline: {
      type: String,
      enum: ["Urgent", "Normal", "Later"],
      default: "Normal",
    },
    decisionMaker: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    leadScore: {
      type: String,
      enum: ["Hot", "Warm", "Cold"],
      default: "Warm",
    },

    status: {
      type: String,
      enum: [
        "New",
        "Demo Completed",
        "Own Close",
        "Own Loss",
        "Follow Up",
        "No Response",
        "Call Back",
        "Qualified",
        "Contacted",
        "Negotiation",
        "Converted",
        "Lost",
      ],
      default: "New",
    },

    probability: {
      type: Number,
      default: 30,
    },

    expectedClosingDate: {
      type: Date,
    },

    nextFollowUpDate: {
      type: Date,
    },

    followUpDate: {
      type: Date,
    },

    lastContactDate: {
      type: Date,
    },

    notes: {
      type: [String],
      default: [],
    },

    callLogs: {
      type: [callLogSchema],
      default: [],
    },

    inPipeline: {
      type: Boolean,
      default: false,
    },

    convertedToCustomer: {
      type: Boolean,
      default: false,
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

wonOn: Date,
lostReason: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

let LeadModel;
try {
  LeadModel = mongoose.model("Lead");
} catch (e) {
  LeadModel = mongoose.model("Lead", leadSchema);
}
module.exports = LeadModel;