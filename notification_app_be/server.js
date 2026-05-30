const express = require("express");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { MinHeap } = require("./priorityQueue");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

const MOCK_NOTIFICATIONS = [
  {
    ID: "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
    Type: "Placement",
    Message: "CSX Corporation hiring",
    Timestamp: "2026-04-22 17:51:18"
  },
  {
    ID: "81589ada-0ad3-4f77-9554-f52fb558e09d",
    Type: "Event",
    Message: "farewell",
    Timestamp: "2026-04-22 17:51:06"
  },
  {
    ID: "0005513a-142b-4bbc-8678-eefec65e1ede",
    Type: "Result",
    Message: "mid-sem",
    Timestamp: "2026-04-22 17:50:54"
  },
  {
    ID: "ea836726-c25e-4f21-a72f-544a6af8a37f",
    Type: "Result",
    Message: "project-review",
    Timestamp: "2026-04-22 17:50:42"
  },
  {
    ID: "003cb427-8fc6-47f7-bb00-be228f6b0d2c",
    Type: "Result",
    Message: "external",
    Timestamp: "2026-04-22 17:50:30"
  },
  {
    ID: "e5c4ff20-31bf-4d40-8f02-72fda59e8918",
    Type: "Result",
    Message: "project-review",
    Timestamp: "2026-04-22 17:50:18"
  },
  {
    ID: "1cfce5ee-ad37-4894-8946-d707627176a5",
    Type: "Event",
    Message: "tech-fest",
    Timestamp: "2026-04-22 17:50:06"
  },
  {
    ID: "d146095a-0d86-4a34-9e69-3900a14576bc",
    Type: "Result",
    Message: "mid-sem-v2",
    Timestamp: "2026-04-22 17:51:30"
  },
  {
    ID: "placement-999",
    Type: "Placement",
    Message: "Google Software Engineer Interview Invite",
    Timestamp: "2026-04-22 17:49:00"
  },
  {
    ID: "event-888",
    Type: "Event",
    Message: "Coding Contest Registrations Open",
    Timestamp: "2026-04-22 17:48:00"
  },
  {
    ID: "placement-777",
    Type: "Placement",
    Message: "Meta Hiring Session Details",
    Timestamp: "2026-04-22 17:45:00"
  }
];

function getPriorityScore(notification) {
  const weights = { Placement: 3000000, Result: 2000000, Event: 1000000 };
  const typeWeight = weights[notification.Type] || 0;
  const timeSeconds = Math.floor(new Date(notification.Timestamp).getTime() / 1000);
  return typeWeight + timeSeconds;
}

app.get("/api/notifications/priority", async (req, res) => {
  const url = process.env.NOTIFICATION_API_URL || "http://4.224.186.213/evaluation-service/notifications";
  const token = process.env.NOTIFICATION_API_TOKEN;

  let notifications = [];
  try {
    const headers = {};
    if (token && !token.includes("mock_bearer_token")) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await axios.get(url, { headers, timeout: 4000 });
    notifications = response.data.notifications || response.data;
  } catch (error) {
    console.log("Evaluation Service fetch failed. Using fallback mock notifications...");
    notifications = MOCK_NOTIFICATIONS;
  }

  // Parse limit parameter (n) defaulting to 10
  const n = parseInt(req.query.n || "10", 10);
  const heap = new MinHeap((a, b) => a.score - b.score);

  for (const item of notifications) {
    const score = getPriorityScore(item);
    const itemWithScore = { ...item, score };

    if (heap.size() < n) {
      heap.push(itemWithScore);
    } else if (score > heap.peek().score) {
      heap.pop();
      heap.push(itemWithScore);
    }
  }

  const priorityInbox = [];
  while (heap.size() > 0) {
    priorityInbox.push(heap.pop());
  }
  priorityInbox.reverse();

  return res.status(200).json({
    success: true,
    totalFetched: notifications.length,
    limit: n,
    priorityInbox
  });
});

app.listen(PORT, () => {
  console.log(`Notification App Server listening on port ${PORT}`);
});
