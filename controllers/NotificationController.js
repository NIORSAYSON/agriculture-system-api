const DB = require("../models");

exports.getNotifications = async (req, res) => {
  try {
    const { id_number } = req.user;

    const user = await DB.user.findOne({ id_number });

    const notifications = await DB.notification
      .find({ user: user._id })
      .populate("orderId", "orderId");

    return res.status(200).json({
      message: "Notifications retrieved successfully",
      notifications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
