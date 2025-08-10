const express = require("express");
const router = express.Router();
const validation = require("../middleware/validation");
const auth = require("../controllers/AuthController");
const user = require("../controllers/UserController");

router.post("/register", validation.Email, validation.Password, auth.register);

router.get("/", user.getAllUsers);

module.exports = router;
