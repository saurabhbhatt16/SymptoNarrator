require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const app = require("./app");
const initializeChatSocket = require("../sockets/chatSocket");

const PORT = Number(process.env.PORT) || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_SERVICE_REQUIRED = String(process.env.AI_SERVICE_REQUIRED || "false").toLowerCase() === "true";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

initializeChatSocket(io);

async function checkAiServiceOnStartup() {
  const baseUrl = AI_SERVICE_URL.replace(/\/+$/, "");
  const healthUrl = `${baseUrl}/health`;

  try {
    const response = await axios.get(healthUrl, { timeout: 3000 });
    const status = response?.data?.status || "unknown";
    console.log(`AI service check: reachable at ${baseUrl} (status: ${status})`);
    return;
  } catch (error) {
    const reason = error?.response?.status
      ? `HTTP ${error.response.status}`
      : error?.code || error?.message || "unknown error";

    const warning = `AI service check: not reachable at ${baseUrl} (${reason}). AI report generation may fail until service is running.`;

    if (AI_SERVICE_REQUIRED) {
      console.error(`${warning} Set AI_SERVICE_REQUIRED=false to allow backend startup without AI.`);
      process.exit(1);
    }

    console.warn(warning);
  }
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the running process on that port or run \"npm start\" which frees port 5000 automatically.`
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

server.listen(PORT, () => {
  // Startup log to verify service is bound to expected port.
  console.log(`Backend running on http://localhost:${PORT}`);
  checkAiServiceOnStartup();
});
