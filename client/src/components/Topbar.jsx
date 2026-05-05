import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Avatar from './Avatar';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link to="/catalog" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>
          SHARP<span style={{ color: 'var(--brand)' }}>TOOLS</span>{' '}
          <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--text-muted)', letterSpacing: 3 }}>INDUSTRIES</span>
        </Link>
        <nav className="topbar-nav" style={{ display: 'flex', gap: 4 }}>
          <Link to="/catalog"   className={isActive('/catalog')}>Catalog</Link>
          {user?.role !== 'admin' && <Link to="/custom"    className={isActive('/custom')}>Custom Orders</Link>}
          <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          {/* <Link to="#"  className={isActive('/messages')}>Messages</Link> */}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link to="/cart" className="btn btn-ghost cart-badge">
          🛒 Cart
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px', background: 'var(--surface)', borderRadius: 8 }}>
          <Avatar initials={user?.initials || '?'} size={30} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{user?.name?.split(' ')[0]}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>{user?.role?.toUpperCase()}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ fontSize: 11, padding: '4px 8px' }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
