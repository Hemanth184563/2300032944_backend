const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const schedulerRoutes = require("./route/schedulerRoutes");
const { requestLogger } = require("./middleware/requestLogger");
const { errorHandler } = require("./handler/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(requestLogger);

app.post(["/api/mock/logs", "/api/logs"], (req, res) => {
  const { stack, level, package: packageName, message } = req.body;
  const logID = "MOCK-LOG-" + Math.random().toString(36).substring(2, 9).toUpperCase();
  res.status(201).json({
    success: true,
    logID,
    received: { stack, level, packageName, message }
  });
});

app.get("/api/mock/depots", (req, res) => {
  res.status(200).json([
    { ID: 1, MechanicHours: 60 },
    { ID: 2, MechanicHours: 40 },
    { ID: 3, MechanicHours: 15 }
  ]);
});

app.get("/api/mock/vehicles", (req, res) => {
  res.status(200).json([
    {
      ID: "V101",
      DepotID: 1,
      Tasks: [
        { TaskID: "T1", Duration: 10, Impact: 30 },
        { TaskID: "T2", Duration: 20, Impact: 50 },
        { TaskID: "T3", Duration: 30, Impact: 90 }
      ]
    },
    {
      ID: "V102",
      DepotID: 1,
      Tasks: [
        { TaskID: "T4", Duration: 15, Impact: 40 },
        { TaskID: "T5", Duration: 25, Impact: 70 }
      ]
    }
  ]);
});

app.use("/", schedulerRoutes);

app.use(errorHandler);

module.exports = app;
