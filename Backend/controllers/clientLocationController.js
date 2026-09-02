const ClientLocation = require("../models/ClientLocation");
const Customer = require("../models/Customer");

exports.getClientLocations = async (req, res) => {
  try {
    const { customerId } = req.query;
    let filter = {};

    if (customerId) {
      filter.customerId = customerId;
    }

    const locations = await ClientLocation.find(filter)
      .populate("customerId", "name companyName businessType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getClientLocationById = async (req, res) => {
  try {
    const location = await ClientLocation.findById(req.params.id).populate(
      "customerId",
      "name companyName businessType"
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Client location not found",
      });
    }

    res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createClientLocation = async (req, res) => {
  try {
    const { customerId, name } = req.body;

    if (!customerId || !name) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and location name are required",
      });
    }

    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: "Associated Customer not found",
      });
    }

    const location = await ClientLocation.create({
      ...req.body,
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Client location created successfully",
      location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateClientLocation = async (req, res) => {
  try {
    let location = await ClientLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Client location not found",
      });
    }

    location = await ClientLocation.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Client location updated successfully",
      location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteClientLocation = async (req, res) => {
  try {
    const location = await ClientLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Client location not found",
      });
    }

    await location.deleteOne();

    res.status(200).json({
      success: true,
      message: "Client location deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
