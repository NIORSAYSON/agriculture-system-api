const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/OrderController");
const { checkAuth } = require("../middleware/checkAuth");

router.get("/", checkAuth, OrderController.getOrders);

router.post("/placeOrder", checkAuth, OrderController.placeOrder);

module.exports = router;
