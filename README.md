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

## 🚀 PRACTICAL 7 STARTS FROM HERE: Authentication and Middleware Pipeline

Practical 7 implements full-stack **JWT (JSON Web Token) authentication**, **password hashing with bcryptjs (10 salt rounds)**, a **custom authentication middleware pipeline**, **route protection**, and **user-isolated task management**.

### 🌟 Practical 7 Architecture Flow
```
React Frontend (localhost:5173)
  ├── Auth: Register / Login (Stores JWT token in localStorage)
  └── Protected Requests: Adds 'Authorization: Bearer <token>' Header
       ↓
Express Backend Pipeline (localhost:5000)
  ├── CORS & JSON Body Parser
  ├── Logger Middleware
  ├── Auth Middleware (`middleware/auth.js`) -> Verifies JWT & Attaches req.user
  ├── Auth Routes (`routes/authRoutes.js`) -> /auth/register, /auth/login, /auth/me
  ├── Protected Task Routes (`routes/taskRoutes.js`) -> User-isolated CRUD
  └── Global Error Handler (`middleware/errorHandler.js`)
       ↓
MongoDB Atlas Cloud (taskdb: users, tasks)
```

### 📂 Project Structure
```
TaskManagerAPI/                     # Backend (Port 5000)
├── middleware/
│   ├── auth.js                     # JWT verification & req.user attachment
│   ├── logger.js                   # Request logger
│   └── errorHandler.js             # Global error handler (Validation, Cast, JWT, 11000)
├── models/
│   ├── User.js                     # User schema (email, hashed password, timestamps)
│   └── Task.js                     # Task schema with user reference ObjectId
├── routes/
│   ├── authRoutes.js               # POST /register, POST /login, GET /me
│   └── taskRoutes.js               # Protected GET, POST, PUT, DELETE /tasks
├── .env                            # Secrets (MONGODB_URI, JWT_SECRET, PORT) - gitignored
├── .env.example                    # Template with placeholders
├── .gitignore
├── app.js                          # Express app entry & middleware pipeline
├── package.json
└── package-lock.json

task-manager-frontend/              # Frontend (Port 5173)
├── public/
├── src/
│   ├── App.jsx                     # Auth UI (Login/Register), Token persistence, Task CRUD
│   ├── App.css                     # Modern dark theme & responsive styles
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── package-lock.json
```

---

## ⚙️ How to Run Both Applications

### 1. Terminal 1: Start Backend (Port 5000)
```bash
cd TaskManagerAPI
npm install
npm start
```
*Output: `Server running at http://localhost:5000` & `MongoDB connected successfully`*

### 2. Terminal 2: Start Frontend (Port 5173)
```bash
cd task-manager-frontend
npm install
npm run dev
```
*Access the app at: `http://localhost:5173`*

---

## 🌐 Complete API Endpoint Mapping

| Feature | Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Register** | `POST` | `/auth/register` | No | Creates new user with hashed password (10 rounds) |
| **Login** | `POST` | `/auth/login` | No | Validates credentials and returns 1h JWT token |
| **Current User** | `GET` | `/auth/me` | Yes (`Bearer <token>`) | Returns authenticated user details (id, email) |
| **Get Tasks** | `GET` | `/tasks` | Yes (`Bearer <token>`) | Returns only tasks owned by authenticated user |
| **Create Task** | `POST` | `/tasks` | Yes (`Bearer <token>`) | Creates task linked to `req.user.userId` |
| **Update Task** | `PUT` | `/tasks/:id` | Yes (`Bearer <token>`) | Updates user-owned task by ID |
| **Delete Task** | `DELETE` | `/tasks/:id` | Yes (`Bearer <token>`) | Deletes user-owned task by ID |

---

## 🧪 Postman Testing Samples

### 1. Register User
- **POST** `http://localhost:5000/auth/register`
- **Body (JSON):**
```json
{
  "email": "student@example.com",
  "password": "Password123"
}
```
- **Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "673...",
    "email": "student@example.com",
    "createdAt": "2026-10-10T..."
  }
}
```

### 2. Login User
- **POST** `http://localhost:5000/auth/login`
- **Body (JSON):**
```json
{
  "email": "student@example.com",
  "password": "Password123"
}
```
- **Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "673...",
    "email": "student@example.com"
  }
}
```

### 3. Current User (`/auth/me`)
- **GET** `http://localhost:5000/auth/me`
- **Headers:** `Authorization: Bearer <your_jwt_token>`

### 4. Create Task (Protected)
- **POST** `http://localhost:5000/tasks`
- **Headers:** `Authorization: Bearer <your_jwt_token>`
- **Body (JSON):**
```json
{
  "title": "Complete AWDF Practical 7",
  "description": "Implement JWT authentication and middleware pipeline",
  "completed": false
}
```
