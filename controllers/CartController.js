const DB = require("../models");

exports.addToCart = async (req, res) => {
  try {
    const { id, id_number } = req.user;
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).send({ message: "Invalid request body" });
    }

    const user = await DB.user.findOne({ id_number });

    // Find if cart exists for this user
    let cart = await DB.cart.findOne({ user: user._id });

    if (!cart) {
      // Create new cart
      cart = new DB.cart({
        id_number,
        user: user._id,
        products: [],
        total: 0,
      });
    }

    // Update products in the cart
    products.forEach((newItem) => {
      const existingItem = cart.products.find(
        (item) => item.product.toString() === newItem.product
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        cart.products.push({
          product: newItem.product,
          quantity: newItem.quantity,
        });
      }
    });

    let total = 0;
    for (const item of cart.products) {
      const productDoc = await DB.product.findById(item.product);
      if (productDoc) {
        total += productDoc.price * item.quantity;
      }
    }
    cart.total = total;

    await cart.save();

    return res.status(201).send({
      message: "Product added to cart successfully",
      cart: cart,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).send({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const { id_number } = req.user;
    // const id = req.params.id

    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const cart = await DB.cart
      .findOne({ user: user._id })
      .populate({
        path: "products.product",
        select: "name price image seller_id",
        populate: {
          path: "seller_id",
          select: "_id firstname lastname",
        },
      })
      .populate({ path: "user", select: "firstname lastname mobile_number" });
    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }

    return res.status(200).send({
      message: "Cart retrieved successfully",
      cart: cart,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteFromCart = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { productIds } = req.body;

    if (!productIds || productIds.length === 0) {
      return res.status(400).send({ message: "Product ID array is required" });
    }

    // Find user
    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Find cart
    let cart = await DB.cart.findOne({ user: user._id });
    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }

    // Remove all products in the array
    const initialLength = cart.products.length;
    cart.products = cart.products.filter(
      (item) => !productIds.includes(item.product.toString())
    );

    if (cart.products.length === initialLength) {
      return res
        .status(404)
        .send({ message: "No matching products found in cart" });
    }

    // Recalculate total
    let total = 0;
    for (const item of cart.products) {
      const productDoc = await DB.product.findById(item.product);
      if (productDoc) {
        total += productDoc.price * item.quantity;
      }
    }
    cart.total = total;

    await cart.save();

    return res.status(200).send({
      message: "Products removed from cart successfully",
      cart: cart,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Internal server error",
      error: error.message,
    });
  }
};
