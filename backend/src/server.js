require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const initializeChatSocket = require("../sockets/chatSocket");

const PORT = Number(process.env.PORT) || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

initializeChatSocket(io);

server.listen(PORT, () => {
  // Startup log to verify service is bound to expected port.
  console.log(`Backend running on http://localhost:${PORT}`);
});
