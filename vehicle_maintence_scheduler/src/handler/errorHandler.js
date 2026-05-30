const { Log } = require("../../../logging_middleware/logger");

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
  }
}

async function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Something went wrong" : err.message;

  await Log("backend", "error", "handler", err.stack || err.message);

  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = {
  ApiError,
  errorHandler
};
