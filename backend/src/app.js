const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const authRoutes = require("../routes/auth.routes");
const patientRoutes = require("../routes/patient.routes");
const doctorRoutes = require("../routes/doctor.routes");
const adminRoutes = require("../routes/admin.routes");
const appointmentRoutes = require("../routes/appointment.routes");
const messageRoutes = require("../routes/message.routes");
const reportRoutes = require("../routes/report.routes");
const aiRoutes = require("../routes/ai.routes");
const errorMiddleware = require("../middlewares/error.middleware");

const app = express();
const jsonBodyLimit = process.env.JSON_BODY_LIMIT || "10mb";
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later." },
});

app.use(
  cors({
    origin: frontendOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);
app.use(express.json({ limit: jsonBodyLimit }));
app.use(morgan(":method :url :status :response-time ms"));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);

app.use(errorMiddleware);

module.exports = app;

if (require.main === module) {
  require("./server");
}
