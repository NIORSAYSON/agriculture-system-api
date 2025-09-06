const express = require("express");
const DB = require("../models");

exports.getAdminDashboard = async (req, res) => {
  try {
    const { id_number } = req.user;
    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const totalUsers = await DB.user.countDocuments({
      role: "user",
      status: "Active",
      deleted_at: null,
    });

    const totalSellers = await DB.user.countDocuments({
      role: "seller",
      status: "Active",
      deleted_at: null,
    });

    const totalProducts = await DB.product.countDocuments({
      status: "Active",
      isApproved: true,
      type: "Available",
      deleted_at: null,
    });

    const totalAmount = await DB.order.aggregate([
      {
        $match: {
          status: "Delivered",
          deleted_at: null,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalOrderAmount =
      totalAmount.length > 0 ? totalAmount[0].totalAmount : 0;

    return res.status(200).json({
      message: "Admin dashboard data fetched successfully",
      data: {
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrderAmount,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getPendingProducts = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { limit, page } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const condition = {
      isApproved: false,
      deleted_at: null,
    };

    // Get all pending products without pagination first
    const allPendingProducts = await DB.product
      .find(condition)
      .populate({ path: "category", select: "name" })
      .populate({ path: "seller_id", select: "firstname lastname" });

    // Group products by seller_id
    const groupedBySeller = allPendingProducts.reduce((acc, product) => {
      const sellerId = product.seller_id._id.toString();
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: product.seller_id,
          products: [],
        };
      }
      acc[sellerId].products.push(product);
      return acc;
    }, {});

    // Convert to array format
    const groupedArray = Object.values(groupedBySeller).sort(
      (a, b) => b.products.length - a.products.length
    );

    // Apply pagination to grouped results
    const paginatedGroups = groupedArray.slice(skip, skip + itemsLimit);

    const totalGroups = groupedArray.length;
    const totalPages = Math.ceil(totalGroups / itemsLimit);

    // Calculate total products count
    const totalProducts = allPendingProducts.length;

    return res.status(200).json({
      message: "Pending products grouped by seller fetched successfully",
      data: paginatedGroups,
      totalSellers: totalGroups,
      totalProducts: totalProducts,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.productApproval = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { productIds, isApproved } = req.body;

    const user = await DB.user.findOne({ id_number });

    if (!user) {
      return res.status(403).json({ message: "Admin not found" });
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        message: "Product IDs and approval status are required",
      });
    }

    // Get products before updating to get seller information
    const products = await DB.product
      .find({ _id: { $in: productIds } })
      .populate("seller_id");

    // Update multiple products
    const result = await DB.product.updateMany(
      { _id: { $in: productIds } },
      { $set: { isApproved } }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "No products found with the given IDs" });
    }

    // Create notifications for sellers
    for (const product of products) {
      const status = isApproved ? "approved" : "rejected";
      const sellerMessage = `📦 Your product(s) has been ${status} by admin`;

      await DB.notification.create({
        admin_id: user._id, // Admin who updated the status
        message: sellerMessage,
        isRead: false,
        date: new Date(),
      });

      // Emit real-time notification to seller
      global.io
        .to(`user:${product.seller_id._id}`)
        .emit("productStatusUpdate", {
          productId: product._id,
          status: status,
          message: sellerMessage,
        });
    }

    return res.status(200).json({
      message: `Products ${isApproved ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
