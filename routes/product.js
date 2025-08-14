const express = require("express");
const ProductController = require("../controllers/ProductController");

const router = express.Router();

router.get("/", ProductController.getAllProducts);

router.post("/", ProductController.createProduct);

router.put("/:id", ProductController.updateProduct);

router.delete("/:id", ProductController.deleteProduct);

module.exports = router;
