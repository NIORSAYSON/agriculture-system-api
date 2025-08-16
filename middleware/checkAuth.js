const jwt = require("jsonwebtoken");
const admin = require("../firebase");
const DB = require("../models");

exports.checkAuth = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const decodedHeader = jwt.decode(token, { complete: true })?.header;

  if (decodedHeader?.kid && decodedHeader?.alg === "RS256") {
    // Firebase token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      req.tokenType = "firebase";
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Token is invalid or expired." });
    }
  } else {
    // Manual JWT
    try {
      const blacklisted = await DB.blacklist.findOne({ token });
      if (blacklisted) {
        return res.status(401).json({ message: "Token has been revoked." });
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = decoded;
      req.tokenType = "manual";
      return next();
    } catch {
      return res.status(401).json({ message: "Token is invalid or expired." });
    }
  }
};
