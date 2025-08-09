const admin = require("firebase-admin");

exports.googleLogin = async (req, res) => {
  return res.status(200).json({
    message: "Google login successful",
    user: req.user,
  });
};

exports.logout = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res.status(401).json({ error: "No token provided" });
    }

    let decodedToken;
    try {
      // Check if token is already revoked
      decodedToken = await admin.auth().verifyIdToken(idToken, true);
    } catch (err) {
      if (err.code === "auth/id-token-revoked") {
        return res.status(400).json({ error: "Token already revoked. User is logged out." });
      }
      throw err; // Other errors (invalid token, expired, etc.)
    }

    // Revoke tokens for this UID
    await admin.auth().revokeRefreshTokens(decodedToken.uid);

    return res.status(200).json({
      message: "Logout successful, tokens revoked.",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({
      error: "Failed to log out.",
    });
  }
};
