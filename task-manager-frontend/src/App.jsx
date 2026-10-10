import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import LoadingFallback from "./components/LoadingFallback";
import "./App.css";

// Practical 8: Lazy loaded views with React.lazy and Suspense for Code Splitting
const AuthView = lazy(() => import("./components/AuthView"));
const TaskManagerView = lazy(() => import("./components/TaskManagerView"));
const AnalyticsView = lazy(() => import("./components/AnalyticsView"));
const ProfileView = lazy(() => import("./components/ProfileView"));

const API_BASE = "http://localhost:5000";
const TASKS_API = `${API_BASE}/tasks`;
const AUTH_API = `${API_BASE}/auth`;

function App() {
  // Navigation active tab: "tasks" | "analytics" | "profile"
  const [activeTab, setActiveTab] = useState("tasks");

  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Task state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Logout handler
  const handleLogout = useCallback((reason = "") => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setTasks([]);
    setActiveTab("tasks");
    if (reason) {
      setError(reason);
    } else {
      setMessage("Logged out successfully");
    }
  }, []);

  // Fetch all tasks for the logged in user
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const response = await fetch(TASKS_API, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  // Verify token on initial load
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${AUTH_API}/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.status === 401) {
          handleLogout("Session expired. Please log in again.");
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          fetchTasks();
        } else {
          handleLogout();
        }
      } catch {
        // Network or server starting up
      }
    };

    if (token) {
      verifyUser();
    }
  }, [token, fetchTasks, handleLogout]);

  // Handle User Registration
  const handleRegister = useCallback(async (email, password, onSuccess) => {
    setError("");
    setMessage("");

    try {
      setLoading(true);
      const response = await fetch(`${AUTH_API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      setMessage("Registration successful! Please log in.");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle User Login
  const handleLogin = useCallback(async (email, password) => {
    setError("");
    setMessage("");

    try {
      setLoading(true);
      const response = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("Login successful!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new task
  const handleAddTask = useCallback(async (title, description) => {
    setError("");
    setMessage("");
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(TASKS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed: false
        })
      });

      if (response.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create task");
      }

      setTasks((prevTasks) => [data.task, ...prevTasks]);
      setMessage("Task created successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  // Toggle task completion
  const handleToggleComplete = useCallback(async (task) => {
    setError("");
    setMessage("");
    try {
      setLoading(true);
      const response = await fetch(`${TASKS_API}/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: !task.completed
        })
      });

      if (response.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to update task");
      }

      setTasks((prevTasks) =>
        prevTasks.map((item) => (item._id === task._id ? data.task : item))
      );
      setMessage(`Task marked as ${data.task.completed ? "Completed" : "Pending"}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  // Update existing task
  const handleUpdateTask = useCallback(async (task) => {
    setError("");
    setMessage("");
    const newTitle = window.prompt("Enter new task title:", task.title);
    if (newTitle === null) return;
    if (!newTitle.trim()) {
      setError("Task title cannot be empty");
      return;
    }
    const newDescription = window.prompt(
      "Enter new description:",
      task.description || ""
    );
    if (newDescription === null) return;

    try {
      setLoading(true);
      const response = await fetch(`${TASKS_API}/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          completed: task.completed
        })
      });

      if (response.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to update task");
      }

      setTasks((prevTasks) =>
        prevTasks.map((item) => (item._id === task._id ? data.task : item))
      );
      setMessage("Task updated successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  // Delete task with confirmation
  const handleDeleteTask = useCallback(async (id) => {
    setError("");
    setMessage("");
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`${TASKS_API}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleLogout("Session expired. Please log in again.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to delete task");
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
      setMessage("Task deleted successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  return (
    <div className="app-wrapper">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <h1>Task Manager</h1>
            <span className="badge-pill">Practical 8: Lazy Loading</span>
          </div>

          {token && user && (
            <div className="user-profile">
              <div className="user-info">
                <span className="user-avatar">{user.email.charAt(0).toUpperCase()}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <button className="btn-logout" onClick={() => handleLogout()}>
                Logout
              </button>
            </div>
          )}
        </header>

        {/* Navigation Tabs (Only when authenticated) */}
        {token && user && (
          <nav className="main-nav">
            <button
              className={`nav-btn ${activeTab === "tasks" ? "active" : ""}`}
              onClick={() => setActiveTab("tasks")}
            >
              📋 Tasks
            </button>
            <button
              className={`nav-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              📈 Analytics (Lazy Route)
            </button>
            <button
              className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              👤 Profile (Lazy Route)
            </button>
          </nav>
        )}

        {/* Global Notifications */}
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {loading && <div className="loading-bar">Processing request...</div>}

        {/* Lazy Loaded Routes wrapped with Suspense */}
        <Suspense fallback={<LoadingFallback message={`Loading ${activeTab} module...`} />}>
          {!token ? (
            <AuthView
              loading={loading}
              onLogin={handleLogin}
              onRegister={handleRegister}
            />
          ) : (
            <>
              {activeTab === "tasks" && (
                <TaskManagerView
                  tasks={tasks}
                  loading={loading}
                  onAddTask={handleAddTask}
                  onToggleComplete={handleToggleComplete}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {activeTab === "analytics" && (
                <AnalyticsView tasks={tasks} />
              )}

              {activeTab === "profile" && (
                <ProfileView user={user} token={token} />
              )}
            </>
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default App;
