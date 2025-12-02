import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

// JWT authentication middleware - validates tokens and attaches user info to request
export const validateToken = (req, res, next) => {
  try {
    let token = null;

    // Log headers for debugging
    logger.debug(`Auth middleware - Headers: ${JSON.stringify(req.headers)}`);
    logger.debug(
      `Auth middleware - Path: ${req.path}, OriginalUrl: ${req.originalUrl}`
    );

    // Check for token in Authorization header
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      req.get("Authorization");
    logger.debug(`Auth middleware - Authorization header: ${authHeader}`);

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      logger.debug(
        `Auth middleware - Token extracted from header: ${token.substring(
          0,
          20
        )}...`
      );
    }

    // Check for token in cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
      logger.debug(`Auth middleware - Token extracted from cookie`);
    }

    // If no token found, return unauthorized
    if (!token) {
      logger.warn(
        `Authentication failed: No token provided for ${req.method} ${req.path}`
      );
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication token is required",
      });
    }

    // Verify token
    const jwtSecret =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);

    // Attach user information to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || "user",
      ...decoded,
    };

    logger.debug(`User authenticated: ${req.user.email} (${req.user.id})`);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logger.warn(`Token expired for ${req.method} ${req.path}`);
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      logger.warn(
        `Invalid token for ${req.method} ${req.path}: ${error.message}`
      );
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    logger.error(`Authentication error: ${error.message}`, { error });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
    });
  }
};

// Optional authentication - validates token if present, continues without auth if not
export const optionalAuth = (req, res, next) => {
  try {
    let token = null;

    // Check for token in Authorization header (case-insensitive)
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      req.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Check for token in cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, continue without user info
    if (!token) {
      return next();
    }

    // Verify token
    const jwtSecret =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);

    // Attach user information to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || "user",
      ...decoded,
    };

    logger.debug(`Optional auth: User authenticated: ${req.user.email}`);
    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    logger.debug(
      `Optional auth: Invalid or expired token, continuing without auth`
    );
    next();
  }
};
