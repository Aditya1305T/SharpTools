import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderService, customRequestService, userService } from '../services/api';
import Avatar from '../components/Avatar';

function formatPrice(p) { return '₹' + Number(p).toFixed(2); }
function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
function getStatusBadge(s) { return { Delivered:'success', Approved:'success', Shipped:'info', Processing:'warning', Pending:'warning', Rejected:'danger' }[s] || 'neutral'; }

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminDashboard /> : <CustomerDashboard />;
}

// ─── Customer Dashboard ───────────────────────────────────
function CustomerDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    orderService.getAll().then(setOrders).catch(() => addToast('Failed to load orders', 'warning'));
    customRequestService.getAll().then(setRequests).catch(() => {});
  }, []);

  const totalSpent = orders.reduce((s, o) => s + parseFloat(o.total), 0);
  const activeOrders = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;

  return (
    <div className="page-enter" style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Avatar initials={user?.initials || '?'} size={48} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26 }}>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.company || user?.email}</div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {[
          ['Total Orders', orders.length, '📦'],
          ['Active Orders', activeOrders, '🚚'],
          ['Custom Requests', requests.length, '🔧'],
          ['Total Spent', formatPrice(totalSpent), '💰'],
        ].map(([label, val, icon]) => (
          <div key={label} className="stat-card">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div className="stat-label">{label.toUpperCase()}</div>
            <div className="stat-value">{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 2 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 14 }}>My Orders</div>
          {orders.length === 0 ? (
            <div className="empty-state card"><div className="empty-state-icon">📦</div><h3>No orders yet</h3></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontSize: 13 }}>ORD-{String(o.id).padStart(3,'0')}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</td>
                      <td style={{ fontSize: 13 }}>{o.items?.filter(Boolean).length || 0} item(s)</td>
                      <td><strong>{formatPrice(o.total)}</strong></td>
                      <td><span className={`badge badge-${getStatusBadge(o.status)}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 14 }}>Custom Requests</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requests.length === 0 ? (
              <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>No custom requests
              </div>
            ) : (
              requests.map(r => (
                <div key={r.id} className="card" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brand)' }}>CR-{String(r.id).padStart(3,'0')}</span>
                    <span className={`badge badge-${getStatusBadge(r.status)}`}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.description.slice(0, 80)}...</div>
                </div>
              ))
            )}
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => navigate('/custom')}>+ New Request</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  async function loadAll() {
    try {
      const [o, r, u] = await Promise.all([orderService.getAll(), customRequestService.getAll(), userService.getAll()]);
      setOrders(o); setRequests(r); setUsers(u);
    } catch { addToast('Failed to load data', 'warning'); }
  }

  useEffect(() => { loadAll(); }, []);

  async function updateOrderStatus(id, status) {
    try { await orderService.updateStatus(id, status); addToast(`Order updated`); loadAll(); }
    catch { addToast('Failed to update order', 'warning'); }
  }

  async function updateRequestStatus(id, status) {
    try { await customRequestService.updateStatus(id, status); addToast(`Request ${status}`); loadAll(); }
    catch { addToast('Failed to update request', 'warning'); }
  }

  async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await userService.delete(id);
      addToast('User deleted successfully');
      loadAll();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete user', 'warning');
    }
  }

  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total), 0);

  const tabs = ['overview', 'orders', 'requests', 'users'];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-main">SHARP<span className="sidebar-logo-accent">TOOLS</span></div>
          <div className="sidebar-logo-sub">ADMIN CONSOLE</div>
        </div>
        <div className="sidebar-nav">
          <div className="sidebar-section-label">MANAGEMENT</div>
          {tabs.map(t => (
            <div key={t} className={`nav-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              <span className="nav-item-icon">{t==='overview'?'📊':t==='orders'?'📦':t==='requests'?'🔧':'👥'}</span>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
          <div className="sidebar-section-label">QUICK ACTIONS</div>
          <div className="nav-item" onClick={() => navigate('/catalog')}><span className="nav-item-icon">🛍️</span>Manage Products</div>
          <div className="nav-item" onClick={() => navigate('/messages')}><span className="nav-item-icon">💬</span>Messages</div>
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--steel-light)' }}>
          <div style={{ fontSize: 11, color: 'var(--chrome)', letterSpacing: 1, fontFamily: 'var(--font-display)' }}>SYSTEM STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ECC71' }} />
            <span style={{ fontSize: 12, color: 'var(--chrome-light)' }}>All systems operational</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '28px 32px', overflow: 'auto' }}>
        {tab === 'overview' && (
          <>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Admin Dashboard</h1>
            <p className="section-subtitle" style={{ marginBottom: 24 }}>Platform overview and metrics</p>
            <div className="grid grid-4" style={{ marginBottom: 28 }}>
              {[
                ['Total Revenue', formatPrice(totalRevenue), '💰'],
                ['Total Orders', orders.length, '📦'],
                ['Users', users.length, '👥'],
                ['Pending Requests', requests.filter(r => r.status === 'Pending').length, '🔧'],
              ].map(([label, val, icon]) => (
                <div key={label} className="stat-card">
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <div className="stat-label">{label.toUpperCase()}</div>
                  <div className="stat-value">{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Recent Orders</div>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontSize: 13 }}>ORD-{String(o.id).padStart(3,'0')}</span></td>
                          <td>{o.user_name || 'N/A'}</td>
                          <td><strong>{formatPrice(o.total)}</strong></td>
                          <td><span className={`badge badge-${getStatusBadge(o.status)}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Pending Requests</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {requests.filter(r => r.status === 'Pending').slice(0, 3).map(r => (
                    <div key={r.id} className="card" style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brand)' }}>CR-{String(r.id).padStart(3,'0')}</span>
                        <span className="badge badge-warning">{r.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.description?.slice(0, 80)}...</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <button className="btn btn-success btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateRequestStatus(r.id, 'Approved')}>Approve</button>
                        <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateRequestStatus(r.id, 'Rejected')}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'orders' && (
          <>
            <h1 className="section-title" style={{ marginBottom: 20 }}>All Orders</h1>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontSize: 12 }}>ORD-{String(o.id).padStart(3,'0')}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(o.created_at)}</td>
                      <td>{o.user_name || 'N/A'}</td>
                      <td><strong>{formatPrice(o.total)}</strong></td>
                      <td><span className={`badge badge-${getStatusBadge(o.status)}`}>{o.status}</span></td>
                      <td>
                        <select className="input-field" style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }} value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                          {['Pending', 'Processing', 'Shipped', 'Delivered'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'requests' && (
          <>
            <h1 className="section-title" style={{ marginBottom: 20 }}>Custom Requests</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {requests.map(r => (
                <div key={r.id} className="card" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontSize: 13 }}>CR-{String(r.id).padStart(3,'0')}</span>
                        <span className={`badge badge-${getStatusBadge(r.status)}`}>{r.status}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(r.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>From: {r.user_name} {r.user_company && `(${r.user_company})`}</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.description}</p>
                      {r.specs && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {r.specs.split(', ').map(s => <span key={s} className="tag">{s}</span>)}
                        </div>
                      )}
                    </div>
                    {r.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button className="btn btn-success btn-sm" onClick={() => updateRequestStatus(r.id, 'Approved')}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateRequestStatus(r.id, 'Rejected')}>Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'users' && (
          <>
            <h1 className="section-title" style={{ marginBottom: 20 }}>User Management</h1>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Orders</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar initials={u.initials || '?'} size={30} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.company || 'SharpTools Staff'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>{u.role.toUpperCase()}</span></td>
                      <td>{orders.filter(o => o.user_id === u.id).length}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(u.created_at)}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
