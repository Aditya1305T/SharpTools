import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Topbar from './components/Topbar';
import Avatar from './components/Avatar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ProductCatalog from './pages/ProductCatalog';
import CartPage from './pages/CartPage';
import CustomOrderPage from './pages/CustomOrderPage';
import Dashboard from './pages/Dashboard';
import MessagesPage from './pages/MessagesPage';

function AdminBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() { logout(); navigate('/login'); }
  return (
    <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>
        CUT<span style={{ color: 'var(--brand)' }}>PRO</span>{' '}
        <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)', letterSpacing: 3 }}>ADMIN</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/catalog')}>← Storefront</button>
        <Avatar initials={user?.initials || 'AU'} size={32} />
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign Out</button>
      </div>
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const isAdminDash = location.pathname === '/dashboard' && user?.role === 'admin';

  return (
    <>
      {!isLogin && !isAdminDash && <Topbar />}
      {isAdminDash && <AdminBar />}
      <Routes>
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/catalog"   element={<ProtectedRoute><ProductCatalog /></ProtectedRoute>} />
        <Route path="/cart"      element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/custom"    element={<ProtectedRoute>{user?.role === 'admin' ? <Navigate to="/dashboard" replace /> : <CustomOrderPage />}</ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/messages"  element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/catalog" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
