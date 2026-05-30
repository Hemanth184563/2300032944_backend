const express = require("express");
const { runScheduler } = require("../controller/schedulerController");
const { Log } = require("../../../logging_middleware/logger");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server Running"
  });
});

router.get("/api/scheduler/run", runScheduler);

router.get("/api/logs/test", async (req, res, next) => {
  try {
    const validLogId = await Log("backend", "info", "service", "Test valid service logging message");
    
    const invalidLogId = await Log("invalid-stack", "info", "service", "This should fail validation");

    res.status(200).json({
      success: true,
      message: "Logging test run completed",
      validLogId,
      invalidLogId
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
