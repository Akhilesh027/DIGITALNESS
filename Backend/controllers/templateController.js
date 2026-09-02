const Template = require('../models/Template.js');

// CREATE
exports.createTemplate = async (req, res) => {
  try {
    const template = await Template.create({
      ...req.body,
      createdBy: req.user._id,
      branchId: req.user.branchId,
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
exports.deleteTemplate = async (req, res) => {
  try {
    await Template.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: 'Deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};