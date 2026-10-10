import React from "react";

function ProfileView({ user, token }) {
  return (
    <div className="profile-view">
      <div className="profile-card">
        <div className="profile-badge-header">
          <div className="avatar-large">
            {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h2>User Profile & Security</h2>
            <span className="badge-pill">Practical 7 & 8 Integrated</span>
          </div>
        </div>

        <div className="profile-details-grid">
          <div className="detail-item">
            <span className="detail-label">Account Email</span>
            <span className="detail-value">{user?.email || "Unknown"}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">User ID</span>
            <span className="detail-value mono">{user?.id || user?._id || "N/A"}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Account Created</span>
            <span className="detail-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "Active Session"}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Authentication Mode</span>
            <span className="detail-value">JWT Bearer Token (1 Hour Expiry)</span>
          </div>
        </div>

        <div className="token-info-box">
          <h4>Active Token Preview</h4>
          <p className="token-text mono">
            {token ? `${token.substring(0, 32)}...${token.substring(token.length - 16)}` : "No token"}
          </p>
          <span className="token-status">✓ Authenticated via Secure Middleware</span>
        </div>
      </div>
    </div>
  );
}

export default ProfileView;
