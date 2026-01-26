import React from 'react';

const Settings = () => {
  return (
    <div className="content-section">
      <h2>System Settings</h2>
      <div className="settings-container">
        
        <div className="settings-section">
          <h3>User Profile</h3>
          <div className="settings-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Enter your full name" />
              </div>
              <div className="form-group">
                <label>Employee ID</label>
                <input type="text" placeholder="Enter employee ID" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select>
                  <option>Emergency Dispatch</option>
                  <option>Emergency Room</option>
                  <option>Administration</option>
                  <option>Medical Records</option>
                </select>
              </div>
              <div className="form-group">
                <label>Position</label>
                <input type="text" placeholder="Enter your position" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Contact Number</label>
              <input type="tel" placeholder="Enter contact number" />
            </div>
            
            <button className="save-btn">Save Profile</button>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>System Preferences</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Default Hospital Priority</label>
              <select>
                <option>Davao Medical School Foundation</option>
                <option>Davao Doctors Hospital</option>
                <option>Brokenshire Hospital</option>
                <option>Auto-select based on service</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Notification Settings</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Email notifications for new referrals
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  SMS alerts for urgent cases
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Daily summary reports
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  System maintenance alerts
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Auto-refresh Interval</label>
              <select>
                <option>30 seconds</option>
                <option>1 minute</option>
                <option>2 minutes</option>
                <option>5 minutes</option>
                <option>Manual refresh only</option>
              </select>
            </div>
            
            <button className="save-btn">Save Preferences</button>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Hospital Network Configuration</h3>
          <div className="hospital-config">
            <div className="config-item">
              <div className="config-info">
                <h4>Davao Medical School Foundation</h4>
                <p>Primary contact: (082) 227-2731</p>
              </div>
              <div className="config-actions">
                <button className="edit-btn">Edit</button>
                <button className="test-btn">Test Connection</button>
              </div>
            </div>
            
            <div className="config-item">
              <div className="config-info">
                <h4>Davao Doctors Hospital</h4>
                <p>Primary contact: (082) 221-2101</p>
              </div>
              <div className="config-actions">
                <button className="edit-btn">Edit</button>
                <button className="test-btn">Test Connection</button>
              </div>
            </div>
            
            <div className="config-item">
              <div className="config-info">
                <h4>Brokenshire Hospital</h4>
                <p>Primary contact: (082) 241-3000</p>
              </div>
              <div className="config-actions">
                <button className="edit-btn">Edit</button>
                <button className="test-btn">Test Connection</button>
              </div>
            </div>
            
            <button className="add-hospital-btn">+ Add New Hospital</button>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Security Settings</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Change Password</label>
              <input type="password" placeholder="Current password" />
              <input type="password" placeholder="New password" />
              <input type="password" placeholder="Confirm new password" />
            </div>
            
            <div className="form-group">
              <label>Session Settings</label>
              <select>
                <option>Auto-logout after 30 minutes</option>
                <option>Auto-logout after 1 hour</option>
                <option>Auto-logout after 2 hours</option>
                <option>No auto-logout</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                Require password confirmation for sensitive actions
              </label>
            </div>
            
            <button className="save-btn">Update Security</button>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>System Information</h3>
          <div className="system-info">
            <div className="info-item">
              <span className="info-label">System Version:</span>
              <span className="info-value">SPMC Referral System v2.1.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated:</span>
              <span className="info-value">January 20, 2026</span>
            </div>
            <div className="info-item">
              <span className="info-label">Database Status:</span>
              <span className="info-value status-online">Online</span>
            </div>
            <div className="info-item">
              <span className="info-label">Server Status:</span>
              <span className="info-value status-online">Operational</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Backup:</span>
              <span className="info-value">January 26, 2026 - 2:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;