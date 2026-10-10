import React, { memo } from "react";

// Optimized with React.memo: prevents re-rendering unchanged task items when typing in parent form
const TaskItem = memo(function TaskItem({ task, onToggleComplete, onUpdate, onDelete }) {
  return (
    <div className={`task-card ${task.completed ? "task-done" : ""}`}>
      <div className="task-card-header">
        <div className="task-title-wrap">
          <input
            type="checkbox"
            className="task-checkbox"
            checked={Boolean(task.completed)}
            onChange={() => onToggleComplete(task)}
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
        <button className="btn-secondary" onClick={() => onUpdate(task)}>
          Edit
        </button>
        <button className="btn-danger" onClick={() => onDelete(task._id)}>
          Delete
        </button>
      </div>
    </div>
  );
});

export default TaskItem;
