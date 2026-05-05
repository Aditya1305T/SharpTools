import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password);
        addToast(`Welcome back, ${user.name.split(' ')[0]}!`);
        navigate('/catalog');
      } else {
        const res = await register(form.name, form.email, form.password, form.company);
        // server sends OTP; navigate to OTP entry page
        addToast(res.message || 'OTP sent to your email');
        navigate('/verify-otp', { state: { email: form.email } });
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Authentication failed', 'warning');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--steel)' }}>
      {/* Left: Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 420, background: 'var(--white)', borderRadius: 16, padding: '40px 36px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: 1 }}>
              SHARP<span style={{ color: 'var(--brand)' }}>TOOLS</span>
            </div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>INDUSTRIES</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>{mode === 'login' ? 'Sign In' : 'Create Account'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Premium Cutting Tools Portal</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <>
                <div>
                  <label className="input-label">FULL NAME</label>
                  <input className="input-field" placeholder="John Smith" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="input-label">COMPANY (OPTIONAL)</label>
                  <input className="input-field" placeholder="Acme Manufacturing" value={form.company} onChange={e => set('company', e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label className="input-label">EMAIL ADDRESS</label>
              <input className="input-field" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="input-label">PASSWORD</label>
              <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="btn-ghost" style={{ color: 'var(--brand)', fontWeight: 600, padding: 0, fontSize: 13 }} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </div>

          {/* <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--surface)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Demo accounts (password: password):</strong><br />
            Admin: admin@cutpro.com<br />
            Customer: j.whitfield@acmemfg.com
          </div> */}
        </div>
      </div>

      {/* Right: Hero */}
      <div style={{ flex: 1, background: 'var(--steel)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px)' }} />
        <div style={{ position: 'absolute', left: 0, top: '30%', bottom: '30%', width: 4, background: 'var(--brand)' }} />
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1.0, color: 'white', letterSpacing: -1 }}>
            PRECISION<br /><span style={{ color: 'var(--brand-light)' }}>CUTTING</span><br />TOOLS
          </div>
          <div style={{ fontSize: 16, color: 'var(--chrome)', lineHeight: 1.7, marginTop: 20 }}>
            Industrial-grade tooling solutions for aerospace, automotive, and heavy manufacturing.
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
            {[['500+', 'Products'], ['25+', 'Years Exp.'], ['99%', 'Precision']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'white' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'var(--chrome)', letterSpacing: 1, fontFamily: 'var(--font-display)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
