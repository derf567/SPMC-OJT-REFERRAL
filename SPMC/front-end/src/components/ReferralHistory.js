import React from 'react';

const ReferralHistory = () => {
  return (
    <div className="content-section">
      <h2>Referral History</h2>
      <div className="referral-history-container">
        <div className="history-filters">
          <div className="filter-group">
            <label>Date Range:</label>
            <input type="date" />
            <span>to</span>
            <input type="date" />
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Hospital:</label>
            <select>
              <option value="">All Hospitals</option>
              <option value="dmsf">Davao Medical School Foundation</option>
              <option value="ddh">Davao Doctors Hospital</option>
              <option value="brokenshire">Brokenshire Hospital</option>
              <option value="drmc">Davao Regional Medical Center</option>
            </select>
          </div>
          <button className="filter-btn">Filter</button>
        </div>
        
        <div className="history-list">
          <div className="history-item">
            <div className="history-header">
              <h4>REF-2026-001</h4>
              <span className="history-date">January 26, 2026 - 14:30</span>
            </div>
            <div className="history-details">
              <div className="patient-info">
                <p><strong>Patient:</strong> Juan Dela Cruz, 45 years old</p>
                <p><strong>Service:</strong> Cardiology - Acute MI</p>
                <p><strong>Hospital:</strong> Davao Medical School Foundation</p>
              </div>
              <div className="referral-status completed">Completed</div>
            </div>
            <div className="history-timeline">
              <div className="timeline-item">
                <span className="timeline-time">14:30</span>
                <span className="timeline-event">Referral submitted</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-time">14:45</span>
                <span className="timeline-event">Hospital contacted</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-time">15:15</span>
                <span className="timeline-event">Patient transferred</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-time">16:00</span>
                <span className="timeline-event">Patient received at hospital</span>
              </div>
            </div>
          </div>
          
          <div className="history-item">
            <div className="history-header">
              <h4>REF-2026-002</h4>
              <span className="history-date">January 26, 2026 - 13:45</span>
            </div>
            <div className="history-details">
              <div className="patient-info">
                <p><strong>Patient:</strong> Maria Santos, 32 years old</p>
                <p><strong>Service:</strong> Neurology - Stroke</p>
                <p><strong>Hospital:</strong> Davao Doctors Hospital</p>
              </div>
              <div className="referral-status cancelled">Cancelled</div>
            </div>
            <div className="history-timeline">
              <div className="timeline-item">
                <span className="timeline-time">13:45</span>
                <span className="timeline-event">Referral submitted</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-time">14:00</span>
                <span className="timeline-event">Hospital contacted</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-time">14:20</span>
                <span className="timeline-event">Patient condition improved - referral cancelled</span>
              </div>
            </div>
          </div>
          
          <div className="history-item">
            <div className="history-header">
              <h4>REF-2026-003</h4>
              <span className="history-date">January 26, 2026 - 12:15</span>
            </div>
            <div className="history-details">
              <div className="patient-info">
                <p><strong>Patient:</strong> Pedro Garcia, 28 years old</p>
                <p><strong>Service:</strong> Emergency - Trauma</p>
                <p><strong>Hospital:</strong> Brokenshire Hospital</p>
              </div>
              <div className="referral-status pending">Pending</div>
            </div>
            <div className="history-timeline">
              <div className="timeline-item">
                <span className="timeline-time">12:15</span>
                <span className="timeline-event">Referral submitted</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-time">12:30</span>
                <span className="timeline-event">Hospital contacted</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-time">12:45</span>
                <span className="timeline-event">Awaiting transport availability</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralHistory;