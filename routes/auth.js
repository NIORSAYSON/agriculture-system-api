const express = require("express");
const router = express.Router();
const { checkAuth } = require("../middleware/checkAuth");
const AuthController = require("../controllers/AuthController");

// router.post("/google-login", checkAuth, AuthController.googleLogin);

router.post("/logout", checkAuth, AuthController.logout);

router.post("/login", AuthController.login);

module.exports = router;
