const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const DB = require("../models");
const jwt = require("jsonwebtoken");
const jwtHelper = require("../helper/token");
const { default: firebase } = require("firebase/compat/app");

exports.googleLogin = async (req, res) => {
  try {
    const firebaseToken = req.headers.authorization?.split("Bearer ")[1];

    if (!firebaseToken) {
      return res.status(401).json({
        message: "No Firebase token provided",
      });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    // Find user by email
    let user = await DB.user.findOne({ email: decodedToken.email });

    if (!user) {
      // If no user exists, create a new one
      user = await DB.user.create({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: decodedToken.email,
        role: "user", // default role
        id_number: `USR-${Math.floor(10000 + Math.random() * 90000)}`,
      });
    }

    const userData = {
      role: req.user.role,
      id_number: req.user.id_number,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      email: req.user.email,
    };

    const refreshToken = jwtHelper.generateToken("refresh", userData);
    jwtHelper.configCookie(res, "set", refreshToken);

    return res.status(200).json({
      message: "Google login successful",
      user: req.user,
      tokens: {
        firebaseToken: firebaseToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    if (req.tokenType === "firebase") {
      try {
        await admin.auth().revokeRefreshTokens(req.user.uid);
        return res.status(200).json({
          message: "Logout successful (Firebase).",
        });
      } catch (err) {
        if (err.code === "auth/id-token-revoked") {
          return res
            .status(400)
            .json({ error: "Token already revoked. User is logged out." });
        }
        throw err;
      }
    }

    if (req.tokenType === "manual") {
      try {
        const blacklist = new DB.blacklist({
          token,
          id_number: req.user.id_number,
        });
        await blacklist.save();
        jwtHelper.configCookie(res, "destroy");
        return res.status(200).json({
          message: "Logout successful.",
        });
      } catch {
        return res.status(401).json({ error: "Invalid or expired token." });
      }
    }

    return res.status(400).json({ error: "Unknown token type" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await DB.user.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const userData = {
      role: user.role,
      id_number: user.id_number,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
    };

    const accessToken = jwtHelper.generateToken("access", userData);
    const refreshToken = jwtHelper.generateToken("refresh", userData);

    jwtHelper.configCookie(res, "set", refreshToken);

    console.log("Token found.");

    return res.status(200).json({
      message: "Login successful",
      // user: user,
      tokens: {
        accessToken,
        refreshToken,
        role: userData.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.register = async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    role,
    mobile_number,
    password,
    confirmPassword,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 6);

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Password and confirm password do not match.",
      });
    }

    if (email) {
      const existingEmail = await DB.user.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          error: "Email is already in use.",
        });
      }
    }

    // Generate unique 4-digit ID based on role
    let uniqueId;
    if (role === "admin") {
      uniqueId = `ADM-${Math.floor(10000 + Math.random() * 90000)}`;
    } else if (role === "user") {
      uniqueId = `USR-${Math.floor(10000 + Math.random() * 90000)}`;
    } else {
      uniqueId = `SLR-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    const user = await DB.user.create({
      id_number: uniqueId,
      firstname,
      lastname,
      mobile_number,
      email,
      role,
      password: hashedPassword,
      uniqueId,
    });

    await user.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
