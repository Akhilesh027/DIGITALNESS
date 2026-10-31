const path = require("path");
const fs = require("fs");
const Certificate = require("../models/Certificate");

const ADMIN_ROLES = ["Admin", "admin", "Operational Manager"];

const canManage = (user) => {
  return ADMIN_ROLES.includes(user?.role);
};

// Generate a random clean Certificate ID if none provided
const generateCertificateId = (type = "EXP") => {
  const prefix = type === "Internship" ? "DN-INT" : "DN-EXP";
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
};

// @desc    Get all certificates (Admin)
// @route   GET /api/certificates
// @access  Private (Admin / Manager)
const getCertificates = async (req, res) => {
  try {
    const { search, type, status, page = 1, limit = 50 } = req.query;

    const query = {};

    if (type && type !== "All") {
      query.certificateType = type;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { certificateId: regex },
        { recipientName: regex },
        { recipientEmail: regex },
        { domain: regex },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("createdBy", "name email role")
        .lean(),
      Certificate.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: certificates.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: certificates,
    });
  } catch (error) {
    console.error("Error in getCertificates:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch certificates",
      error: error.message,
    });
  }
};

// @desc    Get single certificate by ID
// @route   GET /api/certificates/:id
// @access  Private
const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate("createdBy", "name email")
      .lean();

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("Error in getCertificateById:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve certificate",
      error: error.message,
    });
  }
};

// @desc    Public certificate verification
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
const verifyCertificatePublic = async (req, res) => {
  try {
    const rawId = (req.params.certificateId || "").trim();
    if (!rawId) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Certificate ID or Intern/Employee ID is required",
      });
    }

    const cleanId = rawId.toUpperCase();

    // Query by certificateId or matching metadata
    const certificate = await Certificate.findOne({
      $or: [
        { certificateId: cleanId },
        { certificateId: new RegExp(`^${cleanId}$`, "i") },
      ],
    }).lean();

    if (!certificate) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: `No certificate found matching ID "${rawId}". Please verify the ID number and try again.`,
      });
    }

    const isRevoked = certificate.status === "Revoked";
    const isExpired =
      certificate.status === "Expired" ||
      (certificate.validUntil && new Date(certificate.validUntil) < new Date());

    return res.status(200).json({
      success: true,
      verified: !isRevoked,
      isRevoked,
      isExpired,
      message: isRevoked
        ? "This certificate was issued by Digitalness but has since been REVOKED."
        : "Certificate verified successfully as authentic.",
      data: {
        certificateId: certificate.certificateId,
        recipientName: certificate.recipientName,
        certificateType: certificate.certificateType,
        domain: certificate.domain,
        issueDate: certificate.issueDate,
        startDate: certificate.startDate,
        validUntil: certificate.validUntil,
        status: certificate.status,
        description: certificate.description,
        fileUrl: certificate.fileUrl,
        fileType: certificate.fileType,
      },
    });
  } catch (error) {
    console.error("Error in verifyCertificatePublic:", error);
    return res.status(500).json({
      success: false,
      verified: false,
      message: "Server error while verifying certificate",
      error: error.message,
    });
  }
};

// @desc    Create / Upload certificate record
// @route   POST /api/certificates
// @access  Private (Admin / Manager)
const createCertificate = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to upload certificates",
      });
    }

    const body = req.body || {};
    let fileUrl = body.fileUrl || "";
    let fileType = body.fileType || "pdf";

    if (req.file) {
      fileUrl = `/uploads/certificates/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      fileType = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
        ? "image"
        : "pdf";
    }

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Certificate document file (PDF or Image) is required",
      });
    }

    let certificateId = (body.certificateId || "").trim().toUpperCase();
    if (!certificateId) {
      certificateId = generateCertificateId(body.certificateType);
    }

    // Check duplicate ID
    const existing = await Certificate.findOne({ certificateId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Certificate ID "${certificateId}" already exists. Please choose a unique ID.`,
      });
    }

    const newCert = new Certificate({
      certificateId,
      recipientName: (body.recipientName || "").trim(),
      recipientEmail: (body.recipientEmail || "").trim().toLowerCase(),
      certificateType: body.certificateType || "Internship",
      domain: (body.domain || "").trim() || "Digital Agency",
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      startDate: body.startDate ? new Date(body.startDate) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      fileUrl,
      fileType,
      status: body.status || "Active",
      description: (body.description || "").trim(),
      createdBy: req.user?._id || null,
    });

    if (!newCert.recipientName) {
      return res.status(400).json({
        success: false,
        message: "Recipient name is required",
      });
    }

    await newCert.save();

    return res.status(201).json({
      success: true,
      message: "Certificate uploaded and registered successfully",
      data: newCert,
    });
  } catch (error) {
    console.error("Error in createCertificate:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create certificate",
      error: error.message,
    });
  }
};

// @desc    Update certificate record
// @route   PUT /api/certificates/:id
// @access  Private (Admin / Manager)
const updateCertificate = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    const body = req.body || {};

    if (body.certificateId && body.certificateId.trim().toUpperCase() !== cert.certificateId) {
      const nextId = body.certificateId.trim().toUpperCase();
      const duplicate = await Certificate.findOne({
        certificateId: nextId,
        _id: { $ne: cert._id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Certificate ID "${nextId}" is already taken`,
        });
      }
      cert.certificateId = nextId;
    }

    if (body.recipientName !== undefined) cert.recipientName = body.recipientName.trim();
    if (body.recipientEmail !== undefined) cert.recipientEmail = body.recipientEmail.trim().toLowerCase();
    if (body.certificateType !== undefined) cert.certificateType = body.certificateType;
    if (body.domain !== undefined) cert.domain = body.domain.trim();
    if (body.issueDate !== undefined) cert.issueDate = new Date(body.issueDate);
    if (body.startDate !== undefined) cert.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.validUntil !== undefined) cert.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.status !== undefined) cert.status = body.status;
    if (body.description !== undefined) cert.description = body.description.trim();

    if (req.file) {
      cert.fileUrl = `/uploads/certificates/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      cert.fileType = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
        ? "image"
        : "pdf";
    } else if (body.fileUrl) {
      cert.fileUrl = body.fileUrl;
      if (body.fileType) cert.fileType = body.fileType;
    }

    await cert.save();

    return res.status(200).json({
      success: true,
      message: "Certificate updated successfully",
      data: cert,
    });
  } catch (error) {
    console.error("Error in updateCertificate:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update certificate",
      error: error.message,
    });
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Private (Admin)
const deleteCertificate = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // Attempt to remove physical file if under uploads/certificates
    if (cert.fileUrl && cert.fileUrl.startsWith("/uploads/certificates/")) {
      const fullPath = path.join(__dirname, "..", cert.fileUrl);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn("Could not remove certificate file:", fullPath);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteCertificate:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete certificate",
      error: error.message,
    });
  }
};

// @desc    Toggle status between Active and Revoked
// @route   PATCH /api/certificates/:id/status
// @access  Private (Admin)
const toggleCertificateStatus = async (req, res) => {
  try {
    if (!canManage(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    const targetStatus = req.body?.status;
    if (targetStatus && ["Active", "Revoked", "Expired"].includes(targetStatus)) {
      cert.status = targetStatus;
    } else {
      cert.status = cert.status === "Active" ? "Revoked" : "Active";
    }

    await cert.save();

    return res.status(200).json({
      success: true,
      message: `Certificate status updated to ${cert.status}`,
      data: cert,
    });
  } catch (error) {
    console.error("Error in toggleCertificateStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

module.exports = {
  getCertificates,
  getCertificateById,
  verifyCertificatePublic,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  toggleCertificateStatus,
};

