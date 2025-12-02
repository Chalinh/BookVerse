import logger from "../utils/logger.js";

// Centralized error handler - catches all errors and returns standardized responses
export const errorHandler = (err, req, res, next) => {
  // Log the error with stack trace
  logger.error(`Error handling ${req.method} ${req.path}: ${err.message}`, {
    error: err,
    stack: err.stack,
    requestId: req.id,
    user: req.user?.email || "anonymous",
  });

  // Default error status and message
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation Error";
  } else if (err.name === "UnauthorizedError") {
    status = 401;
    message = "Unauthorized";
  } else if (err.name === "ForbiddenError") {
    status = 403;
    message = "Forbidden";
  } else if (err.name === "NotFoundError") {
    status = 404;
    message = "Not Found";
  }

  // Don't expose internal error details in production
  const response = {
    error: message,
    requestId: req.id,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.details = err.details || err.message;
  }

  // Send error response
  res.status(status).json(response);
};

// 404 Not Found handler
export const notFoundHandler = (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.id,
  });
};
