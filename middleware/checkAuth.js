const jwt = require("jsonwebtoken");
const admin = require("../firebase");
const DB = require("../models");

exports.checkAuth = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const decodedHeader = jwt.decode(token, { complete: true })?.header;

  if (decodedHeader?.kid && decodedHeader?.alg === "RS256") {
    // Firebase token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      req.tokenType = "firebase";
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Token is invalid or expired." });
    }
  } else {
    // Manual JWT
    try {
      const blacklisted = await DB.blacklist.findOne({ token });
      if (blacklisted) {
        return res.status(401).json({ message: "Token has been revoked." });
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = decoded;
      req.tokenType = "manual";
      return next();
    } catch {
      return res.status(401).json({ message: "Token is invalid or expired." });
    }
  }
};

exports.checkSeller = function (req, res, next) {
  if (req.user && req.user.role === "seller") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied. Sellers are only allowed." });
};

// Middleware to check if seller owns products in an order
exports.checkSellerOrderAccess = async function (req, res, next) {
  try {
    const { id_number } = req.user;
    const { orderId } = req.params;
    const DB = require("../models");

    // Find seller
    const seller = await DB.user.findOne({ id_number, role: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Find order
    const order = await DB.order
      .findOne({
        orderId,
        deleted_at: null,
      })
      .populate({
        path: "products.product",
        select: "seller_id",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if seller owns any products in this order
    const sellerOwnsProducts = order.products.some(
      (item) =>
        item.product &&
        item.product.seller_id &&
        item.product.seller_id.toString() === seller._id.toString()
    );

    if (!sellerOwnsProducts) {
      return res.status(403).json({
        message:
          "Access denied. You can only manage orders for your own products.",
      });
    }

    // Attach seller and order info to request for use in controller
    req.seller = seller;
    req.orderData = order;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
