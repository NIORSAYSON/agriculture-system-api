const express = require("express");
const router = express.Router();
const { checkAuth, checkAdmin } = require("../middleware/checkAuth");
const AdminController = require("../controllers/AdminController");

router.get("/", checkAuth, checkAdmin, AdminController.getAdminDashboard);
router.get("/pending-products", checkAuth, checkAdmin, AdminController.getPendingProducts);
router.put("/product-approval", checkAuth, checkAdmin, AdminController.productApproval);

module.exports = router;
