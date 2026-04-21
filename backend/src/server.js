require("dotenv").config({ quiet: true });
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const app = require("./app");
const initializeChatSocket = require("../sockets/chatSocket");
const prisma = require("../config/prisma");
const logger = require("./utils/logger");

const PORT = Number(process.env.PORT) || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_SERVICE_REQUIRED =
  String(process.env.AI_SERVICE_REQUIRED || "false").toLowerCase() === "true";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

initializeChatSocket(io);

async function bootstrap() {
  const baseUrl = AI_SERVICE_URL.replace(/\/+$/, "");

  try {
    await prisma.$connect();
    logger.info("Database connected");
  } catch (error) {
    logger.error(`Database connection failed: ${error?.message || error}`);
    process.exit(1);
  }

  try {
    const response = await axios.get(`${baseUrl}/health`, { timeout: 3000 });
    const status = response?.data?.status || "unknown";
    logger.info(`AI service connected (${status})`);
  } catch (error) {
    const reason = error?.response?.status
      ? `HTTP ${error.response.status}`
      : error?.code || error?.message || "unknown error";
    const warning = `AI service unavailable (${reason})`;

    if (AI_SERVICE_REQUIRED) {
      logger.error(
        `${warning}. Set AI_SERVICE_REQUIRED=false to allow backend startup without AI.`,
      );
      process.exit(1);
    }

    logger.error(warning);
  }

  server.listen(PORT, () => {
    logger.info(`Backend running on http://localhost:${PORT}`);
  });
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    logger.error(
      `Port ${PORT} is already in use. Stop the running process on that port or run \"npm start\" which frees port 5000 automatically.`,
    );
    process.exit(1);
  }

  if (error.code === "EACCES") {
    logger.error(`Permission denied while trying to bind to port ${PORT}.`);
    process.exit(1);
  }

  logger.error("Server failed to start:", error);
  process.exit(1);
});

bootstrap();
