import { useEffect, useState, useCallback } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";
const TASKS_API = `${API_BASE}/tasks`;
const AUTH_API = `${API_BASE}/auth`;

function App() {
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
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Task state
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
        // Backend might not be running yet or network error
      }
    };

    if (token) {
      verifyUser();
    }
  }, [token, fetchTasks, handleLogout]);

  // Handle User Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!authEmail.trim()) {
      setError("Email is required");
      return;
    }
    if (!authPassword) {
      setError("Password is required");
      return;
    }
    if (authPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (authPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${AUTH_API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      setMessage("Registration successful! Please log in.");
      setAuthMode("login");
      setAuthPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle User Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!authEmail.trim() || !authPassword) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword
        })
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
      setAuthPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new task
  const addTask = async (e) => {
    e.preventDefault();
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
      setTitle("");
      setDescription("");
      setMessage("Task created successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle task completion
  const toggleComplete = async (task) => {
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
  };

  // Update existing task
  const updateTask = async (task) => {
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
  };

  // Delete task with confirmation
  const deleteTask = async (id) => {
    setError("");
    setMessage("");
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmed) {
      return;
    }
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
  };

  return (
    <div className="app-wrapper">
      <div className="container">
        {/* App Header */}
        <header className="header">
          <div className="header-title">
            <h1>Task Manager</h1>
            <span className="badge-pill">Practical 7</span>
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

        {/* Global Notifications */}
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {loading && <div className="loading-bar">Processing...</div>}

        {/* Auth Section: When user is not logged in */}
        {!token ? (
          <div className="auth-card">
            <div className="auth-tabs">
              <button
                className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                  setMessage("");
                }}
              >
                Login
              </button>
              <button
                className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("register");
                  setError("");
                  setMessage("");
                }}
              >
                Register
              </button>
            </div>

            {authMode === "login" ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Log in to manage your private tasks</p>
                <div className="input-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Authenticating..." : "Login"}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <h2>Create an Account</h2>
                <p className="auth-subtitle">Register to start organizing your tasks</p>
                <div className="input-group">
                  <label htmlFor="reg-email">Email Address</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="reg-password">Password</label>
                  <input
                    id="reg-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="reg-confirm">Confirm Password</label>
                  <input
                    id="reg-confirm"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Creating Account..." : "Register"}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Tasks Management View: When user is authenticated */
          <div className="tasks-dashboard">
            {/* Create Task Form */}
            <div className="card form-card">
              <h2>Add New Task</h2>
              <form onSubmit={addTask} className="task-form">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Task title (required)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Task description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  Add Task
                </button>
              </form>
            </div>

            {/* Task List Header */}
            <div className="tasks-header">
              <h2>Your Tasks</h2>
              <span className="task-count">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Task List */}
            {tasks.length === 0 && !loading ? (
              <div className="empty-state">
                <p>No tasks yet. Create your first task above!</p>
              </div>
            ) : (
              <div className="tasks-grid">
                {tasks.map((task) => (
                  <div className={`task-card ${task.completed ? "task-done" : ""}`} key={task._id}>
                    <div className="task-card-header">
                      <div className="task-title-wrap">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={Boolean(task.completed)}
                          onChange={() => toggleComplete(task)}
                          title="Toggle Completion"
                        />
                        <h3 className={task.completed ? "strike" : ""}>{task.title}</h3>
                      </div>
                      <span className={`status-badge ${task.completed ? "completed" : "pending"}`}>
                        {task.completed ? "Completed" : "Pending"}
                      </span>
                    </div>

                    {task.description && (
                      <p className="task-desc">{task.description}</p>
                    )}

                    <div className="task-actions">
                      <button className="btn-secondary" onClick={() => updateTask(task)}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => deleteTask(task._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
