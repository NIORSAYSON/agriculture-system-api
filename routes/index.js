const express = require("express");
const router = express.Router();

// Use the routes
const initRoutes = (app) => {
  router.use("/auth", require("./auth"));
  router.use("/user", require("./user"));


  router.get("/", (req, res) => {
    return res.json({
      version: "beta",
    });
  });

  return app.use("/api", router);
};

module.exports = initRoutes;
