import React from "react";

function LoadingFallback({ message = "Loading component..." }) {
  return (
    <div className="skeleton-container" role="status" aria-live="polite">
      <div className="skeleton-header">
        <div className="skeleton-box skeleton-title-bar"></div>
        <div className="skeleton-box skeleton-badge"></div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-box skeleton-input"></div>
        <div className="skeleton-box skeleton-input"></div>
        <div className="skeleton-box skeleton-btn"></div>
      </div>
      <div className="skeleton-footer">
        <div className="spinner-ring"></div>
        <span className="skeleton-text">{message}</span>
      </div>
    </div>
  );
}

export default LoadingFallback;
