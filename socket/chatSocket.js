const Message = require("../models/Message");

function chatSocket(io) {
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`📌 User ${userId} joined their room`);
    });

    socket.on("send_message", async (data) => {
      const { senderId, receiverId, content } = data;
      const message = new Message({ senderId, receiverId, content });
      await message.save();

      // Send message to receiver & sender
      io.to(receiverId).emit("receive_message", message);
      io.to(senderId).emit("receive_message", message);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
}

module.exports = chatSocket;
