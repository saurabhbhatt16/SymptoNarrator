const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const logger = require("../src/utils/logger");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const debugFlow = process.env.DEBUG_SYMPTOM_FLOW === "true";

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (debugFlow) {
      logger.debug("[SymptomFlow][Auth] Bearer token detected:", Boolean(token));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        doctorProfile: {
          select: {
            id: true,
            isVerified: true,
            verified: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = {
      ...user,
      id: user.id,
      userId: user.id,
      doctorId: user.role === "doctor" ? user.doctorProfile?.id : undefined,
      isVerified:
        user.role === "doctor"
          ? Boolean(
              user.isVerified ||
              user.doctorProfile?.isVerified ||
              user.doctorProfile?.verified,
            )
          : true,
      profileCompleted:
        user.role === "doctor" ? Boolean(user.doctorProfile?.id) : true,
    };

    if (debugFlow) {
      logger.debug("[SymptomFlow][Auth] req.user attached:", {
        id: req.user.id,
        role: req.user.role,
        userId: req.user.userId,
        doctorId: req.user.doctorId,
      });
    }

    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
