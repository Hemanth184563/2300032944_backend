const { getDepotsWithTasks } = require("../repository/schedulerRepository");
const { solveKnapsack } = require("../utils/knapsack");
const { Log } = require("../../../logging_middleware/logger");

async function scheduleMaintenance() {
  await Log("backend", "info", "service", "External API called");
  
  const depotsWithTasks = await getDepotsWithTasks();

  const schedules = depotsWithTasks.map(depot => {
    const solution = solveKnapsack(depot.tasks, depot.mechanicHours);
    return {
      depotId: depot.depotId,
      totalImpact: solution.totalImpact,
      selectedTasks: solution.selectedTasks
    };
  });

  await Log("backend", "info", "service", "Data processed");
  await Log("backend", "info", "service", "Data returned");

  return schedules;
}

module.exports = {
  scheduleMaintenance
};
