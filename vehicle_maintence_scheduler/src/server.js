const app = require("./app");
const { PORT } = require("./config/env");

app.listen(PORT, () => {
  console.log(`Vehicle Maintenance Scheduler running on port ${PORT}`);
});
