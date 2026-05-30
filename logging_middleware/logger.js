const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { ALLOWED_STACKS, ALLOWED_LEVELS, ALLOWED_PACKAGES } = require("./constants");

async function Log(stack, level, packageName, message) {
  try {
    if (!ALLOWED_STACKS.includes(stack)) {
      throw new Error(`Invalid stack: ${stack}`);
    }
    if (!ALLOWED_LEVELS.includes(level)) {
      throw new Error(`Invalid level: ${level}`);
    }
    if (stack === "backend" && !ALLOWED_PACKAGES.includes(packageName)) {
      throw new Error(`Invalid backend package: ${packageName}`);
    }

    const token = process.env.ACCESS_TOKEN;
    const url = process.env.LOGGING_API_URL || "http://localhost:3000/api/logs";

    const response = await axios.post(
      url,
      {
        stack,
        level,
        package: packageName,
        message,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data.logID || "LOG-" + Math.random().toString(36).substring(2, 9).toUpperCase();
  } catch (error) {
    console.error("Logger execution failed:", error.message);
    return "FALLBACK-LOG-" + Math.random().toString(36).substring(2, 9).toUpperCase();
  }
}

module.exports = { Log };
