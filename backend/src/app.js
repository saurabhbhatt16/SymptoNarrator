const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./utils/logger");
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

app.use(cors());
app.use(express.json({ limit: jsonBodyLimit }));
app.use(
  morgan(":method :url :status - :response-time ms", {
    skip: (req) => req.path === "/health",
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "backend" });
});

app.use(errorMiddleware);

module.exports = app;
