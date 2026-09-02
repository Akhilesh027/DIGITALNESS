const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeDocumentSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileType: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    relation: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, default: "" },
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    upiId: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      required: true,
      default: "Graphic Designer",
    },

    department: {
      type: String,
      default: "Creative",
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    salary: {
      type: Number,
      default: 0,
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    dateOfJoining: {
      type: Date,
      default: Date.now,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    branchId: {
      type: String,
      default: "BR001",
    },

    skills: {
      type: [String],
      default: [],
    },

    documents: {
      type: [employeeDocumentSchema],
      default: [],
    },

    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({}),
    },

    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },

    profileImage: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ branchId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);