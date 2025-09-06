const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/NotificationController");
const { checkAuth } = require("../middleware/checkAuth");

router.get("/", checkAuth, NotificationController.getNotifications);

module.exports = router;
