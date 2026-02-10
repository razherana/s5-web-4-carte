import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { LockOpen, Plus, Trash2, Users } from 'lucide-react';
import { userService } from '../services/userService';
import './ManagementPages.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
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
    try {
      await userService.unblockUser(userId);
      setMessage({ type: 'success', text: 'User unblocked successfully!' });
      await loadUsers();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to unblock user.' 
      });
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(userId);
      setMessage({ type: 'success', text: 'User deleted successfully!' });
      await loadUsers();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to delete user.' 
      });
    }
  };

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
      title="User Management"
      subtitle="Manage user accounts and permissions"
      actions={
        <button
          onClick={() => navigate('/manager/users/create')}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>Create User</span>
        </button>
      }
    >
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="content-card glass-card">
        {users.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon"><Users size={40} /></p>
            <p className="empty-text">No users found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
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
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.blocked ? 'status-blocked' : 'status-active'}`}>
                        {user.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {user.blocked && (
                          <button
                            onClick={() => handleUnblock(user.id)}
                            className="btn-action btn-success"
                            title="Unblock user"
                          >
                            <LockOpen size={14} />
                            <span>Unblock</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn-action btn-danger"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default UsersPage;
