const express = require("express");
const router = express.Router();
const { checkAuth, checkCustomer } = require("../middleware/checkAuth");
const CartController = require("../controllers/CartController");

router.post("/", checkCustomer, checkAuth, CartController.addToCart);

router.get("/", checkCustomer, checkAuth, CartController.getCart);

router.delete("/delete", checkCustomer, checkAuth, CartController.deleteFromCart);

module.exports = router;
