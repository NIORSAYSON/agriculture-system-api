const express = require("express");
const DB = require("../models");

exports.createCategory = async (req, res) => {
  try {
    const data = req.body;

    const category = await DB.category.create(data);
    await category.save();
    return res.status(201).json({
      message: "Category created successfully",
      category: category,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { limit, page, status } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    const condition = {
      status: "Active",
      deleted_at: null
    };

    if (status) condition.status = status;

    const categories = await DB.category.find(condition).limit(itemsLimit).skip(skip);

    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }

    const countCategories = await DB.category.countDocuments(condition);
    const totalPages = Math.ceil(countCategories / itemsLimit);

    return res.status(200).json({
      message: "Categories retrieved successfully",
      categories: categories,
      currentPage: pageNumber,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const newData = req.body;

    const category = await DB.category.findById(id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    await DB.category.findByIdAndUpdate(id, { $set: newData });

    return res.status(200).json({
      message: "Category updated successfully",
      category: category,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await DB.category.findById(id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const deletedCategory = await DB.category.findByIdAndDelete(id);
    
    return res.status(200).json({
      message: "Category deleted successfully",
      category: deletedCategory,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
