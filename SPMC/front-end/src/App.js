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
    // Simple validation - in real app, this would connect to your Django backend
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
    { id: 'new-referral', icon: '�', label: 'New Referral' },
    { id: 'referral-history', icon: '�', label: 'Referral History' },
    { id: 'partner-hospitals', icon: '🏥', label: 'Partner Hospitals' },
    { id: 'available-services', icon: '🔍', label: 'Available Services' },
    { id: 'doctors-network', icon: '�‍⚕️', label: 'Doctors Network' },
    { id: 'urgent-referrals', icon: '�', label: 'Urgent Referrals' },
    { id: 'reports', icon: '�', label: 'Reports' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="content-section">
            <h2>Referral Dashboard</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">�</div>
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
                <div className="stat-icon">🏥</div>
                <div className="stat-info">
                  <h3>12</h3>
                  <p>Partner Hospitals</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚨</div>
                <div className="stat-info">
                  <h3>3</h3>
                  <p>Urgent Referrals</p>
                </div>
              </div>
            </div>
            <div className="recent-referrals">
              <h3>Recent Referrals</h3>
              <div className="referral-list">
                <div className="referral-item">
                  <div className="referral-info">
                    <h4>Juan Dela Cruz</h4>
                    <p>Cardiology - Heart Surgery</p>
                    <span className="hospital-name">→ Vicente Sotto Memorial Medical Center</span>
                  </div>
                  <div className="referral-status pending">Pending</div>
                </div>
                <div className="referral-item">
                  <div className="referral-info">
                    <h4>Maria Santos</h4>
                    <p>Neurology - Brain MRI</p>
                    <span className="hospital-name">→ Chong Hua Hospital</span>
                  </div>
                  <div className="referral-status completed">Completed</div>
                </div>
                <div className="referral-item">
                  <div className="referral-info">
                    <h4>Pedro Garcia</h4>
                    <p>Oncology - Cancer Treatment</p>
                    <span className="hospital-name">→ Cebu Doctors' University Hospital</span>
                  </div>
                  <div className="referral-status urgent">Urgent</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'new-referral':
        return (
          <div className="content-section">
            <h2>Create New Referral</h2>
            <div className="referral-form-container">
              <form className="referral-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Patient Name</label>
                    <input type="text" placeholder="Enter patient name" />
                  </div>
                  <div className="form-group">
                    <label>Patient ID</label>
                    <input type="text" placeholder="Enter patient ID" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Required Service</label>
                    <select>
                      <option>Select service needed</option>
                      <option>Cardiology</option>
                      <option>Neurology</option>
                      <option>Oncology</option>
                      <option>Orthopedics</option>
                      <option>Pediatrics</option>
                      <option>Emergency Surgery</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority Level</label>
                    <select>
                      <option>Normal</option>
                      <option>Urgent</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Reason for Referral</label>
                  <textarea placeholder="Explain why patient needs to be referred (equipment not available, specialist needed, etc.)"></textarea>
                </div>
                <div className="form-group">
                  <label>Preferred Hospital</label>
                  <select>
                    <option>Auto-select best match</option>
                    <option>Vicente Sotto Memorial Medical Center</option>
                    <option>Chong Hua Hospital</option>
                    <option>Cebu Doctors' University Hospital</option>
                    <option>Perpetual Succour Hospital</option>
                  </select>
                </div>
                <button type="submit" className="submit-referral-btn">Create Referral</button>
              </form>
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
                  <h3>Vicente Sotto Memorial Medical Center</h3>
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
                  <p>📞 (032) 255-8000</p>
                  <p>📍 B. Rodriguez St, Cebu City</p>
                </div>
              </div>
              <div className="hospital-card">
                <div className="hospital-header">
                  <h3>Chong Hua Hospital</h3>
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
                  <p>📞 (032) 255-8000</p>
                  <p>📍 Don Mariano Cui St, Cebu City</p>
                </div>
              </div>
              <div className="hospital-card">
                <div className="hospital-header">
                  <h3>Cebu Doctors' University Hospital</h3>
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
                  <p>📞 (032) 255-5555</p>
                  <p>📍 Osmena Blvd, Cebu City</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="content-section">
            <h2>{menuItems.find(item => item.id === activeMenu)?.label}</h2>
            <p>This referral system section is under development. Content for {activeMenu} will be added soon.</p>
          </div>
        );
    }
  };

  if (isLoggedIn) {
    return (
      <div className="App">
        <div className="dashboard">
          {/* Sidebar */}
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

          {/* Main Content */}
          <div className={`main-content ${sidebarOpen ? 'content-expanded' : 'content-full'}`}>
            <div className="header">
              <div className="header-left">
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                  <span className="hamburger-icon">☰</span>
                </button>
                <h1>SPMC Hospital System</h1>
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
            <p>Hospital Management System</p>
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