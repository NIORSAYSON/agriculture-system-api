const { Schema } = require("mongoose");

module.exports = (mongoose) => {
  // Schema
  const schema = _schema(mongoose);
  // Model
  const Category = mongoose.model("category", schema);

  return Category;
};

function _schema(mongoose) {
  return mongoose.Schema(
    /*<-------------------BASIC INFORMATION------------------->*/
    {
      name: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
        default: "Active",
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
