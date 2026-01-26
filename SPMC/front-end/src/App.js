import React, { useState } from 'react';
import './App.css';

// Import all components
import Dashboard from './components/Dashboard';
import NewReferral from './components/NewReferral';
import TransitTemplate from './components/TransitTemplate';
import StatusTable from './components/StatusTable';
import PartnerHospitals from './components/PartnerHospitals';
import ReferralHistory from './components/ReferralHistory';
import Reports from './components/Reports';
import Settings from './components/Settings';

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
        return <Dashboard />;
      case 'new-referral':
        return <NewReferral />;
      case 'transit-template':
        return <TransitTemplate />;
      case 'status-table':
        return <StatusTable />;
      case 'partner-hospitals':
        return <PartnerHospitals />;
      case 'referral-history':
        return <ReferralHistory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
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