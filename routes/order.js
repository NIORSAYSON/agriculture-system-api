const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/OrderController");
const { checkAuth } = require("../middleware/checkAuth");

router.post("/checkout", checkAuth, OrderController.checkout);

router.post("/placeOrder/:id", checkAuth, OrderController.placeOrder);

router.patch("/back/:id", checkAuth, OrderController.backOrder);

module.exports = router;
