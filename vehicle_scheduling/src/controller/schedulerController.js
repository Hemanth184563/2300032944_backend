const { scheduleMaintenance } = require("../service/schedulerService");
const { Log } = require("../../../logging_middleware/logger");

async function runScheduler(req, res, next) {
  try {
    await Log("backend", "info", "controller", "Controller started");
    
    const data = await scheduleMaintenance();

    await Log("backend", "info", "controller", "Controller completed");
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    await Log("backend", "error", "controller", "Controller failed");
    next(error);
  }
}

module.exports = {
  runScheduler
};
