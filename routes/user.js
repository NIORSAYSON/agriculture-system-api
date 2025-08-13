const express = require("express");
const router = express.Router();
const validation = require("../middleware/validation");
const auth = require("../controllers/AuthController");
const user = require("../controllers/UserController");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/register", validation.Email, validation.Password, auth.register);

router.get("/", verifyToken, user.getAllUsers);

router.get("/:id_number", verifyToken, user.getUserByIdNumber);

router.put("/:id", verifyToken, user.updateUserByIdNumber);

router.delete("/:id", verifyToken, user.deleteUserById);

module.exports = router;
