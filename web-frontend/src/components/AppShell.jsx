import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  BarChart3,
  Map,
  LogIn,
  LogOut,
  CircleUser,
  UserPlus,
  Users,
  Settings,
  FileText,
  ShieldOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AppShell.css';

const AppShell = ({ title, subtitle, actions, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isManager, logout } = useAuth();

  let userEmail = user?.email || 'Guest';
  if(userEmail.length > 13) {
    userEmail = userEmail.substring(0, 13) + '...';
  }

  const navigate = useNavigate();

  const navigation = useMemo(() => {
    if (isManager()) {
      return [
        { to: '/manager/dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
        { to: '/manager/reports', label: 'Reports', icon: <FileText size={18} /> },
        { to: '/manager/users', label: 'Users', icon: <Users size={18} /> },
        { to: '/manager/users/blocked', label: 'Blocked Users', icon: <ShieldOff size={18} /> },
        { to: '/manager/users/create', label: 'Create User', icon: <UserPlus size={18} /> },
        { to: '/profile', label: 'Profile', icon: <CircleUser size={18} /> },
        { to: '/visitor/dashboard', label: 'Visitor Map', icon: <Map size={18} /> },
      ];
    }

    return [
      { to: '/visitor/dashboard', label: 'Dashboard', icon: <Map size={18} /> },
      { to: '/profile', label: 'Profile', icon: <CircleUser size={18} />, requiresAuth: true },
      { to: '/login', label: 'Sign In', icon: <LogIn size={18} />, requiresGuest: true },
    ];
  }, [isManager]);

  const visibleNav = navigation.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiresGuest && isAuthenticated) return false;
    return true;
  });

  const handleLogout = async () => {
    await logout();
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
        </nav>

        <div className="sidebar-footer glass-card">
          <div className="user-info">
            <div className="user-avatar">
              <CircleUser size={22} />
            </div>
            <div>
              <p className="user-name">{userEmail || 'Guest User'}</p>
              <p className="user-role">{user?.role || 'Visitor mode'}</p>
            </div>
          </div>
          {isAuthenticated && (
            <button className="glass-button sidebar-logout" onClick={handleLogout}>
              <LogOut size={16} />
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
            <Menu size={18} />
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
