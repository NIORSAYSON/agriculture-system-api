const express = require("express");
const router = express.Router();
const validation = require("../middleware/validation");
const auth = require("../controllers/AuthController");
const user = require("../controllers/UserController");
const { checkAuth, checkAdmin, checkCustomer } = require("../middleware/checkAuth");

// ---------- AUTH ----------
router.post("/register", validation.Email, validation.Password, auth.register);

// ---------- USER ADDRESSES (specific routes first) ----------
router.get("/address", checkCustomer, checkAuth, user.getAddress);
router.post("/address", checkCustomer, checkAuth, user.addAddresses);
router.put("/address/:addressId", checkCustomer, checkAuth, user.updateAddresses);
router.delete("/address/:addressId", checkCustomer, checkAuth, user.deleteAddress);

// ---------- USERS ----------
router.get("/", checkAdmin, checkAuth, user.getAllUsers);
router.get("/:id_number", checkAuth, user.getUserByIdNumber);
router.put("/:id", checkAdmin, checkAuth, user.updateUserByIdNumber);
router.delete("/:id", checkAdmin, checkAuth, user.deleteUserById);

module.exports = router;
