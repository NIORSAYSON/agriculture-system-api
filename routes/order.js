const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/OrderController");
const { checkAuth } = require("../middleware/checkAuth");

router.post("/placeOrder", checkAuth, OrderController.placeOrder);

router.patch("/back/:id", checkAuth, OrderController.backOrder);

module.exports = router;
