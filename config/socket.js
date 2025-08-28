// config/socket.js
const { Server } = require("socket.io");

function initWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  global.io = io; // Make io accessible globally

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a specific room (e.g. "seller:123")
    socket.on("join", ({ type, id }) => {
      const room = `${type}:${id}`;
      socket.join(room);
      console.log(`${type} ${id} joined room: ${room}`);
    });

    // Handle disconnects
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { initWebSocket };
