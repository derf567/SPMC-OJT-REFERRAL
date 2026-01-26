import React, { useState } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username && password) {
      setIsLoggedIn(true);
    } else {
      alert('Please enter both username and password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setSidebarOpen(true);
    setActiveMenu('dashboard');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'new-referral', icon: '📋', label: 'New Referral' },
    { id: 'transit-template', icon: '🚑', label: 'Transit Template' },
    { id: 'status-table', icon: '📊', label: 'Status Table' },
    { id: 'referral-history', icon: '📄', label: 'Referral History' },
    { id: 'partner-hospitals', icon: '🏥', label: 'Partner Hospitals' },
    { id: 'reports', icon: '📈', label: 'Reports' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
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

      case 'new-referral':
        return (
          <div className="content-section">
            <h2>SPMC Emergency Dispatch and Communication Center Referral Form</h2>
            <div className="referral-form-container">
              <form className="referral-form">
                <div className="form-section">
                  <h3>Patient Status</h3>
                  <div className="form-group">
                    <label>Chief Complaint</label>
                    <textarea placeholder="Enter chief complaint" rows="3"></textarea>
                  </div>
                  <div className="form-group">
                    <label>Pertinent History</label>
                    <textarea placeholder="Enter pertinent history" rows="3"></textarea>
                  </div>
                  <div className="form-group">
                    <label>Pertinent Physical Exam or Laboratories</label>
                    <textarea placeholder="Enter physical exam findings or laboratory results" rows="3"></textarea>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Blood Pressure (BP)</label>
                      <input type="text" placeholder="e.g., 120/80 mmHg" />
                    </div>
                    <div className="form-group">
                      <label>Heart Rate (HR)</label>
                      <input type="text" placeholder="e.g., 80 bpm" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Respiratory Rate (RR)</label>
                      <input type="text" placeholder="e.g., 18/min" />
                    </div>
                    <div className="form-group">
                      <label>Temperature</label>
                      <input type="text" placeholder="e.g., 36.5°C" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>O2 Saturation</label>
                      <input type="text" placeholder="e.g., 98%" />
                    </div>
                    <div className="form-group">
                      <label>GCS Score or AVPU</label>
                      <input type="text" placeholder="e.g., GCS 15 or Alert" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>O2 Support</label>
                      <input type="text" placeholder="e.g., Room air, Nasal cannula 2L/min" />
                    </div>
                    <div className="form-group">
                      <label>Admission Status in Referring Institution</label>
                      <select>
                        <option value="">Select admission status</option>
                        <option value="emergency-room">Emergency Room</option>
                        <option value="ward">Ward</option>
                        <option value="intensive-care-unit">Intensive Care Unit</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>RTPCR Result</label>
                      <select>
                        <option value="">Select RTPCR result</option>
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                        <option value="not-done">Not Done</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Working Impression</label>
                      <input type="text" placeholder="DONE (automatic)" disabled />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Management done to the patient</label>
                    <textarea placeholder="LABS (automatic)" rows="3" disabled></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label>Upload Pertinent Laboratories and Images</label>
                    <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                    <small>Or send directly through Viber: 0915 541 3040</small>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Specialty Needed</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Which Specialty/Service is Needed</label>
                      <select>
                        <option value="">Select specialty needed</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="neurology">Neurology</option>
                        <option value="oncology">Oncology</option>
                        <option value="orthopedics">Orthopedics</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="surgery">Surgery</option>
                        <option value="emergency-medicine">Emergency Medicine</option>
                        <option value="internal-medicine">Internal Medicine</option>
                        <option value="icu">Intensive Care Unit</option>
                        <option value="others">Others</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>If others, please specify</label>
                      <input type="text" placeholder="Specify required specialty or service" />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Patient General Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Patient Category</label>
                      <select>
                        <option value="">Select patient category</option>
                        <option value="new-patient">New Patient of SPMC</option>
                        <option value="old-patient">Old or Known Patient of SPMC</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>If known Patient of SPMC, HRN (Hospital Record Number)</label>
                      <input type="text" placeholder="Enter HRN or N/A if unknown" />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Patient's Full Name</label>
                    <input type="text" placeholder="Enter patient's complete name" />
                  </div>
                  
                  <div className="form-group">
                    <label>Patient Current Complete Address</label>
                    <textarea placeholder="Enter complete current address" rows="2"></textarea>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Birthday</label>
                      <input type="date" />
                    </div>
                    <div className="form-group">
                      <label>Age</label>
                      <input type="number" placeholder="Enter age" />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Gender</label>
                    <select>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Service Needed</h3>
                  <div className="form-group">
                    <label>Urgent</label>
                    <select>
                      <option value="">Select urgency level</option>
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Referring Hospital</h3>
                  <div className="form-group">
                    <label>Is your Hospital/Facility Located inside Davao City?</label>
                    <select>
                      <option value="">Select location</option>
                      <option value="inside-davao">Inside Davao City</option>
                      <option value="outside-davao">Outside Davao City</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Complete name of the referring facility</label>
                    <input type="text" placeholder="Enter referring facility name" />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name of the referrer</label>
                      <input type="text" placeholder="Enter referrer's name" />
                    </div>
                    <div className="form-group">
                      <label>Profession of the referrer</label>
                      <input type="text" placeholder="e.g., MD, RN, etc." />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Cellphone number of the referrer</label>
                      <input type="tel" placeholder="Enter contact number" />
                    </div>
                    <div className="form-group">
                      <label>Mode of transportation</label>
                      <select>
                        <option value="">Select transportation</option>
                        <option value="ambulance">Ambulance</option>
                        <option value="private-vehicle">Private Vehicle</option>
                        <option value="public-transport">Public Transport</option>
                        <option value="helicopter">Helicopter</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Consent to Transfer</h3>
                  <div className="form-group">
                    <label>Was a consent form to transfer secured from the patient/relative prior to this referral?</label>
                    <select>
                      <option value="">Select consent status</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Reason for referral</label>
                    <textarea placeholder="Enter detailed reason for referral" rows="3"></textarea>
                  </div>
                </div>

                <button type="submit" className="submit-referral-btn">Submit Referral Form</button>
              </form>
            </div>
          </div>
        );

      case 'transit-template':
        return (
          <div className="content-section">
            <h2>Transit Template</h2>
            <div className="transit-form-container">
              <form className="transit-form">
                <div className="form-section">
                  <h3>Patient Transfer Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Patient Name</label>
                      <input type="text" placeholder="Enter patient name" />
                    </div>
                    <div className="form-group">
                      <label>Age</label>
                      <input type="number" placeholder="Enter age" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Watcher's Name</label>
                      <input type="text" placeholder="Enter watcher's name" />
                    </div>
                    <div className="form-group">
                      <label>Watcher's Age</label>
                      <input type="number" placeholder="Enter watcher's age" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Relation to patient</label>
                      <input type="text" placeholder="e.g., Spouse, Child, Parent" />
                    </div>
                    <div className="form-group">
                      <label>Contact number</label>
                      <input type="tel" placeholder="Enter contact number" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Escort Nurse</label>
                      <input type="text" placeholder="Enter escort nurse name" />
                    </div>
                    <div className="form-group">
                      <label>Driver</label>
                      <input type="text" placeholder="Enter driver name" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Referring MD/Contact</label>
                      <input type="text" placeholder="Enter referring doctor and contact" />
                    </div>
                    <div className="form-group">
                      <label>Referring Facility</label>
                      <input type="text" placeholder="Enter referring facility name" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Latest Vital Signs</label>
                      <input type="text" placeholder="Enter latest vital signs" />
                    </div>
                    <div className="form-group">
                      <label>GCS</label>
                      <input type="text" placeholder="Enter GCS score" />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Time ambulance left</label>
                    <input type="datetime-local" />
                  </div>
                </div>
                
                <button type="submit" className="submit-referral-btn">Save Transit Information</button>
              </form>
            </div>
          </div>
        );

      case 'status-table':
        return (
          <div className="content-section">
            <h2>Status Table</h2>
            <div className="status-table-container">
              <table className="status-table">
                <thead>
                  <tr>
                    <th>Time Received</th>
                    <th>Patient's Name</th>
                    <th>Age</th>
                    <th>Time Ambulance Left</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Service</th>
                    <th>Disposition</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>14:30</td>
                    <td>Juan Dela Cruz</td>
                    <td>45</td>
                    <td>15:15</td>
                    <td>45 min</td>
                    <td><span className="status-badge received">Received</span></td>
                    <td>Cardiology</td>
                    <td>Admitted</td>
                    <td>Stable condition</td>
                  </tr>
                  <tr>
                    <td>13:45</td>
                    <td>Maria Santos</td>
                    <td>32</td>
                    <td>14:20</td>
                    <td>35 min</td>
                    <td><span className="status-badge cancelled">Cancelled</span></td>
                    <td>Neurology</td>
                    <td>-</td>
                    <td>Patient improved</td>
                  </tr>
                  <tr>
                    <td>12:15</td>
                    <td>Pedro Garcia</td>
                    <td>28</td>
                    <td>-</td>
                    <td>-</td>
                    <td><span className="status-badge uncoordinated">Uncoordinated</span></td>
                    <td>Emergency</td>
                    <td>Pending</td>
                    <td>Awaiting transport</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'partner-hospitals':
        return (
          <div className="content-section">
            <h2>Partner Hospitals Network</h2>
            <div className="hospitals-grid">
              <div className="hospital-card">
                <div className="hospital-header">
                  <h3>Davao Medical School Foundation</h3>
                  <div className="hospital-status available">Available</div>
                </div>
                <div className="hospital-services">
                  <h4>Available Services:</h4>
                  <div className="service-tags">
                    <span className="service-tag">Cardiology</span>
                    <span className="service-tag">Neurology</span>
                    <span className="service-tag">Emergency</span>
                    <span className="service-tag">ICU</span>
                  </div>
                </div>
                <div className="hospital-contact">
                  <p>📞 (082) 227-2731</p>
                  <p>📍 Bajada, Davao City</p>
                </div>
              </div>
              <div className="hospital-card">
                <div className="hospital-header">
                  <h3>Davao Doctors Hospital</h3>
                  <div className="hospital-status available">Available</div>
                </div>
                <div className="hospital-services">
                  <h4>Available Services:</h4>
                  <div className="service-tags">
                    <span className="service-tag">Oncology</span>
                    <span className="service-tag">Radiology</span>
                    <span className="service-tag">Surgery</span>
                    <span className="service-tag">Dialysis</span>
                  </div>
                </div>
                <div className="hospital-contact">
                  <p>📞 (082) 221-2101</p>
                  <p>📍 Gen. Malvar St, Davao City</p>
                </div>
              </div>
              <div className="hospital-card">
                <div className="hospital-header">
                  <h3>Brokenshire Hospital</h3>
                  <div className="hospital-status busy">Busy</div>
                </div>
                <div className="hospital-services">
                  <h4>Available Services:</h4>
                  <div className="service-tags">
                    <span className="service-tag">Pediatrics</span>
                    <span className="service-tag">Orthopedics</span>
                    <span className="service-tag">Maternity</span>
                    <span className="service-tag">Laboratory</span>
                  </div>
                </div>
                <div className="hospital-contact">
                  <p>📞 (082) 241-3000</p>
                  <p>📍 Madapo Hills, Davao City</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="content-section">
            <h2>{menuItems.find(item => item.id === activeMenu)?.label}</h2>
            <p>This section is under development. Content for {activeMenu} will be added soon.</p>
          </div>
        );
    }
  };

  if (isLoggedIn) {
    return (
      <div className="App">
        <div className="dashboard">
          <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <div className="sidebar-header">
              <div className="hospital-logo">
                <span className="logo-icon">🏥</span>
                {sidebarOpen && <span className="logo-text">SPMC</span>}
              </div>
            </div>
            
            <nav className="sidebar-nav">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => setActiveMenu(item.id)}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {sidebarOpen && <span className="nav-label">{item.label}</span>}
                </button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <button className="nav-item logout-nav" onClick={handleLogout}>
                <span className="nav-icon">🚪</span>
                {sidebarOpen && <span className="nav-label">Logout</span>}
              </button>
            </div>
          </div>

          <div className={`main-content ${sidebarOpen ? 'content-expanded' : 'content-full'}`}>
            <div className="header">
              <div className="header-left">
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                  <span className="hamburger-icon">☰</span>
                </button>
                <h1>SPMC Emergency Dispatch Center</h1>
              </div>
              <div className="header-right">
                <div className="user-info">
                  <span className="user-avatar">👤</span>
                  <span className="user-name">Welcome, {username}</span>
                </div>
              </div>
            </div>
            
            <div className="content">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="login-container">
        <div className="login-box">
          <div className="hospital-header">
            <h1>SPMC Hospital</h1>
            <p>Emergency Dispatch and Communication Center</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button type="submit" className="login-btn">
              Login
            </button>
          </form>
          
          <div className="footer">
            <p>&copy; 2026 SPMC Hospital. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;