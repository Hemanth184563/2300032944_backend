# Comprehensive Notification Platform System Design

This document details the complete end-to-end system architecture, database modeling, optimization strategies, reliability patterns, and algorithms for our enterprise-grade Notification Service, structured across all six evaluation stages.



## Stage 1: REST API Design & Contracts

To display notifications reliably to logged-in users, the notification platform must support core RESTful actions with strict JSON contracts, standard headers, and a robust real-time delivery mechanism.

### 1. Core Platform Actions
* **Fetch Inbox (Paginated):** Retrieve a chronological feed of notifications for a student.
* **Mark Read:** Acknowledge single or multiple notifications.
* **Unread Count:** Retrieve a fast summary count of unread items for badge display.
* **Publish Notification (Service-to-Service):** Allow internal components (e.g., placement tracker, exam coordinator) to trigger new notifications.



### 2. API Endpoints & Request/Response Contracts

#### A. Fetch Paginated Notifications
* **Method & Path:** `GET /api/v1/notifications`
* **Request Headers:**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  Accept: application/json
  ```
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10, max: 100)
  * `status` (string: `unread`, `read`, `all`, default: `all`)
* **Response (Status 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "notifications": [
        {
          "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
          "type": "Placement",
          "message": "CSX Corporation is currently hiring Software Engineers.",
          "isRead": false,
          "timestamp": "2026-05-30T07:15:30Z"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 15,
        "totalItems": 142,
        "limit": 10,
        "hasNext": true
      }
    }
  }
  ```


#### C. Fetch Unread Count
* **Method & Path:** `GET /api/v1/notifications/unread-count`
* **Request Headers:**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```
* **Response (Status 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "unreadCount": 12
    }
  }
  ```

---

### 3. Real-Time Push Mechanism (Server-Sent Events)
For live delivery, we utilize **Server-Sent Events (SSE)** rather than WebSockets.
* **Why SSE?** Notifications are strictly one-way (server-to-client). SSE runs natively over standard HTTP, supports automatic reconnection out-of-the-box, bypasses restrictive corporate firewalls, and consumes significantly less battery/memory on mobile browsers compared to bi-directional WebSockets.

#### SSE Connection Lifecycle:
1. **Handshake:** The client initiates a persistent HTTP connection.
   * **Request:** `GET /api/v1/notifications/stream`
   * **Headers:**
     ```http
     Authorization: Bearer <JWT_ACCESS_TOKEN>
     Accept: text/event-stream
     Cache-Control: no-cache
     Connection: keep-alive
     ```
2. **Server Response:** Confirms stream initialization.
   * **Headers:**
     ```http
     HTTP/1.1 200 OK
     Content-Type: text/event-stream
     Cache-Control: no-cache
     Connection: keep-alive
     ```
3. **Payload Stream Format:** Server pushes raw data formatted as standard Event-Streams:
   ```http
   event: notification
   data: {"id":"d146095a-0d86-4a34-9e69-3900a14576bc","type":"Placement","message":"Google Software Engineer Interview Invite","timestamp":"2026-05-30T07:20:00Z"}

   event: ping
   data: {"timestamp":"2026-05-30T07:20:30Z"}
   ```

---

## Stage 2: Database Storage Design

### 1. Storage Choice: PostgreSQL (Relational)
To support 50,000+ students and multiple millions of notifications, we recommend **PostgreSQL**.
* **ACID Transactions:** Crucial for tracking state transitions (e.g. marking notifications read).
* **Advanced Query Indexing:** PostgreSQL features powerful partial and composite B-Tree indexing capabilities.
* **JSONB Support:** Offers flexibility to store structured, polymorphic event metadata (like job descriptions, event links) while retaining indexable SQL column integrity.

---


### 3. Production Scaling Issues & Mitigation Strategy

As data grows past 5,000,000 rows, three major performance bottlenecks will occur:
1. **Index Bloat & RAM Exhaustion:** The B-Tree index becomes too large to fit in Postgres's memory cache (`shared_buffers`), leading to random disk lookups.
   * *Solution:* Implement **Database Table Partitioning** (e.g., partition by range on the `created_at` column monthly). Keep only active monthly partitions in active memory, and archive partitions older than 90 days.
2. **Vacuuming Overheads:** Frequent writes and updates to the `is_read` column cause "dead tuples" in Postgres, leading to disk fragmentation during autovacuuming.
   * *Solution:* Fine-tune autovacuum parameters for high-write partitions, or use a dedicated write outbox queue table to decouple frequent read/write operations.

---

### 4. Highly Optimized Core Queries


## Stage 3: Query Optimization (The Slow Query)

### 1. The Slow Query Problem
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```
In a table with **5,000,000 rows** and **50,000 students**, this query becomes extremely slow. Without a composite index, the database engine must execute a **Sequential Table Scan**, fetching and reading every single data block from the disk to find matches, leading to a query execution time of several seconds.

---

### 2. Ineffectiveness of Indexing "Every Column"
Adding standalone indexes on every column (e.g., an index on `studentID`, an index on `isRead`, and an index on `createdAt`) is highly ineffective:
* **Low Cardinality Filter:** `isRead` only has 2 possible values (`true`/`false`). A standalone index on a boolean column is completely ignored by the query optimizer because scanning the index and then looking up from the table heap is more expensive than scanning the table directly.
* **Single Index Limitation:** Standard databases can usually only use *one* B-Tree index per table scan. Having independent indexes means the database can't easily optimize the composite filter `WHERE studentID = 1042 AND isRead = false`.
* **Massive Write Degradation:** Writing to a table with multiple unused indexes dramatically slows down inserts.

---

### 3. Solution 1: Composite B-Tree Index
To make this query execute in sub-milliseconds, we can create a **Composite B-Tree Index**:
```sql
CREATE INDEX idx_student_unread_created 
ON notifications (studentID, isRead, createdAt DESC);
```
* **Why it works:** The database can perform a single logarithmic $O(\log N)$ search to locate `studentID = 1042`, immediately jump to the subset where `isRead = false`, and since B-Tree index leaf nodes are already ordered by `createdAt DESC` natively, the database returns the results instantly with **zero in-memory sorting**.

---

### 4. Solution 2: Partial Index (Recommended for Production)
Since a notification platform is read-heavy, and unread items form only a fraction of the total dataset, we can use a **Partial Index**:
```sql
CREATE INDEX idx_partial_student_unread 
ON notifications (studentID, createdAt DESC)
WHERE isRead = false;
```
* **Why this is superior:** This index is significantly smaller in storage size because it completely ignores all read notifications. The index table size remains extremely compact (fitting easily in CPU cache / RAM), ensuring maximum write speeds while making unread lookups near-instantaneous.

---

## Stage 4: High-Frequency Read Scaling & Trade-offs

When notifications are fetched on every single page load for every student, the database will experience connection exhaustion. Here are standard architectural strategies to mitigate this:

### 1. Caching Inbox with Redis (Read-Through Caching)
* **Strategy:** Store the serialized active unread notification array of each student inside a Redis cache (Key: `inbox:unread:{student_id}`) with a Time-To-Live (TTL) of 5 minutes.
* **Trade-offs:**
  * *Pros:* Offloads $95\%+$ of database queries, bringing latency down to `<1ms`.
  * *Cons:* Requires complex cache-invalidation code (must invalidate or append to the cache whenever a new notification is published).

### 2. Persistent Push Streaming (SSE / HTTP Connection Pooling)
* **Strategy:** Push events to clients in real-time. When a notification is generated, push it directly to the active SSE channel instead of having clients poll.
* **Trade-offs:**
  * *Pros:* Reduces redundant fetch requests to exactly zero when the user is active.
  * *Cons:* Servers must manage persistent TCP connections, which requires tuning the maximum open files limits (`ulimit -n`) and configuring reverse proxies (like Nginx) to support streaming.

### 3. Read Replicas (Read/Write Separation)
* **Strategy:** Deploy secondary database instances that duplicate data asynchronously. Direct all `GET` notifications calls to the read-replicas, keeping the primary database free for writes.
* **Trade-offs:**
  * *Pros:* Scales read throughput linearly with replicas.
  * *Cons:* Slight replication lag can cause eventual consistency issues (a student might mark an item read, refresh, and still see it unread for a fraction of a second).

---

## Stage 5: Reliability & Throughput Redesign ("Notify All")

### 1. Shortcomings of Synchronous Loops
The junior's synchronous loop has major issues:
* **Blocking & Latency:** Resolving 50,000 network/DB operations sequentially takes hours. If each operation takes $100\text{ms}$, the loop blocks for **1.4 hours**, leading to connection timeouts and thread blocking.
* **No Retries/State Tracking:** If the process fails at student 20,000, there is no way to resume without double-notifying or skipping users.
* **Resource Contention:** Spiking the database with 50,000 fast queries exhausts the connection pool.

---

### 2. REDESIGNED ARCHITECTURE: Message Queue & Transactional Outbox
1. **Immediate Response:** When HR triggers `/notify-all`, the app immediately creates a tracking record, writes tasks to a database outbox table, publishes a job to a **Message Queue** (e.g., BullMQ/Redis or RabbitMQ), and responds to HR immediately (`202 Accepted`).
2. **Transactional Outbox:** Saving to the database and sending emails are separated. The main thread only writes to the DB in a single ACID batch transaction. Active background workers then process the outbox tasks asynchronously in parallel chunks.
3. **Fault Tolerance:** If a worker crashes, the queue manager automatically retries the task using **Exponential Backoff and Jitter**.

---

### 3. Asynchronous Reliable Pseudocode

## Stage 6: Bounded Heap-Based Priority Inbox Algorithm

### 1. Approach & Formula
To support a high-throughput stream where new notifications constantly arrive, and always maintain the **top $n$ most important unread notifications**, we use a **Bounded Min-Heap** of size $n$.

**Priority Evaluation Formula:**
* **Weight:** `Placement` (weight score: 3,000,000) > `Result` (weight score: 2,000,000) > `Event` (weight score: 1,000,000).
* **Recency:** Unix epoch timestamp in seconds.
* **Total Priority Score:** `Score = weightScore + unixTimestampSeconds`.
  * *Why?* This ensures that `Placement` notifications always outrank `Result` notifications, and newer notifications within each category are sorted correctly.

---

### 2. Heap Optimization Mechanics
Sorting an active stream of size $N$ repeatedly takes $O(N \log N)$ time and $O(N)$ space.
By using a **Bounded Min-Heap** of size $n$:
1. We stream through the notifications.
2. For each notification:
   * If heap size is $< n$, insert it in $O(\log n)$ time.
   * If heap size is $= n$, compare the item's score against the root (`heap[0]`, which is the absolute lowest priority element in the current top $n$).
   * If the new item's score is greater than `heap[0]`, remove `heap[0]` and insert the new item in $O(\log n)$ time.
   * Otherwise, discard the item.
3. **Final Result:** Returns the top $n$ items sorted from highest to lowest in $O(N \log n)$ time and $O(n)$ space complexity.
