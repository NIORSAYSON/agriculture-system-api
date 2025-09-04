const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/OrderController");
const {
  checkAuth,
  checkSeller,
  checkSellerOrderAccess,
} = require("../middleware/checkAuth");

// Customer order routes
router.get("/", checkAuth, OrderController.getOrders);
router.post("/placeOrder", checkAuth, OrderController.placeOrder);
router.post("/buyNow", checkAuth, OrderController.buyNow);

// Seller order management routes
router.get("/seller", checkAuth, checkSeller, OrderController.getSellerOrders);
router.get(
  "/seller/stats",
  checkAuth,
  checkSeller,
  OrderController.getSellerOrderStats
);
router.put(
  "/seller/:orderId/status",
  checkAuth,
  checkSeller,
  checkSellerOrderAccess,
  OrderController.updateOrderStatus
);

// Order details (accessible by both buyers and sellers)
router.get("/:orderId", checkAuth, OrderController.getOrderDetails);

module.exports = router;
