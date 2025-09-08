const { Schema } = require("mongoose");

module.exports = (mongoose) => {
  // Schema
  const schema = _schema(mongoose);
  // Model
  const Notification = mongoose.model("notification", schema);

  return Notification;
};

function _schema(mongoose) {
  return mongoose.Schema(
    {
      seller_id: {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
      admin_id: {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: "user", // buyer
      },
      orderId: {
        type: String,
      },
      products: [
        {
          type: Schema.Types.ObjectId,
          ref: "product",
        },
      ],
      message: {
        type: String,
        required: true,
      },
      isRead: {
        type: Boolean,
        default: false,
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
