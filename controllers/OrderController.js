const DB = require("../models");
const orderHelper = require("../helper/orderHelper");
const { connectedUsers } = require("../socket/chatSocket");
const Message = require("../models/Message");

exports.placeOrder = async (req, res) => {
  try {
    const { id_number } = req.user;
    let {
      addressId,
      shippingFee = 0,
      deliveryMethod = "Delivery",
    } = req.body || {};
    const io = req.app.get("io");

    // --- Find user ---
    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- If pickup, set shipping fee to 0 ---
    if (deliveryMethod === "Pickup") {
      shippingFee = 0;
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
        "_id name price description category status type image seller_id stock"
      )
      .populate("user", "firstname lastname mobile_number");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // --- Validate all products are available and have valid sellers ---
    for (const item of cart.products) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({
          message: "One or more products in cart are no longer available",
        });
      }

      if (product.type !== "Available" || product.status !== "Active") {
        return res.status(400).json({
          message: `Product ${product.name} is no longer available`,
        });
      }

      if (!product.seller_id) {
        return res.status(400).json({
          message: `Product ${product.name} has no valid seller`,
        });
      }

      // Verify seller exists and is active
      const seller = await DB.user.findOne({
        _id: product.seller_id,
        role: "seller",
        status: "Active",
        deleted_at: null,
      });

      if (!seller) {
        return res.status(400).json({
          message: `Seller for product ${product.name} is not available`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    // --- Generate unique random 8-digit order ID ---
    const orderId = await orderHelper.generateOrderId();

    // --- Create new order ---
    const newOrder = await DB.order.create({
      orderId, // store generated ID
      id_number: cart.id_number,
      user: cart.user,
      products: cart.products,
      totalAmount: cart.total + shippingFee,
      shippingFee: shippingFee,
      deliveryMethod: deliveryMethod,
      status: "Processing",
      shippingAddress,
      date: new Date(),
    });

    // --- Deduct product stock ---
    for (const item of cart.products) {
      const product = await DB.product.findById(item.product._id);
      if (product) {
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}`,
          });
        }
        product.stock -= item.quantity;
        await product.save();
      }
    }

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
      } ordered: ${productNames.join(", ")} (Order #${newOrder.orderId})`;

      const notif = await DB.notification.create({
        seller_id: sellerId,
        user: cart.user._id,
        orderId: newOrder.orderId, // ✅ use generated 8-digit ID
        products: productIds,
        message,
        isRead: false,
        date: new Date(),
      });

      const receiverSocketId = connectedUsers.get(sellerId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newOrderNotificationPopupNow", notif);
      }

      global.io
        .to(`seller:${sellerId}`)
        .emit("newOrderNotificationPopupNow", notif);
      console.log(`📢 Notified seller ${sellerId} via room seller:${sellerId}`);

      // --- Send a message from seller to user ---
      const thankYouMsg = `Hello ${
        cart.user.firstname
      }, thank you for your order of ${productNames.join(", ")}! Your order #${
        newOrder.orderId
      } will be processed soon.`;

      await Message.create({
        senderId: sellerId,
        receiverId: cart.user._id,
        content: thankYouMsg,
      });

      // Optionally, notify the user via socket
      const userSocketId = connectedUsers.get(cart.user._id.toString());
      if (userSocketId) {
        io.to(userSocketId).emit("refreshConversation", { refresh: true });
      }
    }

    // --- Clear cart after order ---
    await DB.cart.findByIdAndUpdate(cart._id, { products: [], total: 0 });

    return res.status(201).json({
      message: "Order placed successfully",
      order: newOrder, // includes orderId
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
    const io = req.app.get("io");

    const user = await DB.user.findOne({ id_number });

    const condition = {
      user: user._id,
      deleted_at: null,
    };

    if (status) condition.status = status;

    // Find all orders for the user
    const orders = await DB.order
      .find(condition)
      .skip(skip)
      .limit(itemsLimit)
      .populate({
        path: "products.product",
        select: "name image price",
      });

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

exports.buyNow = async (req, res) => {
  try {
    const { id_number } = req.user;
    const {
      productId,
      quantity,
      addressId,
      shippingFee = 0,
      deliveryMethod = "Delivery",
    } = req.body;

    // --- Validate user ---
    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- If pickup, set shipping fee to 0 ---
    let finalShippingFee = deliveryMethod === "Pickup" ? 0 : shippingFee;

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

    // --- Find product ---
    const product = await DB.product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.type !== "Available") {
      return res.status(400).json({ message: "Product is not available" });
    }

    if (product.status !== "Active") {
      return res.status(400).json({ message: "Product is not active" });
    }

    if (!product.seller_id) {
      return res.status(400).json({ message: "Product has no valid seller" });
    }

    // Verify seller exists and is active
    const seller = await DB.user.findOne({
      _id: product.seller_id,
      role: "seller",
      status: "Active",
      deleted_at: null,
    });

    if (!seller) {
      return res
        .status(400)
        .json({ message: "Product seller is not available" });
    }

    const qty = quantity || 1;

    // --- Check stock ---
    if (product.stock < qty) {
      return res.status(400).json({
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${qty}`,
      });
    }

    // --- Deduct stock ---
    product.stock -= qty;
    await product.save();

    // --- Build product item ---
    const orderProduct = {
      product: product._id,
      quantity: qty,
      price: product.price,
    };

    const totalAmount = product.price * qty + finalShippingFee;

    // --- Generate unique random 8-digit order ID ---
    const orderId = await orderHelper.generateOrderId();

    // --- Create new order ---
    const newOrder = await DB.order.create({
      orderId,
      id_number: id_number,
      user: user._id,
      products: [orderProduct],
      totalAmount,
      shippingFee: finalShippingFee,
      deliveryMethod: deliveryMethod,
      status: "Processing",
      shippingAddress,
      date: new Date(),
    });

    // --- Notify seller ---
    if (product.seller_id) {
      const sellerId = product.seller_id.toString();
      const message = `📢 ${user.firstname} ${user.lastname} bought: ${product.name} (Order #${newOrder.orderId})`;

      const notif = await DB.notification.create({
        seller_id: sellerId,
        user: user._id,
        orderId: newOrder.orderId,
        products: [product._id],
        message,
        isRead: false,
        date: new Date(),
      });

      const receiverSocketId = connectedUsers.get(product.seller_id.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newOrderNotificationPopupNow", notif);
      }

      global.io.to(`seller:${sellerId}`).emit("newOrderNotification", notif);
      // console.log(`📢 Notified seller ${sellerId} via room seller:${sellerId}`);

      // --- Send a message from seller to user ---
      const thankYouMsg = `Hello ${user.firstname}, thank you for your order of ${product.name}! Your order #${newOrder.orderId} will be processed soon.`;

      await Message.create({
        senderId: sellerId,
        receiverId: user._id,
        content: thankYouMsg,
      });

      // Optionally, notify the user via socket
      const userSocketId = connectedUsers.get(user._id.toString());
      if (userSocketId) {
        io.to(userSocketId).emit("refreshConversation", { refresh: true });
      }
    }

    return res.status(201).json({
      message: "Order placed successfully",
      order: newOrder, // includes orderId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ===== SELLER ORDER MANAGEMENT =====

exports.getSellerOrders = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { limit, page, status } = req.query;
    const itemsLimit = Math.max(parseInt(limit) || 10, 1);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * itemsLimit;

    // Find seller
    const seller = await DB.user.findOne({ id_number, role: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Find all products belonging to this seller
    const sellerProducts = await DB.product
      .find({
        seller_id: seller._id,
        deleted_at: null,
      })
      .select("_id");

    const productIds = sellerProducts.map((p) => p._id);

    if (productIds.length === 0) {
      return res.status(200).json({
        message: "No orders found",
        orders: [],
        countOrders: 0,
        currentPage: pageNumber,
        totalPages: 0,
      });
    }

    // Build query condition
    const condition = {
      "products.product": { $in: productIds },
      deleted_at: null,
    };

    if (status) condition.status = status;

    // Find orders that contain seller's products
    const orders = await DB.order
      .find(condition)
      .skip(skip)
      .limit(itemsLimit)
      .populate({
        path: "products.product",
        select: "name image price seller_id",
      })
      .populate({
        path: "user",
        select: "firstname lastname mobile_number email",
      })
      .sort({ createdAt: -1 });

    // Filter orders to only include products that belong to this seller
    const filteredOrders = orders
      .map((order) => {
        const sellerProducts = order.products.filter(
          (item) =>
            item.product &&
            item.product.seller_id &&
            item.product.seller_id.toString() === seller._id.toString()
        );

        // Calculate total for seller's products only
        const sellerTotal = sellerProducts.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );

        return {
          ...order.toObject(),
          products: sellerProducts,
          sellerTotal,
        };
      })
      .filter((order) => order.products.length > 0);

    const countOrders = await DB.order.countDocuments(condition);
    const totalPages = Math.ceil(countOrders / itemsLimit);

    return res.status(200).json({
      message: "Seller orders retrieved successfully",
      orders: filteredOrders,
      countOrders: filteredOrders.length,
      currentPage: pageNumber,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "In Transit",
      "Delivered",
      "Processing",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    // Get seller and order from middleware (already validated)
    const seller = req.seller;
    const order = req.orderData;

    // Update order status
    order.status = status;
    await order.save();

    // Create notification for buyer
    const buyerMessage = `📦 Your order #${order.orderId} status has been updated to: ${status}`;

    await DB.notification.create({
      seller_id: seller._id, // Seller who updated the status
      user: order.user,
      orderId: order.orderId,
      products: order.products.map((p) => p.product._id),
      message: buyerMessage,
      isRead: false,
      date: new Date(),
    });

    // Emit real-time notification to buyer
    global.io.to(`user:${order.user}`).emit("orderStatusUpdate", {
      orderId: order.orderId,
      status: status,
      message: buyerMessage,
    });

    return res.status(200).json({
      message: "Order status updated successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { orderId } = req.params;

    // Check if user is seller or regular user
    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find order
    const order = await DB.order
      .findOne({
        orderId,
        deleted_at: null,
      })
      .populate({
        path: "products.product",
        select: "name image price seller_id description",
      })
      .populate({
        path: "user",
        select: "firstname lastname mobile_number email",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If user is a seller, filter to only their products
    if (user.role === "seller") {
      const sellerProducts = order.products.filter(
        (item) =>
          item.product &&
          item.product.seller_id &&
          item.product.seller_id.toString() === user._id.toString()
      );

      if (sellerProducts.length === 0) {
        return res.status(403).json({
          message:
            "Access denied. You can only view orders for your own products.",
        });
      }

      // Return filtered order for seller
      const sellerTotal = sellerProducts.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      return res.status(200).json({
        message: "Order details retrieved successfully",
        order: {
          ...order.toObject(),
          products: sellerProducts,
          sellerTotal,
        },
      });
    } else {
      // Regular user can only view their own orders
      if (order.user._id.toString() !== user._id.toString()) {
        return res.status(403).json({
          message: "Access denied. You can only view your own orders.",
        });
      }

      return res.status(200).json({
        message: "Order details retrieved successfully",
        order: order,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getSellerOrderStats = async (req, res) => {
  try {
    const { id_number } = req.user;

    // Find seller
    const seller = await DB.user.findOne({ id_number, role: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Find all products belonging to this seller
    const sellerProducts = await DB.product
      .find({
        seller_id: seller._id,
        deleted_at: null,
      })
      .select("_id");

    const productIds = sellerProducts.map((p) => p._id);

    if (productIds.length === 0) {
      return res.status(200).json({
        message: "No statistics available",
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          ordersByStatus: {
            Processing: 0,
            "In Transit": 0,
            Delivered: 0,
            Cancelled: 0,
          },
          recentOrders: [],
        },
      });
    }

    // Find orders that contain seller's products
    const allOrders = await DB.order
      .find({
        "products.product": { $in: productIds },
        deleted_at: null,
      })
      .populate({
        path: "products.product",
        select: "name price seller_id",
      })
      .populate({
        path: "user",
        select: "firstname lastname",
      })
      .sort({ createdAt: -1 });

    // Filter and calculate stats for seller's products only
    let totalRevenue = 0;
    const ordersByStatus = {
      Processing: 0,
      "In Transit": 0,
      Delivered: 0,
      Cancelled: 0,
    };

    const validOrders = allOrders.filter((order) => {
      const sellerProducts = order.products.filter(
        (item) =>
          item.product &&
          item.product.seller_id &&
          item.product.seller_id.toString() === seller._id.toString()
      );

      if (sellerProducts.length > 0) {
        // Calculate revenue for this seller's products in this order
        const orderRevenue = sellerProducts.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        totalRevenue += orderRevenue;

        // Count order by status
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;

        return true;
      }
      return false;
    });

    // Get recent orders (last 5)
    const recentOrders = validOrders.slice(0, 5).map((order) => ({
      orderId: order.orderId,
      status: order.status,
      customerName: `${order.user.firstname} ${order.user.lastname}`,
      totalAmount: order.products
        .filter(
          (item) =>
            item.product &&
            item.product.seller_id &&
            item.product.seller_id.toString() === seller._id.toString()
        )
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      createdAt: order.createdAt,
    }));

    return res.status(200).json({
      message: "Seller statistics retrieved successfully",
      stats: {
        totalOrders: validOrders.length,
        totalRevenue: totalRevenue,
        ordersByStatus: ordersByStatus,
        recentOrders: recentOrders,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getRateableProducts = async (req, res) => {
  try {
    const { id_number } = req.user;

    // Find user
    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find delivered orders for this user where products haven't been rated
    const orders = await DB.order
      .find({
        user: user._id,
        status: "Delivered",
        deleted_at: null,
        "products.isRate": { $ne: true },
      })
      .populate({
        path: "products.product",
        select: "name image price description",
      })
      .select("orderId products createdAt");

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        message: "No products available to rate",
        rateableProducts: [],
      });
    }

    // Extract products that haven't been rated
    const rateableProducts = [];
    orders.forEach((order) => {
      order.products.forEach((item) => {
        if (!item.isRate && item.product) {
          rateableProducts.push({
            orderId: order.orderId,
            productId: item.product._id,
            productName: item.product.name,
            productImage: item.product.image,
            productPrice: item.product.price,
            quantity: item.quantity,
            orderDate: order.createdAt,
          });
        }
      });
    });

    return res.status(200).json({
      message: "Rateable products retrieved successfully",
      rateableProducts: rateableProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id_number } = req.user;
    const { orderId } = req.query;

    console.log();

    // Find user
    const user = await DB.user.findOne({ id_number });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // First check if order exists and belongs to user
    const existingOrder = await DB.order.findOne({
      orderId: orderId,
      user: user._id,
      deleted_at: null,
    });

    // Check if order exists
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order status is "Processing"
    if (existingOrder.status !== "Processing") {
      return res.status(400).json({
        message: `Cannot cancel order. Order status is ${existingOrder.status}. Only orders with status "Processing" can be cancelled.`,
      });
    }

    // Update status to "Cancelled"
    existingOrder.status = "Cancelled";
    await existingOrder.save();

    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
