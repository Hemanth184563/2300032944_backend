const { Log } = require("../../../logging_middleware/logger");

async function requestLogger(req, res, next) {
  const url = req.originalUrl;
  if (url.startsWith("/api/mock/") || url.startsWith("/api/logs") || url === "/health") {
    return next();
  }

  await Log("backend", "info", "route", `Route hit: ${req.method} ${url}`);

  res.on("finish", async () => {
    await Log("backend", "info", "route", `Response sent: ${res.statusCode} ${req.method} ${url}`);
  });

  next();
}

module.exports = { requestLogger };
