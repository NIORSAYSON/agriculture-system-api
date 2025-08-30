const express = require("express");
const ProductController = require("../controllers/ProductController");
const { checkAuth, checkSeller } = require("../middleware/checkAuth");

const router = express.Router();

router.get("/", checkAuth, ProductController.getAllProducts);

router.post("/", checkAuth, checkSeller, ProductController.createProduct);

router.put("/:id", checkAuth, checkSeller, ProductController.updateProduct);

router.delete("/:id", checkAuth, checkSeller, ProductController.deleteProduct);

module.exports = router;
