module.exports = (mongoose) => {
  const schema = _schema(mongoose);

  const Blacklist = mongoose.model("blacklist", schema);

  return Blacklist;
};

/**
 * Create schema
 */
function _schema(mongoose) {
  return mongoose.Schema(
    {
      id_number: {
        type: String,
        required: true,
      },
      token: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );
}
