import React, { useState, useMemo } from "react";
import TaskItem from "./TaskItem";

function TaskManagerView({
  tasks,
  loading,
  onAddTask,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "completed"

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onAddTask(title, description);
    setTitle("");
    setDescription("");
  };

  const filteredTasks = useMemo(() => {
    if (filter === "completed") return tasks.filter((t) => t.completed);
    if (filter === "pending") return tasks.filter((t) => !t.completed);
    return tasks;
  }, [tasks, filter]);

  return (
    <div className="tasks-dashboard">
      {/* Create Task Form */}
      <div className="card form-card">
        <h2>Add New Task</h2>
        <form onSubmit={handleFormSubmit} className="task-form">
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
            {loading ? "Adding..." : "Add Task"}
          </button>
        </form>
      </div>

      {/* Task List Header & Filters */}
      <div className="tasks-header">
        <div className="header-left">
          <h2>Your Tasks</h2>
          <span className="task-count">
            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task List rendered with memoized TaskItem */}
      {filteredTasks.length === 0 && !loading ? (
        <div className="empty-state">
          <p>
            {filter === "all"
              ? "No tasks yet. Create your first task above!"
              : `No ${filter} tasks found.`}
          </p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onToggleComplete={onToggleComplete}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskManagerView;
