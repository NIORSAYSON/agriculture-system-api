const DB = require("../models");

exports.placeOrder = async (req, res) => {
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
      status: "Processing",
      shippingAddress,
      date: new Date(),
    });

    await DB.cart.findByIdAndUpdate(cart._id, { products: [], total: 0 });

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

exports.getOrders = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { limit, page, status } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    const user = await DB.user.findOne({ id_number });

    const condition = {
      user: user._id,
      deleted_at: null,
    };

    if (status) condition.status = status;

    // Find all orders for the user
    const orders = await DB.order.find(condition).skip(skip).limit(itemsLimit);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    const countOrders = await DB.order.countDocuments(condition);
    const totalPages = Math.ceil(countOrders / itemsLimit);

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
      countOrders: countOrders,
      currentPage: pageNumber,
      totalPages: totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
