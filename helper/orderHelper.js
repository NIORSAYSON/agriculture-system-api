const DB = require("../models");

exports.generateOrderId = async () => {
  let orderId;
  let exists = true;
  while (exists) {
    orderId = Math.floor(10000000 + Math.random() * 90000000).toString();
    exists = await DB.order.findOne({ orderId });
  }
  return orderId;
};
