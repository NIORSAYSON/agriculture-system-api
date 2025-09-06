const express = require("express");
const router = express.Router();
const Category = require("../controllers/CategoryController");
const { checkAuth, checkAdmin } = require("../middleware/checkAuth");

router.post("/", checkAdmin, checkAuth, Category.createCategory);

router.get("/", checkAuth, Category.getCategories);

router.put("/:id", checkAdmin, checkAuth, Category.updateCategory);

router.delete("/:id", checkAdmin, checkAuth, Category.deleteCategory);

module.exports = router;
