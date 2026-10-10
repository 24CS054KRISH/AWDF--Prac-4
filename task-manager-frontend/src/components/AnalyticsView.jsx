import React, { useState, Suspense, lazy } from "react";
import LoadingFallback from "./LoadingFallback";

// Heavy component lazy-loaded on demand
const TaskAnalyticsChart = lazy(() => import("./TaskAnalyticsChart"));

function AnalyticsView({ tasks }) {
  const [showChart, setShowChart] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const rate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h2>Performance & Task Insights</h2>
        <p className="subtitle">Practical 8: Lazy Loading & On-Demand Chunk Demonstration</p>
      </div>

      {/* Metric Cards */}
      <div className="metric-cards-grid">
        <div className="metric-card">
          <span className="metric-title">Total Tasks</span>
          <span className="metric-value">{tasks.length}</span>
          <span className="metric-sub">Created in system</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Completed</span>
          <span className="metric-value text-green">{completedCount}</span>
          <span className="metric-sub">Resolved tasks</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Pending</span>
          <span className="metric-value text-yellow">{pendingCount}</span>
          <span className="metric-sub">Action required</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Completion Rate</span>
          <span className="metric-value text-purple">{rate}%</span>
          <span className="metric-sub">Efficiency index</span>
        </div>
      </div>

      {/* On-Demand Lazy Loaded Heavy Chart */}
      <div className="chart-wrapper-card">
        {!showChart ? (
          <div className="chart-placeholder">
            <p>The interactive analytics visualization bundle is deferred to save initial bandwidth.</p>
            <button
              className="btn-primary btn-load-chart"
              onClick={() => setShowChart(true)}
            >
              📊 Load Interactive Analytics Chart (Lazy Chunk)
            </button>
          </div>
        ) : (
          <Suspense fallback={<LoadingFallback message="Fetching heavy chart chunk..." />}>
            <TaskAnalyticsChart tasks={tasks} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default AnalyticsView;
