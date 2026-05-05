import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function OtpVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const { addToast } = useToast();
  const [email] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await verifyOtp(email, otp);
      addToast(`Welcome, ${user.name.split(' ')[0]}!`);
      navigate('/catalog');
    } catch (err) {
      addToast(err.response?.data?.error || 'Verification failed', 'warning');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 420, background: 'var(--white)', padding: 28, borderRadius: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Enter verification code</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>We sent a 6-digit code to <strong>{email}</strong>.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input-field" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} required />
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Continue'}</button>
        </form>
      </div>
    </div>
  );
}
