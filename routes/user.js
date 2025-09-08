const express = require("express");
const router = express.Router();
const validation = require("../middleware/validation");
const auth = require("../controllers/AuthController");
const user = require("../controllers/UserController");
const {
  checkAuth,
  checkAdmin,
  checkCustomer,
} = require("../middleware/checkAuth");

// ---------- AUTH ----------
router.post("/register", validation.Email, validation.Password, auth.register);

// ---------- USER ADDRESSES (specific routes first) ----------
router.get("/address", checkAuth, checkCustomer, user.getAddress);
router.post("/address", checkAuth, checkCustomer, user.addAddresses);
router.put(
  "/address/:addressId",
  checkAuth,
  checkCustomer,
  user.updateAddresses
);
router.delete(
  "/address/:addressId",
  checkAuth,
  checkCustomer,
  user.deleteAddress
);

// ---------- USERS ----------
router.get("/", checkAuth, checkAdmin, user.getAllUsers);
router.get("/:id_number", checkAuth, user.getUserByIdNumber);
router.put("/:id", checkAuth, checkAdmin, user.updateUserByIdNumber);
router.delete("/:id", checkAuth, checkAdmin, user.deleteUserById);

module.exports = router;
