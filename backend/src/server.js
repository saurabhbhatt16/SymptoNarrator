require("dotenv").config({ quiet: true });
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const app = require("./app");
const initializeChatSocket = require("../sockets/chatSocket");
const prisma = require("../config/prisma");

const PORT = Number(process.env.PORT) || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_SERVICE_REQUIRED =
  String(process.env.AI_SERVICE_REQUIRED || "false").toLowerCase() === "true";
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: frontendOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initializeChatSocket(io);

async function bootstrap() {
  const baseUrl = AI_SERVICE_URL.replace(/\/+$/, "");

  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (error) {
    console.error(`Database connection failed: ${error?.message || error}`);
    process.exit(1);
  }

  try {
    const response = await axios.get(`${baseUrl}/health`, { timeout: 3000 });
    const status = response?.data?.status || "unknown";
    console.log(`AI service connected (${status})`);
  } catch (error) {
    const reason = error?.response?.status
      ? `HTTP ${error.response.status}`
      : error?.code || error?.message || "unknown error";
    const warning = `AI service unavailable (${reason})`;

    if (AI_SERVICE_REQUIRED) {
      console.error(
        `${warning}. Set AI_SERVICE_REQUIRED=false to allow backend startup without AI.`,
      );
      process.exit(1);
    }

    console.warn(warning);
  }

  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the running process on that port or run \"npm start\" which frees port 5000 automatically.`,
    );
    process.exit(1);
  }

  if (error.code === "EACCES") {
    console.error(`Permission denied while trying to bind to port ${PORT}.`);
    process.exit(1);
  }

  console.error("Server failed to start:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

bootstrap();
