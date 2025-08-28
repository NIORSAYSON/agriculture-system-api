const DB = require("../models");

exports.placeOrder = async (req, res) => {
  try {
    const { id_number } = req.user;
    let { addressId } = req.body || {};

    // --- Find user ---
    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Determine shippingAddress ---
    let shippingAddress;
    if (addressId) {
      const selectedAddress = user.address.find(
        (addr) => addr._id.toString() === addressId
      );
      if (!selectedAddress) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      shippingAddress = selectedAddress;
    } else {
      const defaultAddress = user.address.find(
        (addr) => addr.isDefault === true
      );
      if (defaultAddress) {
        shippingAddress = defaultAddress;
      } else if (user.address.length > 0) {
        shippingAddress = user.address[0];
      } else {
        return res
          .status(400)
          .json({ message: "Shipping address is required" });
      }
    }

    // --- Find the user's cart ---
    const cart = await DB.cart
      .findOne({ id_number })
      .populate(
        "products.product",
        "_id name price description category status type image seller_id"
      )
      .populate("user", "firstname lastname mobile_number");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // --- Create new order ---
    const newOrder = await DB.order.create({
      id_number: cart.id_number,
      user: cart.user,
      products: cart.products,
      totalAmount: cart.total,
      status: "Processing",
      shippingAddress,
      date: new Date(),
    });

    // --- Group products per seller ---
    const sellerProductsMap = {};
    cart.products.forEach((p) => {
      if (p.product && p.product.seller_id) {
        const sellerId = p.product.seller_id.toString();
        if (!sellerProductsMap[sellerId]) {
          sellerProductsMap[sellerId] = [];
        }
        sellerProductsMap[sellerId].push(p.product);
      } else {
        console.warn("Product missing seller_id:", p.product?._id || p);
      }
    });

    // --- Create notifications + emit realtime event ---
    for (const [sellerId, products] of Object.entries(sellerProductsMap)) {
      const productNames = products.map((p) => p.name);
      const productIds = products.map((p) => p._id);

      const message = `📢 ${cart.user.firstname} ${
        cart.user.lastname
      } ordered: ${productNames.join(", ")}`;

      const notif = await DB.notification.create({
        seller_id: sellerId,
        user: cart.user._id,
        orderId: newOrder._id,
        products: productIds,
        message,
        isRead: false,
        date: new Date(),
      });

      global.io.to(`seller:${sellerId}`).emit("newOrderNotification", notif);
      console.log(`📢 Notified seller ${sellerId} via room seller:${sellerId}`);
    }

    // --- Clear cart after order ---
    await DB.cart.findByIdAndUpdate(cart._id, { products: [], total: 0 });

    return res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
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
