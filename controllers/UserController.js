const express = require("express");
const DB = require("../models");

exports.getAllUsers = async (req, res) => {
  try {
    const { limit, page } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    const users = await DB.user.find().limit(itemsLimit).skip(skip);

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "No users found.",
      });
    }

    const countUser = await DB.user.countDocuments(users);
    const totalPages = Math.ceil(countUser / itemsLimit);

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      currentPage: pageNumber,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
