import React from 'react';

const Reports = () => {
  return (
    <div className="content-section">
      <h2>Reports & Analytics</h2>
      <div className="reports-container">
        
        <div className="report-section">
          <h3>Generate Reports</h3>
          <div className="report-options">
            <div className="report-card">
              <h4>Daily Referral Report</h4>
              <p>Summary of all referrals for a specific day</p>
              <div className="report-controls">
                <input type="date" />
                <button className="generate-btn">Generate</button>
              </div>
            </div>
            
            <div className="report-card">
              <h4>Weekly Summary</h4>
              <p>Weekly overview of referral activities</p>
              <div className="report-controls">
                <select>
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>Custom Range</option>
                </select>
                <button className="generate-btn">Generate</button>
              </div>
            </div>
            
            <div className="report-card">
              <h4>Hospital Performance</h4>
              <p>Response times and acceptance rates by hospital</p>
              <div className="report-controls">
                <select>
                  <option>All Hospitals</option>
                  <option>Davao Medical School Foundation</option>
                  <option>Davao Doctors Hospital</option>
                  <option>Brokenshire Hospital</option>
                </select>
                <button className="generate-btn">Generate</button>
              </div>
            </div>
            
            <div className="report-card">
              <h4>Service Utilization</h4>
              <p>Most requested services and specialties</p>
              <div className="report-controls">
                <select>
                  <option>Last 30 Days</option>
                  <option>Last 3 Months</option>
                  <option>Last 6 Months</option>
                </select>
                <button className="generate-btn">Generate</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="report-section">
          <h3>Quick Statistics</h3>
          <div className="stats-overview">
            <div className="stat-item">
              <h4>Today's Referrals</h4>
              <div className="stat-number">24</div>
              <div className="stat-breakdown">
                <span>✅ 18 Completed</span>
                <span>⏳ 3 Pending</span>
                <span>❌ 3 Cancelled</span>
              </div>
            </div>
            
            <div className="stat-item">
              <h4>Average Response Time</h4>
              <div className="stat-number">15 min</div>
              <div className="stat-breakdown">
                <span>📞 Hospital Contact: 5 min</span>
                <span>🚑 Transport: 10 min</span>
              </div>
            </div>
            
            <div className="stat-item">
              <h4>Success Rate</h4>
              <div className="stat-number">87%</div>
              <div className="stat-breakdown">
                <span>📈 +5% from last week</span>
                <span>🎯 Target: 90%</span>
              </div>
            </div>
            
            <div className="stat-item">
              <h4>Most Requested Service</h4>
              <div className="stat-number">Cardiology</div>
              <div className="stat-breakdown">
                <span>💓 35% of all referrals</span>
                <span>🏥 Mainly to DMSF</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="report-section">
          <h3>Recent Report Downloads</h3>
          <div className="download-history">
            <div className="download-item">
              <div className="download-info">
                <h4>Daily Report - January 26, 2026</h4>
                <p>Generated on Jan 26, 2026 at 5:30 PM</p>
              </div>
              <button className="download-btn">📥 Download</button>
            </div>
            
            <div className="download-item">
              <div className="download-info">
                <h4>Weekly Summary - Week 4, January 2026</h4>
                <p>Generated on Jan 25, 2026 at 11:45 AM</p>
              </div>
              <button className="download-btn">📥 Download</button>
            </div>
            
            <div className="download-item">
              <div className="download-info">
                <h4>Hospital Performance - Q4 2025</h4>
                <p>Generated on Jan 20, 2026 at 2:15 PM</p>
              </div>
              <button className="download-btn">📥 Download</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;