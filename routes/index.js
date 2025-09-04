const express = require("express");
const router = express.Router();

// Use the routes
const initRoutes = (app) => {
  router.use("/auth", require("./auth"));
  router.use("/user", require("./user"));
  router.use("/product", require("./product"));
  router.use("/category", require("./category"));
  router.use("/cart", require("./cart"));
  router.use("/messages", require("./message"));
  router.use("/order", require("./order"));
  router.use("/reviews", require("./reviews"));
  router.use("/notification", require("./notification"));

  router.get("/", (req, res) => {
    return res.json({
      version: "beta",
    });
  });

  return app.use("/api", router);
};

module.exports = initRoutes;
