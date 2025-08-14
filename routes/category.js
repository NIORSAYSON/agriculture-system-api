const express = require("express");
const router = express.Router();
const Category = require("../controllers/CategoryController");
const { checkAuth } = require("../middleware/checkAuth");

router.post("/", checkAuth, Category.createCategory);

router.get("/", checkAuth, Category.getCategories);

router.put("/:id", checkAuth, Category.updateCategory);

router.delete("/:id", checkAuth, Category.deleteCategory);

module.exports = router;
