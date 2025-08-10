require("dotenv").config();
const jwt = require("jsonwebtoken");
const { serialize } = require("cookie");

exports.generateToken = function (type, payload, options = undefined) {
  if (type !== "access" && type !== "refresh") {
    throw new Error("Supply valid value for `type` arg");
  }

  if (type === "access") {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION_TIME,
    });
  }
  if (type === "refresh") {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET);
  }

  throw new Error("Error generating authentication token.");
};


exports.configCookie = function (res, mode, token = true) {
  const maxAge =
    mode === "set" ? 60 * 60 * 24 * 30 : mode === "destroy" ? -1 : null;
  if (!maxAge) {
    throw new Error("Invalid value for `mode` arg");
  }

  const serializedJWT = serialize("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge,
    path: "/",
    partitioned: true,
  });
  res.setHeader("Set-Cookie", serializedJWT);
};
