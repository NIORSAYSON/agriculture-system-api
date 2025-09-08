const express = require("express");
const router = express.Router();
const Category = require("../controllers/CategoryController");
const { checkAuth, checkAdmin } = require("../middleware/checkAuth");

router.post("/", checkAuth, checkAdmin, Category.createCategory);

router.get("/", checkAuth, Category.getCategories);

router.put("/:id", checkAuth, checkAdmin, Category.updateCategory);

router.delete("/:id", checkAuth, checkAdmin, Category.deleteCategory);

module.exports = router;
