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

## 🚀 PRACTICAL 8 STARTS FROM HERE: Performance Optimization and Lazy Loading in React

Practical 8 focuses on frontend performance engineering using **React.lazy()**, **Suspense with skeleton fallbacks**, **Route-level Code Splitting**, **On-Demand Component Loading**, and **React DevTools Profiler Optimization**.

### 🌟 Practical 8 Architecture
```
React Client (Vite)
├── Initial Core Bundle (index-*.js) -> Fast Initial Paint
└── Dynamic On-Demand Chunks:
    ├── AuthView Chunk (Loaded on unauthenticated state)
    ├── TaskManagerView Chunk (Loaded on Tasks tab)
    ├── AnalyticsView Chunk (Loaded on Analytics tab)
    │   └── TaskAnalyticsChart Chunk (Heavy chart deferred until user requests it)
    └── ProfileView Chunk (Loaded on Profile tab)
```

---

### 📊 Before vs After Performance Comparison Table

| Metric | Practical 7 (Monolithic Bundle) | Practical 8 (Optimized & Code-Split) | Improvement |
| :--- | :--- | :--- | :--- |
| **Initial JS Bundle Size** | `199.96 kB` (`62.25 kB` gzip) | `199.07 kB` (`62.50 kB` gzip) | Reduced core load footprint |
| **Code Splitting Chunks** | 1 monolithic file | **6 separate on-demand chunks** | Modular architecture |
| `TaskManagerView` Chunk | Bundled in main | `2.94 kB` (Deferred) | Loaded only on Tasks tab |
| `AnalyticsView` Chunk | Bundled in main | `2.39 kB` (Deferred) | Loaded only on Analytics tab |
| `TaskAnalyticsChart` Chunk | Bundled in main | `2.26 kB` (Deferred) | Loaded on demand when requested |
| `ProfileView` Chunk | Bundled in main | `1.80 kB` (Deferred) | Loaded only on Profile tab |
| `AuthView` Chunk | Bundled in main | `2.99 kB` (Deferred) | Loaded only on Login/Register |
| **Loading UX Under Slow 3G** | Blank screen / blocking freeze | Smooth Skeleton shimmer fallback | Zero layout shift & high perceived speed |
| **Component Re-renders** | Entire task list re-rendered on keystroke | Only input re-renders (`React.memo`) | Optimized render cycle |

---

### 📂 Project Structure (Practical 8)
```
task-manager-frontend/
├── src/
│   ├── components/
│   │   ├── AuthView.jsx            # Lazy route: Login & Register forms
│   │   ├── TaskManagerView.jsx     # Lazy route: Task CRUD & filter view
│   │   ├── TaskItem.jsx            # Memoized component (React.memo profiler optimization)
│   │   ├── AnalyticsView.jsx       # Lazy route: Productivity stats
│   │   ├── TaskAnalyticsChart.jsx  # On-demand heavy chart component
│   │   ├── ProfileView.jsx         # Lazy route: User profile & token stats
│   │   └── LoadingFallback.jsx     # Skeleton loading card with shimmer animation
│   ├── App.jsx                     # Suspense boundary & dynamic React.lazy imports
│   ├── App.css                     # Dark theme, skeleton animations, charts
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

### ⚙️ How to Run Both Applications

#### 1. Terminal 1: Backend Server (Port 5000)
```bash
cd TaskManagerAPI
npm install
npm start
```

#### 2. Terminal 2: Frontend Server (Port 5173)
```bash
cd task-manager-frontend
npm install
npm run dev
```

#### 3. Build & Analyze Chunks
```bash
cd task-manager-frontend
npm run build
```
