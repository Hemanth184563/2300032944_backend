const ALLOWED_STACKS = ["backend", "frontend"];

const ALLOWED_LEVELS = ["debug", "info", "warn", "error", "fatal"];

const ALLOWED_PACKAGES = [
  "cache",
  "controller",
  "cron_job",
  "db",
  "handler",
  "repository",
  "route",
  "service"
];

module.exports = {
  ALLOWED_STACKS,
  ALLOWED_LEVELS,
  ALLOWED_PACKAGES
};
