const Branch = require("../models/Branch.js");
const User = require("../models/User");

exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find()
      .populate("managerId", "name email role department branchId")
      .sort({ createdAt: -1 });

    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const { branchId, name, code, city, state, location, address, contactPhone, contactEmail, managerId, status } = req.body;

    const branchExists = await Branch.findOne({ branchId });
    if (branchExists) {
      return res.status(400).json({ message: "Branch ID already exists" });
    }

    const branch = await Branch.create({
      branchId,
      name,
      code: code || "BR01",
      city,
      state: state || "",
      location: location || city,
      address: address || "",
      contactPhone: contactPhone || "",
      contactEmail: contactEmail || "",
      managerId: managerId || null,
      status: status || "Active",
    });

    if (managerId) {
      await User.findByIdAndUpdate(managerId, { branchId });
    }

    const populatedBranch = await Branch.findById(branch._id).populate(
      "managerId",
      "name email role department branchId"
    );

    res.status(201).json({
      message: "Branch created successfully",
      branch: populatedBranch,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { branchId, name, code, city, state, location, address, contactPhone, contactEmail, managerId, status } = req.body;

    const oldBranch = await Branch.findById(req.params.id);

    if (!oldBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const updateData = {
      ...(branchId ? { branchId } : {}),
      ...(name ? { name } : {}),
      ...(code ? { code } : {}),
      ...(city ? { city } : {}),
      ...(state ? { state } : {}),
      ...(location ? { location } : {}),
      ...(address ? { address } : {}),
      ...(contactPhone ? { contactPhone } : {}),
      ...(contactEmail ? { contactEmail } : {}),
      managerId: managerId || null,
      status: status || oldBranch.status,
    };

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("managerId", "name email role department branchId");

    if (managerId) {
      await User.findByIdAndUpdate(managerId, { branchId });
    }

    if (
      oldBranch.managerId &&
      oldBranch.managerId.toString() !== managerId
    ) {
      await User.findByIdAndUpdate(oldBranch.managerId, { branchId: "" });
    }

    res.status(200).json({
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    if (branch.managerId) {
      await User.findByIdAndUpdate(branch.managerId, { branchId: "" });
    }

    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};