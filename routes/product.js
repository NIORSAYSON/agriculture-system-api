const express = require("express");
const ProductController = require("../controllers/ProductController");
const { checkAuth, checkSeller } = require("../middleware/checkAuth");

const router = express.Router();

// Public routes - for customers to browse all products
router.get("/", checkAuth, ProductController.getAllProducts);

// Seller-specific routes - for sellers to manage their own products
router.get(
  "/seller",
  checkAuth,
  checkSeller,
  ProductController.getSellerProducts
);
router.get(
  "/seller/stats",
  checkAuth,
  checkSeller,
  ProductController.getSellerProductStats
);
router.get(
  "/seller/:id",
  checkAuth,
  checkSeller,
  ProductController.getSellerProduct
);

// Product management routes (requires seller authentication)
router.post("/", checkAuth, checkSeller, ProductController.createProduct);
router.put("/:id", checkAuth, checkSeller, ProductController.updateProduct);
router.delete("/:id", checkAuth, checkSeller, ProductController.deleteProduct);

module.exports = router;
