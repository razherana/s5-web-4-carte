import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requireManager = false }) => {
  const { isAuthenticated, isManager, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireManager && !isManager()) {
    return <Navigate to="/visitor/dashboard" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isManager, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isManager()) {
      return <Navigate to="/manager/dashboard" replace />;
    }
    return <Navigate to="/visitor/dashboard" replace />;
  }

  return children;
};
