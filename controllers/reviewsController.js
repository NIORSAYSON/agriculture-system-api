const Reviews = require("../models/Reviews")(require("mongoose"));
const DB = require("../models");

exports.addReview = async (req, res) => {
  const { product, ratings, comment } = req.body;
  const { id_number } = req.user;

  try {
    const customer = await DB.user.findOne({ id_number });
    if (!customer) {
      return res.status(404).json({ message: "User not found" });
    }

    const review = new Reviews({
      product,
      customer: customer._id,
      ratings,
      comment,
    });

    await review.save();

    // Update the isRate field for the specific product in all orders for this user
    await DB.order.updateMany(
      {
        user: customer._id,
        "products.product": product,
      },
      {
        $set: { "products.$.isRate": true },
      }
    );

    res.status(201).json({ message: "Review added successfully", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  const { id_number } = req.user;
  const user = await DB.user.findOne({ id_number });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get product ID from query
  const productID = req.query.productId;

  try {
    // Get paginated reviews
    const [reviews, total] = await Promise.all([
      Reviews.find({ product: productID })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "product",
          select: "name price",
        })
        .populate({
          path: "customer",
          select: "firstname lastname",
        }),
      Reviews.countDocuments({ product: productID }),
    ]);

    // Get average rating for all reviews of the product
    const avgResult = await Reviews.aggregate([
      {
        $match: {
          product: new (require("mongoose").Types.ObjectId)(productID),
        },
      },
      { $group: { _id: "$product", avgRating: { $avg: "$ratings" } } },
    ]);

    const averageRating = avgResult.length > 0 ? avgResult[0].avgRating : null;

    res.json({
      reviews,
      total: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      averageRating,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
