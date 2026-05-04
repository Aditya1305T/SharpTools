export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: wide ? 720 : 560 }}>
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
