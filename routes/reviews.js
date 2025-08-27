const express = require("express");
const reviewsController = require("../controllers/reviewsController");
const { checkAuth } = require("../middleware/checkAuth");

const router = express.Router();

router.get("/", checkAuth, reviewsController.getReviews);
router.post("/", checkAuth, reviewsController.addReview);

module.exports = router;
