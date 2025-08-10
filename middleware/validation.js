const { default: mongoose } = require("mongoose");
const DB = require("../models");
const moment = require("moment");

// Check password validity
exports.Password = async function (req, res, next) {
  const password = req.body.password;

  if (!password) {
    return res.status(400).send({ message: "No password provided." });
  }

  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_+=#^(){}|\\/<>;:'"'[\]`~.,])[A-Za-z\d@$!%*?&\-_+=#^(){}|\\/<>;:'"'[\]`~.,]{8,}$/;
  const valid = regex.test(password);
  if (!valid) {
    return res.status(400).send({
      message:
        "Password must be 8 characters+ and include uppercase, lowercase, number, and special character.",
    });
  }

  next();
};

// Check email validity
exports.Email = async function (req, res, next) {
  const email = req.body.email;

  if (!email) {
    return res.status(400).send({ message: "No email provided." });
  }

  const regex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  const valid = regex.test(email);
  if (!valid) {
    return res.status(400).send({ message: "Invalid Email" });
  }

  next();
};
