const express = require("express");
const DB = require("../models");

exports.getAllUsers = async (req, res) => {
  try {
    const { limit, page, status, role, id, search } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    const condition = {
      status: "Active",
      deleted_at: null,
    };

    if (status) condition.status = status;
    if (role) condition.role = role;
    if (id) condition._id = id;
    if (search) {
      condition.$or = [
        { firstname: { $regex: search.toLowerCase(), $options: "i" } },
        { lastname: { $regex: search.toLowerCase(), $options: "i" } },
        { id_number: { $regex: search.toUpperCase(), $options: "i" } },
      ];
    }

    const users = await DB.user.find(condition).limit(itemsLimit).skip(skip);

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "No users found.",
      });
    }

    const countUser = await DB.user.countDocuments(condition);
    const totalPages = Math.ceil(countUser / itemsLimit);

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      countUsers: countUser,
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

exports.getUserByIdNumber = async (req, res) => {
  try {
    const { id_number } = req.params;
    if (!id_number) {
      return res.status(400).json({ message: "id_number is required." });
    }

    const user = await DB.user
      .findOne({ id_number: id_number })
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateUserByIdNumber = async (req, res) => {
  try {
    const updatedData = req.body;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Id is required." });
    }

    const user = await DB.user.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await DB.user.findByIdAndUpdate(id, { $set: updatedData });

    return res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Id is required." });
    }

    const user = await DB.user.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await DB.user.findByIdAndDelete(id);

    return res.status(200).json({
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
