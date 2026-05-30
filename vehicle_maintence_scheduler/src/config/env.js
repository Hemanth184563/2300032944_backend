const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  PORT: process.env.PORT || 3000,
  DEPOT_API_URL: process.env.DEPOT_API_URL,
  VEHICLES_API_URL: process.env.VEHICLES_API_URL,
  LOGGING_API_URL: process.env.LOGGING_API_URL,
  ACCESS_TOKEN: process.env.ACCESS_TOKEN
};
