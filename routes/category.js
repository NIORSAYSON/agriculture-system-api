const express = require("express");
const router = express.Router();
const Category = require("../controllers/CategoryController");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/", verifyToken, Category.createCategory);

router.get("/", verifyToken, Category.getCategories);

router.put("/:id", verifyToken, Category.updateCategory);

router.delete("/:id", verifyToken, Category.deleteCategory);

module.exports = router;
