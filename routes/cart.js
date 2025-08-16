const express = require("express");
const router = express.Router();
const { checkAuth } = require("../middleware/checkAuth");
const CartController = require("../controllers/CartController");

router.post("/", checkAuth, CartController.addToCart);

router.get("/", checkAuth, CartController.getCart);

router.delete("/delete", checkAuth, CartController.deleteFromCart);

module.exports = router;
