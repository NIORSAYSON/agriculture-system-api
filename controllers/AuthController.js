exports.googleLogin = async (req, res) => {
  return res.status(200).json({
    message: "Google login successful",
    user: req.user,
  });
};

exports.logout = async (req, res) => {
  // Logout logic here
};
