const express = require("express");
const router = express.Router();
const { verifyFirebaseToken } = require("../middleware/verifyTokenFirebase");
const AuthController = require("../controllers/AuthController");

router.post("/", verifyFirebaseToken, AuthController.googleLogin);

module.exports = router;
