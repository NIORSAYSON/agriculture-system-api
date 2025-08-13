const { Schema } = require("mongoose");

module.exports = (mongoose) => {
  // Schema
  const schema = _schema(mongoose);
  // Model
  const Product = mongoose.model("product", schema);

  return Product;
};

function _schema(mongoose) {
  return mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true,
      },
      image: {
        type: String,
        default: "",
      },
      stock: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        default: "Available",
      },
    },
    {
      timestamps: true,
    }
  );
}
