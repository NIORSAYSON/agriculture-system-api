const { Schema } = require("mongoose");

module.exports = (mongoose) => {
  // Schema
  const schema = _schema(mongoose);
  // Model
  const Order = mongoose.model("order", schema);

  return Order;
};

function _schema(mongoose) {
  return mongoose.Schema(
    {
      orderId: {
        type: String,
        required: true,
      },
      id_number: {
        type: String,
        required: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      products: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          isRate: {
            type: Boolean,
            default: false,
          },
        },
      ],
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      status: {
        type: String,
        enum: ["In Transit", "Delivered", "Processing", "Cancelled"],
        default: "Processing",
      },
      shippingAddress: {
        type: Object,
        required: true,
      },
      payment: {
        method: {
          type: String,
          enum: ["COD", "GCASH"],
          default: "COD",
        },
        status: {
          type: String,
          enum: ["To Pay", "Paid", "Failed"],
          default: "To Pay",
        },
      },
      rate: {
        type: Boolean,
        default: false,
      },
      note: {
        type: String,
        default: "",
      },
      date: {
        type: Date,
      },
      deleted_at: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );
}
