const express = require("express");
const ProductController = require("../controllers/ProductController");
const { checkAuth } = require("../middleware/checkAuth");

const router = express.Router();

router.get("/", ProductController.getAllProducts);

router.get("/", checkAuth, ProductController.getAllProducts);

router.post("/", checkAuth, ProductController.createProduct);

router.put("/:id", checkAuth, ProductController.updateProduct);

router.delete("/:id", checkAuth, ProductController.deleteProduct);

module.exports = router;
