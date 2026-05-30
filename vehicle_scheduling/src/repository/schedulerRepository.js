const axios = require("axios");
const { Log } = require("../../../logging_middleware/logger");
const { DEPOT_API_URL, VEHICLES_API_URL, ACCESS_TOKEN } = require("../config/env");

const MOCK_DEPOTS = [
  { ID: 1, MechanicHours: 60 },
  { ID: 2, MechanicHours: 40 },
  { ID: 3, MechanicHours: 15 }
];

const MOCK_VEHICLES = [
  {
    ID: "V101",
    DepotID: 1,
    Tasks: [
      { TaskID: "T1", Duration: 10, "Impact": 30 },
      { TaskID: "T2", Duration: 20, "Impact": 50 },
      { TaskID: "T3", Duration: 30, "Impact": 90 }
    ]
  },
  {
    ID: "V102",
    DepotID: 1,
    Tasks: [
      { TaskID: "T4", Duration: 15, "Impact": 40 },
      { TaskID: "T5", Duration: 25, "Impact": 70 }
    ]
  },
  {
    ID: "V201",
    DepotID: 2,
    Tasks: [
      { TaskID: "T6", Duration: 12, "Impact": 35 },
      { TaskID: "T7", Duration: 18, "Impact": 60 },
      { TaskID: "T8", Duration: 22, "Impact": 80 }
    ]
  },
  {
    ID: "V301",
    DepotID: 3,
    Tasks: [
      { TaskID: "T9", Duration: 8, "Impact": 25 },
      { TaskID: "T10", Duration: 10, "Impact": 40 }
    ]
  }
];

async function fetchDepots() {
  try {
    let depots = MOCK_DEPOTS;
    if (DEPOT_API_URL && !DEPOT_API_URL.includes("localhost:3000")) {
      const headers = {};
      if (ACCESS_TOKEN) {
        headers["Authorization"] = `Bearer ${ACCESS_TOKEN}`;
      }
      const response = await axios.get(DEPOT_API_URL, { headers });
      depots = response.data.depots || response.data;
    }
    await Log("backend", "info", "repository", "Data fetched");
    return depots;
  } catch (error) {
    console.error("fetchDepots error:", error.message);
    await Log("backend", "warn", "repository", "Data fetched fallback applied");
    return MOCK_DEPOTS;
  }
}

async function fetchVehicles() {
  try {
    let vehicles = MOCK_VEHICLES;
    if (VEHICLES_API_URL && !VEHICLES_API_URL.includes("localhost:3000")) {
      const headers = {};
      if (ACCESS_TOKEN) {
        headers["Authorization"] = `Bearer ${ACCESS_TOKEN}`;
      }
      const response = await axios.get(VEHICLES_API_URL, { headers });
      vehicles = response.data.vehicles || response.data;
    }
    await Log("backend", "info", "repository", "Data fetched");
    return vehicles;
  } catch (error) {
    console.error("fetchVehicles error:", error.message);
    await Log("backend", "warn", "repository", "Data fetched fallback applied");
    return MOCK_VEHICLES;
  }
}

async function getDepotsWithTasks() {
  const depots = await fetchDepots();
  const vehicles = await fetchVehicles();

  const mapped = depots.map(depot => {
    const depotVehicles = vehicles.filter(v => v.DepotID === depot.ID);
    const tasks = depotVehicles.reduce((acc, vehicle) => {
      return acc.concat(vehicle.Tasks || []);
    }, []);
    return {
      depotId: depot.ID,
      mechanicHours: depot.MechanicHours,
      tasks
    };
  });

  await Log("backend", "info", "repository", "Data transformed");
  return mapped;
}

module.exports = {
  getDepotsWithTasks
};
