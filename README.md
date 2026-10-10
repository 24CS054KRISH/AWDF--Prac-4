# Web Development Practicals (SEM 5)

## 📌 Practical 4: Building a RESTful API with Node.js and Express
- Basic Express server setup on port `3000`.
- In-memory array task store.
- Custom logging middleware (`middleware/logger.js`).
- Modular route handlers using Express Router (`routes/taskRoutes.js`).
- Global error handling & 404 handler.

---

## 📌 Practical 5: MongoDB Integration and Schema Design with Mongoose
- Integrated **MongoDB Atlas** cloud database with `taskdb` database and `tasks` collection.
- Defined Mongoose schema and model (`models/Task.js`) with required `title`, defaults, and timestamps.
- Refactored all CRUD operations to asynchronous Mongoose methods (`Task.find()`, `task.save()`, `Task.findByIdAndUpdate()` with `runValidators: true`, `Task.findByIdAndDelete()`).
- Added structured error handling for `ValidationError` and `CastError` (`400 Bad Request`).

---

## 📌 Practical 6: Connecting React Frontend to Express + MongoDB Backend
- Connected React (Vite) frontend to Express + MongoDB Atlas backend using Fetch API and CORS.
- Implemented full CRUD with real-time UI state synchronization.

---

## 📌 Practical 7: Authentication and Middleware Pipeline
- Full-stack **JWT authentication** with 1-hour expiration.
- Password hashing with **bcryptjs (10 salt rounds)**.
- Secure Express middleware pipeline (`middleware/auth.js`) validating `Authorization: Bearer <token>`.
- User-isolated task management (`models/User.js` & `models/Task.js` reference).
- Endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, protected `CRUD /tasks`.

---

## 📌 Practical 8: Performance Optimization and Lazy Loading in React
- Frontend Code Splitting with `React.lazy()` and `<Suspense>`.
- Skeleton fallback loading UI with shimmer animation.
- On-demand heavy component chunking (`TaskAnalyticsChart.jsx`).
- Component memoization with `React.memo` preventing unnecessary re-renders.

---

## 🚀 PRACTICAL 9 STARTS FROM HERE: In-Memory Caching and Query Optimization

Practical 9 implements server-side **In-Memory Caching** using `node-cache` to eliminate redundant database roundtrips, reduce network latency, and optimize API throughput while ensuring strict **cache invalidation** and **multi-user isolation**.

### 🌟 Practical 9 Architecture
```
Client Request (Postman / React Frontend)
       ↓ (Authorization: Bearer <JWT>)
Express Middleware (auth.js -> req.user)
       ↓
Cache Layer (`cache/taskCache.js` - node-cache)
 ├── Cache HIT  -> Returns in-memory JSON in ~4-18 ms (Header: X-Cache: HIT)
 └── Cache MISS -> Queries MongoDB Atlas, stores in cache (TTL: 60s) (Header: X-Cache: MISS)
       ↓
Cache Invalidation Trigger (POST / PUT / DELETE)
 └── Clears user-specific cache keys immediately to guarantee data freshness
```

---

### 📊 Measured Response Time Comparison (Uncached vs. Cached)

*Measurements obtained by querying the live MongoDB Atlas cluster vs in-memory cache:*

| Run # | Uncached (Direct MongoDB Atlas Query) | Cached (`node-cache` In-Memory Hit) | Latency Improvement |
| :--- | :--- | :--- | :--- |
| **Run 1** | `128 ms` (`X-Cache: MISS`) | `18 ms` (`X-Cache: HIT`) | **85.9% faster** |
| **Run 2** | `64 ms` (`X-Cache: MISS`) | `5 ms` (`X-Cache: HIT`) | **92.2% faster** |
| **Run 3** | `63 ms` (`X-Cache: MISS`) | `4 ms` (`X-Cache: HIT`) | **93.6% faster** |
| **Average** | **`85.0 ms`** | **`9.0 ms`** | **~9.4x Speedup** |
| **Single Task (`GET /:id`)** | `48 ms` (Miss) | `3 ms` (Hit) | **~16x Speedup** |

---

### 🌐 Endpoints & Cache Behavior

| Endpoint | Method | Cache Strategy | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| `/tasks` | `GET` | User-scoped key (`tasks_user_<id>`), 60s TTL | Invalidated on POST, PUT, DELETE |
| `/tasks/:id` | `GET` | Individual key (`task_user_<id>_<taskId>`), 60s TTL | Invalidated on PUT, DELETE of that task |
| `/tasks` | `POST` | Database write | Clears `tasks_user_<id>` |
| `/tasks/:id` | `PUT` | Database update | Clears `tasks_user_<id>` & `task_user_<id>_<taskId>` |
| `/tasks/:id` | `DELETE` | Database delete | Clears `tasks_user_<id>` & `task_user_<id>_<taskId>` |
| `/cache/stats` | `GET` | Real-time cache performance counters | Returns hits, misses, hit rate, active keys |

---

### ⚠️ In-Memory Caching Limitations in Distributed Systems
1. **Single Node Scope**: In-memory cache resides in the RAM of a single Node.js process. In horizontal scaling / multi-instance setups (e.g. load balancers, PM2 cluster, Kubernetes), each instance maintains a separate cache, leading to cache inconsistency across replicas.
2. **Process Restart**: Server restarts or crashes wipe all in-memory cache.
3. **Memory Footprint**: High traffic and unbounded keys can consume excessive Node.js heap memory without proper eviction policies.
*Solution for Production Distributed Systems*: Use centralized external caching like **Redis** or **Memcached**.

---

### ⚙️ How to Run Tests & Benchmarks

```bash
cd TaskManagerAPI
npm start                  # Start server on Port 5000
npm test                   # Run core test suite
node prac9-test-benchmark.js # Run Practical 9 timing benchmark
```
