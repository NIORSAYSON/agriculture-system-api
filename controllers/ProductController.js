const DB = require("../models");

exports.createProduct = async (req, res) => {
  try {
    const { id_number } = req.user;
    const data = req.body;

    const seller = await DB.user.findOne({ id_number, role: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const seller_id = seller._id;

    const product = await DB.product.create({ ...data, seller_id });
    await product.save();

    return res.status(201).json({
      message: "Product created Successfully",
      product: product,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { limit, page, status, type, id, search, isApproved, category } =
      req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    const condition = {
      status: "Active",
      deleted_at: null,
      isApproved: true,
    };

    if (status) condition.status = status;
    if (type) condition.type = type;
    if (id) condition._id = id;
    if (search) {
      condition.$or = [
        { name: { $regex: search.toLowerCase(), $options: "i" } },
      ];
    }
    if (isApproved) condition.isApproved = isApproved;

    // Handle category filtering by name or ObjectId
    if (category) {
      // Check if category is a valid ObjectId
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(category)) {
        condition.category = category;
      } else {
        // Find category by name
        const categoryDoc = await DB.category.findOne({
          name: { $regex: new RegExp(`^${category}$`, "i") },
          status: "Active",
        });
        if (categoryDoc) {
          condition.category = categoryDoc._id;
        } else {
          // If category name not found, return empty result
          return res.status(404).json({ message: "Category not found" });
        }
      }
    }

    const products = await DB.product
      .find(condition)
      .populate({ path: "category", select: "name status" })
      .populate({ path: "seller_id", select: "firstname lastname avatar" })
      .limit(itemsLimit)
      .skip(skip);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    const countProducts = await DB.product.countDocuments(condition);
    const totalPages = Math.ceil(countProducts / itemsLimit);

    return res.status(200).json({
      message: "Products retrieved successfully",
      products: products,
      countProducts: countProducts,
      currentPage: pageNumber,
      totalPages: totalPages,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get seller's own products
exports.getSellerProducts = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { limit, page, status, type, search } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    // Find seller
    const seller = await DB.user.findOne({ id_number, role: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const condition = {
      seller_id: seller._id,
      deleted_at: null,
    };

    if (status) condition.status = status;
    if (type) condition.type = type;
    if (search) {
      condition.$or = [
        { name: { $regex: search.toLowerCase(), $options: "i" } },
        { description: { $regex: search.toLowerCase(), $options: "i" } },
      ];
    }

    const products = await DB.product
      .find(condition)
      .populate({ path: "category", select: "name status" })
      .populate({ path: "seller_id", select: "firstname lastname avatar" })
      .sort({ createdAt: -1 })
      .limit(itemsLimit)
      .skip(skip);

    const countProducts = await DB.product.countDocuments(condition);
    const totalPages = Math.ceil(countProducts / itemsLimit);

    return res.status(200).json({
      message: "Seller products retrieved successfully",
      products: products,
      countProducts: countProducts,
      currentPage: pageNumber,
      totalPages: totalPages,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id_number } = req.user;
    const productId = req.params.id;
    const newData = req.body;

    // Find seller
    const seller = await DB.user.findOne({ id_number, role: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Find product and verify ownership
    const product = await DB.product.findOne({
      _id: productId,
      seller_id: seller._id,
      deleted_at: null,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found or you don't have permission to update it",
      });
    }

    const updatedProduct = await DB.product
      .findByIdAndUpdate(productId, { $set: newData }, { new: true })
      .populate({ path: "category", select: "name status" });

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get seller product statistics
exports.getSellerProductStats = async (req, res) => {
  try {
    const { id_number } = req.user;

    // Find seller
    const seller = await DB.user.findOne({ id_number, role: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const condition = {
      seller_id: seller._id,
      deleted_at: null,
    };

    // Get product statistics
    const totalProducts = await DB.product.countDocuments(condition);

    const activeProducts = await DB.product.countDocuments({
      ...condition,
      status: "Active",
    });

    const inactiveProducts = await DB.product.countDocuments({
      ...condition,
      status: "Inactive",
    });

    const availableProducts = await DB.product.countDocuments({
      ...condition,
      type: "Available",
    });

    const outOfStockProducts = await DB.product.countDocuments({
      ...condition,
      type: "Out of Stock",
    });

    const approvedProducts = await DB.product.countDocuments({
      ...condition,
      isApproved: true,
    });

    const pendingProducts = await DB.product.countDocuments({
      ...condition,
      isApproved: false,
    });

    // Get recent products (last 5)
    const recentProducts = await DB.product
      .find(condition)
      .populate({ path: "category", select: "name" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name price status type isApproved createdAt");

    return res.status(200).json({
      message: "Seller product statistics retrieved successfully",
      stats: {
        totalProducts,
        productsByStatus: {
          active: activeProducts,
          inactive: inactiveProducts,
        },
        productsByType: {
          available: availableProducts,
          outOfStock: outOfStockProducts,
        },
        productsByApproval: {
          approved: approvedProducts,
          pending: pendingProducts,
        },
        recentProducts,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get single product for seller (with ownership validation)
exports.getSellerProduct = async (req, res) => {
  try {
    const { id_number } = req.user;
    const productId = req.params.id;

    // Find seller
    const seller = await DB.user.findOne({ id_number, role: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Find product and verify ownership
    const product = await DB.product
      .findOne({
        _id: productId,
        seller_id: seller._id,
        deleted_at: null,
      })
      .populate({ path: "category", select: "name status" })
      .populate({ path: "seller_id", select: "firstname lastname avatar" });

    if (!product) {
      return res.status(404).json({
        message: "Product not found or you don't have permission to view it",
      });
    }

    return res.status(200).json({
      message: "Product retrieved successfully",
      product: product,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id_number, role } = req.user;
    const productId = req.params.id;

    // Find product
    const product = await DB.product.findOne({
      _id: productId,
      deleted_at: null,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // If user is a seller, verify ownership
    if (role.toLowerCase() === "seller") {
      const seller = await DB.user.findOne({ id_number, role: "seller" });
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      if (product.seller_id.toString() !== seller._id.toString()) {
        return res.status(403).json({
          message: "You don't have permission to delete this product",
        });
      }
    }
    // Admins can delete any product without ownership check
    else if (role.toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Access denied. Only sellers and admins can delete products.",
      });
    }

    // Soft delete by setting deleted_at timestamp
    const deletedProduct = await DB.product.findByIdAndUpdate(
      productId,
      { deleted_at: new Date() },
      { new: true }
    );

    return res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
