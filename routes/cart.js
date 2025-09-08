const express = require("express");
const router = express.Router();
const { checkAuth, checkCustomer } = require("../middleware/checkAuth");
const CartController = require("../controllers/CartController");

router.post("/", checkAuth, checkCustomer, CartController.addToCart);

router.get("/", checkAuth, checkCustomer, CartController.getCart);

router.delete(
  "/delete",
  checkAuth,
  checkCustomer,
  CartController.deleteFromCart
);

module.exports = router;
