const DB = require("../models");

exports.checkout = async (req, res) => {
  try {
    const { id_number } = req.user;
    let { addressId } = req.body || {};

    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine shippingAddress
    let shippingAddress;
    if (addressId) {
      // Use specific address
      const selectedAddress = user.address.find(
        (addr) => addr._id.toString() === addressId
      );
      if (!selectedAddress) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      shippingAddress = selectedAddress;
    } else {
      // If no addressId, use the default one
      const defaultAddress = user.address.find(
        (addr) => addr.isDefault === true
      );
      if (defaultAddress) {
        shippingAddress = defaultAddress;
      } else if (user.address.length > 0) {
        // fallback: use first address if no default set
        shippingAddress = user.address[0];
      } else {
        return res
          .status(400)
          .json({ message: "Shipping address is required" });
      }
    }

    // Find the user's cart
    const cart = await DB.cart
      .findOne({ id_number })
      .populate(
        "products.product",
        "_id name price description category status type image"
      )
      .populate("user", "firstname lastname mobile_number");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Create new order
    const newOrder = await DB.order.create({
      id_number: cart.id_number,
      user: cart.user,
      products: cart.products,
      totalAmount: cart.total,
      status: "Pending",
      shippingAddress,
    });

    return res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { id } = req.params;

    // Find the order and populate products and user
    const order = await DB.order
      .findOne({ _id: id, id_number })
      .populate(
        "products.product",
        "_id name price description category status type image"
      )
      .populate("user", "firstname lastname mobile_number");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if already placed
    if (order.status === "Processing") {
      return res.status(400).json({ message: "Order is already placed" });
    }

    order.status = "Processing";
    await order.save();

    const cart = await DB.cart.findOne({ id_number });
    if (cart) {
      await DB.cart.findByIdAndUpdate(cart._id, { products: [], total: 0 });
    }

    return res.status(200).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.backOrder = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { id } = req.params;

    // Find the order
    const order = await DB.order.findOne({ _id: id, id_number });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if already cancelled
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    order.deleted_at = new Date();
    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
