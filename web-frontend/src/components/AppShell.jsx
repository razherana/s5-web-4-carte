import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaChartLine,
  FaMapMarkedAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserCircle,
  FaUserPlus,
  FaUsers,
  FaCog,
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import './AppShell.css';

const AppShell = ({ title, subtitle, actions, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isManager, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = useMemo(() => {
    if (isManager()) {
      return [
        { to: '/manager/dashboard', label: 'Dashboard', icon: <FaChartLine /> },
        { to: '/manager/users', label: 'Users', icon: <FaUsers /> },
        { to: '/manager/users/create', label: 'Create User', icon: <FaUserPlus /> },
        { to: '/profile', label: 'Profile', icon: <FaUserCircle /> },
        { to: '/visitor/dashboard', label: 'Visitor Map', icon: <FaMapMarkedAlt /> },
      ];
    }

    return [
      { to: '/visitor/dashboard', label: 'Dashboard', icon: <FaMapMarkedAlt /> },
      { to: '/profile', label: 'Profile', icon: <FaUserCircle />, requiresAuth: true },
      { to: '/login', label: 'Sign In', icon: <FaSignInAlt />, requiresGuest: true },
    ];
  }, [isManager]);

  const visibleNav = navigation.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiresGuest && isAuthenticated) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className="app-sidebar glass-card">
        <div className="sidebar-brand">
          <div className="brand-mark">C</div>
          <div className="brand-text">
            <span className="brand-title">Carte</span>
            <span className="brand-subtitle">Urban reports</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Navigation</span>
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Preferences</span>
            <button className="sidebar-link ghost" type="button">
              <span className="sidebar-icon"><FaCog /></span>
              <span>Appearance</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer glass-card">
          <div className="user-info">
            <div className="user-avatar">
              <FaUserCircle />
            </div>
            <div>
              <p className="user-name">{user?.name || 'Guest User'}</p>
              <p className="user-role">{user?.role || 'Visitor mode'}</p>
            </div>
          </div>
          {isAuthenticated && (
            <button className="glass-button sidebar-logout" onClick={handleLogout}>
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar glass-card">
          <button
            className="glass-button sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle sidebar"
            type="button"
          >
            <FaBars />
          </button>

          <div className="topbar-title">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="topbar-actions">{actions}</div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
