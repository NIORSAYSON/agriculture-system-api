const { Schema } = require("mongoose");

module.exports = (mongoose) => {
  // Schema
  const schema = _schema(mongoose);
  // Model
  const User = mongoose.model("user", schema);

  return User;
};

function _schema(mongoose) {
  return mongoose.Schema(
    /*<-------------------BASIC INFORMATION------------------->*/
    {
      id_number: {
        type: String,
        required: true,
      },
      firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      mobile_number: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
        default: "Active",
      },
      role: {
        type: String,
        required: true,
        default: "buyer",
      },
      avatar: {
        type: String,
        default: "",
      },
      address: [
        {
          type: { type: String, required: true },
          category: {
            type: String,
            enum: ["Shipping", "Seller"],
            required: true,
          },
          street: { type: String },
          city: { type: String },
          province: { type: String },
          zipcode: { type: String },
          country: { type: String, default: "Philippines" },
          isDefault: { type: Boolean, default: false },
        },
      ],
      password: {
        type: String,
        required: true,
      },
      store_id: {
        type: String,
        default: "",
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
