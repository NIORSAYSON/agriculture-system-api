const express = require("express");
const router = express.Router();
const validation = require("../middleware/validation");
const auth = require("../controllers/AuthController");
const user = require("../controllers/UserController");
const { checkAuth } = require("../middleware/checkAuth");

// ---------- AUTH ----------
router.post("/register", validation.Email, validation.Password, auth.register);

// ---------- USER ADDRESSES (specific routes first) ----------
router.get("/address", checkAuth, user.getAddress);
router.post("/address", checkAuth, user.addAddresses);
router.put("/address/:addressId", checkAuth, user.updateAddresses);
router.delete("/address/:addressId", checkAuth, user.deleteAddress);

// ---------- USERS ----------
router.get("/", checkAuth, user.getAllUsers);
router.get("/:id_number", checkAuth, user.getUserByIdNumber);
router.put("/:id", checkAuth, user.updateUserByIdNumber);
router.delete("/:id", checkAuth, user.deleteUserById);

module.exports = router;
