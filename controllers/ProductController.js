const DB = require("../models");

exports.createProduct = async (req, res) => {
  try {
    const data = req.body;

    const product = await DB.product.create(data);
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
    const { limit, page, status, type, id } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    const condition = {
      status: "Active",
      deleted_at: null,
    };

    if (status) condition.status = status;
    if (type) condition.type = type;
    if (id) condition._id = id;

    const products = await DB.product
      .find(condition)
      .populate({ path: "category", select: "name status" })
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

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const newData = req.body;

    const product = await DB.product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await DB.product.findByIdAndUpdate(
      productId,
      { $set: newData },
      { new: true }
    );

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

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await DB.product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const deletedProduct = await DB.product.findByIdAndDelete(productId);

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
