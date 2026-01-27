import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import VisitorDashboard from './pages/VisitorDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import UsersPage from './pages/UsersPage';
import CreateUserPage from './pages/CreateUserPage';
import EditReportPage from './pages/EditReportPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Redirect root to visitor dashboard */}
          <Route path="/" element={<Navigate to="/visitor/dashboard" replace />} />

          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Visitor routes (open to everyone) */}
          <Route path="/visitor/dashboard" element={<VisitorDashboard />} />

          {/* Protected routes (authenticated users) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Manager routes */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute requireManager>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/users"
            element={
              <ProtectedRoute requireManager>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/users/create"
            element={
              <ProtectedRoute requireManager>
                <CreateUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports/edit"
            element={
              <ProtectedRoute requireManager>
                <EditReportPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
