import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { customRequestService } from '../services/api';

function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
function getStatusBadge(s) { return { Delivered:'success', Approved:'success', Shipped:'info', Processing:'warning', Pending:'warning', Rejected:'danger' }[s] || 'neutral'; }

export default function CustomOrderPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState('');
  const [form, setForm] = useState({ description: '', material: 'Carbide', coatings: '', size: '', flutes: '', quantity: '', notes: '' });

  async function loadRequests() {
    try {
      const data = await customRequestService.getAll();
      setRequests(data);
    } catch { addToast('Failed to load requests', 'warning'); }
  }

  useEffect(() => { loadRequests(); }, []);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const specs = `Material: ${form.material}${form.size ? ', Size: ' + form.size : ''}${form.flutes ? ', Flutes: ' + form.flutes : ''}`;
      await customRequestService.create({ description: form.description, specs, file_url: fileName || null });
      addToast('Custom request submitted!');
      setSubmitted(true);
      loadRequests();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit', 'warning');
    }
  }

  async function updateStatus(id, status) {
    try {
      await customRequestService.updateStatus(id, status);
      addToast(`Request ${status}`);
      loadRequests();
    } catch { addToast('Failed to update status', 'warning'); }
  }

  const userRequests = user?.role === 'admin' ? requests : requests.filter(r => r.user_id === user?.id);

  return (
    <div className="page-enter" style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Form */}
        <div style={{ flex: 1, maxWidth: 580 }}>
          <h1 className="section-title" style={{ marginBottom: 4 }}>Custom Tool Request</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>Need a non-standard cutting tool? Submit your specifications below.</p>

          {submitted ? (
            <div className="card" style={{ padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Request Submitted!</div>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>Our engineering team will review your specifications and respond within 2–3 business days.</p>
              <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ description: '', material: 'Carbide', coatings: '', size: '', flutes: '', quantity: '', notes: '' }); setFileName(''); }}>
                Submit Another Request
              </button>
            </div>
          ) : (
            <form className="card" style={{ padding: '28px' }} onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="input-label">TOOL DESCRIPTION *</label>
                  <textarea className="input-field" rows={3} placeholder="Describe the cutting tool you need in detail..." value={form.description} onChange={e => set('description', e.target.value)} required style={{ resize: 'vertical' }} />
                </div>
                <div className="grid-2">
                  <div>
                    <label className="input-label">MATERIAL</label>
                    <select className="input-field" value={form.material} onChange={e => set('material', e.target.value)}>
                      {['Carbide', 'HSS', 'HSS-Co', 'CBN', 'Diamond', 'Ceramic'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div><label className="input-label">COATING</label><input className="input-field" value={form.coatings} onChange={e => set('coatings', e.target.value)} placeholder="TiAlN, TiN, DLC..." /></div>
                </div>
                <div className="grid-2">
                  <div><label className="input-label">DIAMETER / SIZE</label><input className="input-field" value={form.size} onChange={e => set('size', e.target.value)} placeholder="16mm" /></div>
                  <div><label className="input-label">FLUTES / TEETH</label><input className="input-field" value={form.flutes} onChange={e => set('flutes', e.target.value)} placeholder="5" /></div>
                </div>
                <div><label className="input-label">QUANTITY REQUIRED</label><input className="input-field" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="10" /></div>
                <div>
                  <label className="input-label">TECHNICAL DRAWING / SPEC FILE</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="file" 
                      accept=".dwg,.pdf,.step,.stp,.dxf,.iges,.igs,.stl,.obj" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 50 * 1024 * 1024) {
                            addToast('File must be less than 50MB', 'warning');
                          } else {
                            setFileName(file.name);
                            addToast(`File selected: ${file.name}`);
                          }
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, padding: '8px 12px', background: 'var(--surface)', borderRadius: 4 }}>
                    Selected: <strong>{fileName || 'No file selected'}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>DWG, PDF, STEP, IGES, STL, etc. (max 50MB)</div>
                </div>
                <div><label className="input-label">ADDITIONAL NOTES</label><textarea className="input-field" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Application, tolerances, surface finish requirements..." style={{ resize: 'vertical' }} /></div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: 'center', marginTop: 4 }}>Submit Request →</button>
              </div>
            </form>
          )}
        </div>

        {/* Request list */}
        <div style={{ width: 360 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 14 }}>
            {user?.role === 'admin' ? 'All Requests' : 'My Requests'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {userRequests.length === 0 ? (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No requests yet</div>
            ) : (
              userRequests.map(r => (
                <div key={r.id} className="card" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brand)' }}>CR-{String(r.id).padStart(3,'0')}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{formatDate(r.created_at)}</span>
                    </div>
                    <span className={`badge badge-${getStatusBadge(r.status)}`}>{r.status}</span>
                  </div>
                  {user?.role === 'admin' && r.user_name && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {r.user_name} {r.user_company && `· ${r.user_company}`}
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{r.description.slice(0, 100)}...</p>
                  {r.specs && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {r.specs.split(', ').map(s => <span key={s} className="tag">{s}</span>)}
                    </div>
                  )}
                  {r.file_url && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>📎 {r.file_url}</div>}
                  {user?.role === 'admin' && r.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button className="btn btn-success btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateStatus(r.id, 'Approved')}>Approve</button>
                      <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateStatus(r.id, 'Rejected')}>Reject</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
