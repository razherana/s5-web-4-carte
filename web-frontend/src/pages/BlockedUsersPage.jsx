import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { userService } from '../services/userService';
import { ShieldOff, LockOpen, Lock, ArrowLeft, Users, RefreshCw } from 'lucide-react';
import './ManagementPages.css';

const BlockedUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Failed to load users. Please try to refresh the page.');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    setActionLoading(userId);
    try {
      await userService.unblockUser(userId);
      setMessage({ type: 'success', text: 'User unblocked successfully!' });
      await loadUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to unblock user.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;

    setActionLoading(userId);
    try {
      await userService.blockUser(userId);
      setMessage({ type: 'success', text: 'User blocked successfully!' });
      await loadUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to block user.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const blockedUsers = users.filter((u) => u.blocked);
  const lockedUsers = users.filter(
    (u) => !u.blocked && (u.login_attempts >= 3 || u.locked_until)
  );

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <AppShell
      title="Blocked & Locked Users"
      subtitle="Manage blocked accounts and unlock locked users"
      actions={
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadUsers} className="glass-button">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button onClick={() => navigate('/manager/users')} className="glass-button">
            <ArrowLeft size={16} />
            <span>All Users</span>
          </button>
        </div>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Blocked users section */}
      <div className="content-card glass-card" style={{ marginBottom: '1rem' }}>
        <div className="section-header-inline">
          <h3 className="section-title">
            <ShieldOff size={18} />
            <span>Blocked Users ({blockedUsers.length})</span>
          </h3>
        </div>

        {blockedUsers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No blocked users — all clear!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Login Attempts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>{user.role}</span>
                    </td>
                    <td>{user.login_attempts || 0}</td>
                    <td>
                      <button
                        onClick={() => handleUnblock(user.id)}
                        className="btn-action btn-success"
                        disabled={actionLoading === user.id}
                        title="Unblock user"
                      >
                        {actionLoading === user.id ? (
                          <div className="spinner-small"></div>
                        ) : (
                          <>
                            <LockOpen size={14} />
                            <span>Unblock</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Locked users section (too many failed login attempts) */}
      <div className="content-card glass-card" style={{ marginBottom: '1rem' }}>
        <div className="section-header-inline">
          <h3 className="section-title">
            <Lock size={18} />
            <span>Locked Users ({lockedUsers.length})</span>
          </h3>
          <p className="section-subtitle">Users locked out due to failed login attempts</p>
        </div>

        {lockedUsers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No locked users</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Login Attempts</th>
                  <th>Locked Until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lockedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>{user.role}</span>
                    </td>
                    <td>{user.login_attempts || 0}</td>
                    <td>
                      {user.locked_until
                        ? new Date(user.locked_until).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleUnblock(user.id)}
                        className="btn-action btn-success"
                        disabled={actionLoading === user.id}
                        title="Unlock user"
                      >
                        {actionLoading === user.id ? (
                          <div className="spinner-small"></div>
                        ) : (
                          <>
                            <LockOpen size={14} />
                            <span>Unlock</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All users overview for quick block/unblock */}
      <div className="content-card glass-card">
        <div className="section-header-inline">
          <h3 className="section-title">
            <Users size={18} />
            <span>All Users ({users.length})</span>
          </h3>
          <p className="section-subtitle">Quick block/unblock any user</p>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${user.blocked ? 'status-blocked' : 'status-active'}`}
                    >
                      {user.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    {user.blocked ? (
                      <button
                        onClick={() => handleUnblock(user.id)}
                        className="btn-action btn-success"
                        disabled={actionLoading === user.id}
                        title="Unblock user"
                      >
                        {actionLoading === user.id ? (
                          <div className="spinner-small"></div>
                        ) : (
                          <>
                            <LockOpen size={14} />
                            <span>Unblock</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlock(user.id)}
                        className="btn-action btn-danger"
                        disabled={actionLoading === user.id}
                        title="Block user"
                      >
                        {actionLoading === user.id ? (
                          <div className="spinner-small"></div>
                        ) : (
                          <>
                            <Lock size={14} />
                            <span>Block</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
};

export default BlockedUsersPage;
