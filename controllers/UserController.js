const express = require("express");
const DB = require("../models");
const bcrypt = require("bcrypt");

exports.getAllUsers = async (req, res) => {
  try {
    const { limit, page, status, role, id, search } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    const condition = {
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
      return res.status(400).json({ message: "ID is required." });
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
    const updatedData = { ...req.body };
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Id is required." });
    }

    if (updatedData.password) {
      if (!updatedData.confirmPassword) {
        return res
          .status(400)
          .json({ message: "Confirm Password is required." });
      }
      if (updatedData.password !== updatedData.confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(updatedData.password, salt);
      delete updatedData.confirmPassword;
    }

    const user = await DB.user.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

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

exports.getAddress = async (req, res) => {
  try {
    const { id_number } = req.user;

    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Addresses fetched successfully",
      data: user.address,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.addAddresses = async (req, res) => {
  try {
    const { id_number, role } = req.user;
    const newAddress = req.body;

    if (!newAddress || !newAddress.type) {
      return res.status(400).json({ message: "Address type is required." });
    }

    if (role === "seller") {
      newAddress.category = "Seller";
    } else {
      newAddress.category = "Shipping";
    }

    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.address.push(newAddress);
    await user.save();

    return res.status(201).json({
      message: "Address added successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateAddresses = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { addressId } = req.params;
    const updatedData = req.body;

    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find address subdocument by ID
    const address = user.address.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    // If isDefault is being set to true, set all others to false
    if (updatedData.isDefault === true) {
      user.address.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    }

    address.set(updatedData);

    await user.save();

    return res.status(200).json({
      message: "User Address updated successfully",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { addressId } = req.params;

    const user = await DB.user.findOneAndUpdate(
      { id_number },
      { $pull: { address: { _id: addressId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If no addresses left, return error
    if (user.address.length === 0) {
      return res
        .status(400)
        .json({ message: "No more addresses left to delete." });
    }

    return res.status(200).json({
      message: "Address deleted successfully",
      data: user.address,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
