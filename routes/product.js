const express = require("express");
const ProductController = require("../controllers/ProductController");
const {
  checkAuth,
  checkSeller,
  checkAdmin,
} = require("../middleware/checkAuth");

const router = express.Router();

// Public routes - for customers to browse all products
router.get("/", checkAuth, ProductController.getAllProducts);

// Product management routes
router.post("/", checkAuth, checkSeller, ProductController.createProduct);
router.put("/:id", checkAuth, checkSeller, ProductController.updateProduct);

// Delete route accessible by both sellers and admins (must come before /seller/:id)
router.delete("/:id", checkAuth, ProductController.deleteProduct);

// Seller-specific routes - for sellers to manage their own products
router.get(
  "/seller/stats",
  checkAuth,
  checkSeller,
  ProductController.getSellerProductStats
);
router.get(
  "/seller",
  checkAuth,
  checkSeller,
  ProductController.getSellerProducts
);
router.get(
  "/seller/:id",
  checkAuth,
  checkSeller,
  ProductController.getSellerProduct
);

module.exports = router;
