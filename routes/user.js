const express = require("express");
const router = express.Router();
const validation = require("../middleware/validation");
const auth = require("../controllers/AuthController");
const user = require("../controllers/UserController");
const { checkAuth } = require("../middleware/checkAuth");

router.post("/register", validation.Email, validation.Password, auth.register);

router.get("/", checkAuth, user.getAllUsers);

router.get("/:id_number", checkAuth, user.getUserByIdNumber);

router.put("/:id", checkAuth, user.updateUserByIdNumber);

router.delete("/:id", checkAuth, user.deleteUserById);

module.exports = router;
