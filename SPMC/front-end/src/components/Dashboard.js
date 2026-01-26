import React from 'react';

const Dashboard = () => {
  return (
    <div className="content-section">
      <h2>SPMC Emergency Dispatch Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>24</h3>
            <p>Pending Referrals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>156</h3>
            <p>Completed Referrals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚑</div>
          <div className="stat-info">
            <h3>8</h3>
            <p>In Transit</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <h3>3</h3>
            <p>Emergency Cases</p>
          </div>
        </div>
      </div>
      <div className="recent-referrals">
        <h3>Recent Referrals</h3>
        <div className="referral-list">
          <div className="referral-item">
            <div className="referral-info">
              <h4>Juan Dela Cruz - Age 45</h4>
              <p>Cardiology - Acute MI</p>
              <span className="hospital-name">→ Davao Medical School Foundation</span>
            </div>
            <div className="referral-status pending">In Transit</div>
          </div>
          <div className="referral-item">
            <div className="referral-info">
              <h4>Maria Santos - Age 32</h4>
              <p>Neurology - Stroke</p>
              <span className="hospital-name">→ Davao Doctors Hospital</span>
            </div>
            <div className="referral-status completed">Received</div>
          </div>
          <div className="referral-item">
            <div className="referral-info">
              <h4>Pedro Garcia - Age 28</h4>
              <p>Emergency - Trauma</p>
              <span className="hospital-name">→ Brokenshire Hospital</span>
            </div>
            <div className="referral-status urgent">Emergency</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;