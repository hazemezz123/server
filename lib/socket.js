import { Server } from "socket.io";

let io;

const userSocketMap = {}; // {userId: socketId}

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://chat-application-khaki-phi.vercel.app",
      ],
      credentials: true,
    },
    // Add transports for better compatibility with serverless environments like Vercel
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("A user is connected:", socket.id);
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
      userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      // On disconnect, find which user it was and remove them
      let disconnectedUserId;
      for (const [uid, sid] of Object.entries(userSocketMap)) {
        if (sid === socket.id) {
          disconnectedUserId = uid;
          break;
        }
      }
      if (disconnectedUserId) {
        delete userSocketMap[disconnectedUserId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};
