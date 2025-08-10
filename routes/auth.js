const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const AuthController = require("../controllers/AuthController");

router.post("/google-login", verifyToken, AuthController.googleLogin);

router.post("/logout", verifyToken, AuthController.logout);

router.post("/login", AuthController.login);

module.exports = router;
