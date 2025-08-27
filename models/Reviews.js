const { Schema } = require("mongoose");

module.exports = (mongoose) => {
  // Check if model already exists
  if (mongoose.models.reviews) {
    return mongoose.models.reviews;
  }

  const schema = new Schema(
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      customer: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      ratings: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
      },
    },
    {
      timestamps: true,
    }
  );

  return mongoose.model("reviews", schema);
};
