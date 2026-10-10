import React, { useMemo } from "react";

function TaskAnalyticsChart({ tasks }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Simulate heavy analytics computation for demonstration
    const distribution = [
      { label: "Completed", count: completed, pct: completionRate, color: "#22c55e" },
      { label: "Pending", count: pending, pct: 100 - completionRate, color: "#eab308" }
    ];

    const timeline = tasks.slice(0, 5).map((t, idx) => ({
      title: t.title,
      date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Recent",
      completed: t.completed,
      id: t._id || idx
    }));

    return { total, completed, pending, completionRate, distribution, timeline };
  }, [tasks]);

  return (
    <div className="analytics-chart-container">
      <h3>Productivity & Task Completion Breakdown</h3>
      
      {/* Progress Bar Visualizer */}
      <div className="progress-bar-wrap">
        <div className="progress-labels">
          <span>Overall Progress: {stats.completionRate}%</span>
          <span>{stats.completed}/{stats.total} Tasks Completed</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${stats.completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="chart-bars">
        {stats.distribution.map((item) => (
          <div key={item.label} className="chart-bar-item">
            <div className="bar-header">
              <span className="bar-dot" style={{ backgroundColor: item.color }}></span>
              <span className="bar-label">{item.label}</span>
              <span className="bar-count">{item.count} tasks ({stats.total > 0 ? item.pct : 0}%)</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${stats.total > 0 ? item.pct : 0}%`,
                  backgroundColor: item.color
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Timeline */}
      <div className="timeline-section">
        <h4>Recent Activity Stream</h4>
        {stats.timeline.length === 0 ? (
          <p className="empty-hint">No task activity recorded yet.</p>
        ) : (
          <ul className="timeline-list">
            {stats.timeline.map((item) => (
              <li key={item.id} className="timeline-item">
                <span className={`timeline-badge ${item.completed ? "done" : "open"}`}>
                  {item.completed ? "✓" : "○"}
                </span>
                <span className="timeline-title">{item.title}</span>
                <span className="timeline-date">{item.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TaskAnalyticsChart;
