const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Client = require("../models/Client");

const JWT_SECRET = process.env.JWT_SECRET || "digitalnesscrmsecret";

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      token = parts.length === 2 ? parts[1] : req.headers.authorization;
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    } else if (req.headers["token"]) {
      token = req.headers["token"];
    }

    if (token) {
      token = String(token).replace(/['"]+/g, "").trim();
    }

    if (!token || token === "null" || token === "undefined" || token === "") {
      return res.status(401).json({
        message: "Not authorized, no token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      // Try verifying with fallback if env JWT_SECRET differed
      try {
        decoded = jwt.verify(token, "digitalnesscrmsecret");
      } catch {
        return res.status(401).json({
          message: `Not authorized: ${jwtErr.message}`,
        });
      }
    }

    const targetId = decoded.id || decoded._id || decoded.userId;

    if (!targetId) {
      return res.status(401).json({
        message: "Not authorized: Invalid token structure",
      });
    }

    // CLIENT LOGIN
    if (decoded.type === "client" || decoded.role === "Client") {
      const client = await Client.findById(targetId).select("-password");

      if (!client) {
        return res.status(401).json({
          message: "Client account not found",
        });
      }

      req.client = client;
      req.user = {
        _id: client._id,
        role: "Client",
        branchId: client.branchId,
      };

      return next();
    }

    // ADMIN / EMPLOYEE LOGIN
    const user = await User.findById(targetId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth protect error:", error.message);
    res.status(401).json({
      message: `Not authorized: ${error.message}`,
    });
  }
};