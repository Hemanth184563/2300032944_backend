function solveKnapsack(tasks, mechanicHours) {
  const n = tasks.length;
  const W = Math.max(0, Math.floor(mechanicHours));
  
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const task = tasks[i - 1];
    const duration = Math.max(0, Math.floor(task.Duration));
    const impact = Math.max(0, Math.floor(task.Impact));

    for (let w = 0; w <= W; w++) {
      if (duration <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - duration] + impact);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const selectedTasks = [];
  let w = W;
  for (let i = n; i > 0; i--) {
    const task = tasks[i - 1];
    const duration = Math.max(0, Math.floor(task.Duration));

    if (dp[i][w] !== dp[i - 1][w]) {
      selectedTasks.push(task);
      w -= duration;
    }
  }

  selectedTasks.reverse();

  return {
    totalImpact: dp[n][W],
    selectedTasks
  };
}

module.exports = { solveKnapsack };
