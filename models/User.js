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
        default: "user",
      },
      avatar: {
        type: String,
        default: "",
      },
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
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );
}
