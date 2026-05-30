# Backend Track Project Submission - ID 2300032944

This repository contains the comprehensive, production-grade backend solutions for the track evaluation. All services are implemented in Node.js, prioritizing strict architectural separation, computational optimization, and complete decoupling for reliability.

---

## 📂 Project Directory Structure

```text
├── logging_middleware/               # Stage 1 Validation Middleware
│   ├── src/
│   │   ├── middleware/               # Log validation logic
│   │   └── server.js                 # Express log controller
│   └── package.json
│
├── vehicle_scheduling/               # Stage 6 Resource Allocation (Standard)
│   ├── src/
│   │   ├── repository/               # API Data Fetching with Bearer headers
│   │   ├── utils/                    # Sequential Knapsack DP Solver
│   │   └── server.js
│   └── package.json
│
├── vehicle_maintence_scheduler/      # Stage 6 Resource Allocation (Duplicate variant)
│   ├── src/
│   │   ├── repository/               # Identical robust knapsack mapping
│   │   └── server.js
│   └── package.json
│
├── notification_app_be/              # Stage 6 Priority Inbox stream processor
│   ├── priorityQueue.js              # Custom Bounded Min-Heap
│   ├── runner.js                     # Priority fetch controller
│   └── package.json
│
├── notification_system_design.md    # Master Architecture Document (Stages 1-6)
└── .gitignore                        # Global exclusions file
```

---

## 🛠️ Core Services Breakdown

### 1. Logging Middleware (`logging_middleware/`)
Exposes `POST /api/logs` to validate and persist payload requests strictly separating scopes:
* **Backend-only scopes:** `handler`, `repository`, `route`, `service`
* **Frontend-only scopes:** `api`, `component`, `hook`, `page`, `state`, `style`
* **Shared scopes:** `auth`, `config`, `middleware`, `utils`
Generates a unique logging trace ID for successful transactions, rejecting scope violations with `400 Bad Request`.

### 2. Vehicle Scheduling (`vehicle_scheduling/` & `vehicle_maintence_scheduler/`)
Fetches available depot capacities (`MechanicHours`) and vehicle maintenance requirements dynamically from the protected evaluation service. It runs a custom sequential **0/1 Knapsack optimization algorithm using Dynamic Programming** to maximize total scheduling impact within depot resource limits.

### 3. Notification App Backend (`notification_app_be/`)
Implements the **Priority Inbox** (Stage 6) using a custom bounded **Min-Heap** of size $n$ to process dynamic notification feeds:
* **Priority Formula:** `Score = Weight (Placement > Result > Event) + Recency (Unix Timestamp)`
* Streams and keeps the top $n$ items with optimal $O(N \log n)$ time and $O(n)$ memory footprint.

### 4. System Architecture Document (`notification_system_design.md`)
A complete, master-level engineering documentation answering:
* **Stage 1 & 2:** REST schemas, Server-Sent Events real-time design, SQL DDL schema modeling, and scale partitioning strategies.
* **Stage 3:** Advanced database query optimization, B-Tree vs Partial Indexing on composite conditions, and standalone index critique.
* **Stage 4:** Caching, connection state management, and replica distribution tradeoffs.
* **Stage 5:** Async system decoupling, message queues, and Transactional Outbox pattern design with TypeScript pseudocode.
* **Stage 6:** Priority inbox heap heapify mechanics.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* Standard package dependencies are local.

### Configuration
1. Open the `.env` file inside the service directories:
   * `vehicle_scheduling/.env`
   * `notification_app_be/.env`
2. Insert your active authorization JWT access token:
   ```ini
   ACCESS_TOKEN=eyJhbGciOiJIUzI1...
   ```

### Execution (Example: Vehicle Scheduling)
To start the scheduling optimization service on port `3001`:
```bash
cd vehicle_scheduling
npm install
npm start
```
Use **Postman** to execute:
```http
GET http://localhost:3001/api/scheduler/run
```
*(The server will automatically fetch data from the protected host using your token and return the optimized schedules).*

---

## 🔒 Anonymity Compliance
This repository is configured to comply strictly with the evaluation anonymity guidelines. No candidate names, email addresses, or personal references are included in any documentation, commit histories, or code directories.
