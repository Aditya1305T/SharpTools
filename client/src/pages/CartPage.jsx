import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/api';

function CartItemRow({ item, updateQty, removeFromCart }) {
  const [inputVal, setInputVal] = useState(String(item.qty));

  // Keep local draft in sync if qty changes externally (e.g. +/- buttons)
  useEffect(() => { setInputVal(String(item.qty)); }, [item.qty]);

  function handleChange(e) {
    setInputVal(e.target.value); // let user type freely, no clamping yet
  }

  function handleBlur() {
    const n = parseInt(inputVal);
    const valid = !isNaN(n) && n >= 1;
    updateQty(item.id, valid ? n : 1);
    setInputVal(String(valid ? n : 1)); // reset display if invalid
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') e.target.blur(); // commit on Enter
  }

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, background: 'var(--surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, overflow: 'hidden' }}>
          {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{item.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.material} · {item.size}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => updateQty(item.id, item.qty - 1)} style={{ minWidth: 30, padding: '4px 10px', fontSize: 16, lineHeight: 1 }}>−</button>
          <input
            type="number"
            min="1"
            value={inputVal}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: 64,
              textAlign: 'center',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              border: '1.5px solid var(--brand)',
              borderRadius: 6,
              padding: '5px 4px',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            title="Enter quantity directly"
          />
          <button className="btn btn-outline btn-sm" onClick={() => updateQty(item.id, item.qty + 1)} style={{ minWidth: 30, padding: '4px 10px', fontSize: 16, lineHeight: 1 }}>+</button>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, minWidth: 80, textAlign: 'right' }}>{formatPrice(item.price * item.qty)}</div>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeFromCart(item.id)}>✕</button>
      </div>
    </div>
  );
}

function formatPrice(p) { return '₹' + Number(p).toFixed(2); }

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=cart, 1=shipping, 2=review, 3=confirm
  const [shipping, setShipping] = useState({ name: '', address: '', city: '', zip: '', country: 'US' });
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);

  async function placeOrder() {
    setLoading(true);
    try {
      const items = cart.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: parseFloat(i.price) }));
      const order = await orderService.create({ items });
      setOrderId(`ORD-${String(order.id).padStart(3, '0')}`);
      clearCart();
      setStep(3);
      addToast('Order placed successfully!');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to place order', 'warning');
    } finally {
      setLoading(false);
    }
  }

  if (step === 3) {
    return (
      <div className="page-enter" style={{ padding: '60px 32px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, marginBottom: 8 }}>Order Confirmed!</div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
          Order ID: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>{orderId}</strong>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.7 }}>
          Thank you for your order. You'll receive a confirmation shortly. Estimated delivery: 5–7 business days.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/catalog')}>Continue Shopping</button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/dashboard')}>View Dashboard</button>
        </div>
      </div>
    );
  }

  const stepLabels = ['Cart', 'Shipping', 'Review'];

  return (
    <div className="page-enter" style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <h1 className="section-title" style={{ marginBottom: 24 }}>{stepLabels[step]}</h1>


      {/* Stepper */}
      <div style={{ marginBottom: 28 }}>
        <div className="stepper">
          {stepLabels.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < stepLabels.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div className={`step-label ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>{s}</div>
              </div>
              {i < stepLabels.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} style={{ flex: 1 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Cart */}
      {step === 0 && (
        cart.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some products to get started</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/catalog')}>Browse Catalog</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="card">
                {cart.map((item, idx) => (
                  <div key={item.id} style={{ borderBottom: idx < cart.length - 1 ? '1px solid var(--border)' : '' }}>
                    <CartItemRow item={item} updateQty={updateQty} removeFromCart={removeFromCart} />
                  </div>
                ))}
              </div>
            </div>
            <OrderSummary total={cartTotal} onNext={() => setStep(1)} nextLabel="Proceed to Checkout →" />
          </div>
        )
      )}

      {/* St ep 1: Shipping */}
      {/* {step === 1 && (
        <div style={{ maxWidth: 520 }}>
          <div className="card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="input-label">FULL NAME</label><input className="input-field" value={shipping.name} onChange={e => setShipping({ ...shipping, name: e.target.value })} placeholder="John Doe" required /></div>
              <div><label className="input-label">COMPANY ADDRESS</label><input className="input-field" value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })} placeholder="123 Industrial Area" required /></div>
              <div className="grid-2">
                <div><label className="input-label">CITY</label><input className="input-field" value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} placeholder="Delhi" required/></div>
                <div><label className="input-label">ZIP CODE</label><input className="input-field" value={shipping.zip} onChange={e => setShipping({ ...shipping, zip: e.target.value })} placeholder="110067" required/></div>
              </div>
              <div>
                <label className="input-label">COUNTRY</label>
                <select className="input-field" value={shipping.country} onChange={e => setShipping({ ...shipping, country: e.target.value })}>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>Review Order →</button>
            </div>
          </div>
        </div>
      )} */}

      {step === 1 && (
      <form
        style={{ maxWidth: 520 }}
        onSubmit={(e) => {
          e.preventDefault();
          setStep(2);
        }}
      >
        <div className="card" style={{ padding: '24px 28px' }}>
          <div><label className="input-label">FULL NAME</label><input className="input-field" value={shipping.name} onChange={e => setShipping({ ...shipping, name: e.target.value })} placeholder="John Doe" required /></div>
              <div><label className="input-label">COMPANY ADDRESS</label><input className="input-field" value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })} placeholder="123 Industrial Area" required /></div>
              <div className="grid-2">
                <div><label className="input-label">CITY</label><input className="input-field" value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} placeholder="Delhi" required/></div>
                <div><label className="input-label">ZIP CODE</label><input className="input-field" value={shipping.zip} onChange={e => setShipping({ ...shipping, zip: e.target.value })} placeholder="110067" required/></div>
              </div>
              <div>
                <label className="input-label">COUNTRY</label>
                <select className="input-field" value={shipping.country} onChange={e => setShipping({ ...shipping, country: e.target.value })}>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
          
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStep(0)}
            >
              ← Back
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Review Order →
            </button>
          </div>
        </div>
      </form>
    )}


      {/* Step 2: Review */}
      {step === 2 && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div className="card" style={{ flex: 1, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Items</div>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <span>{item.name} × {item.qty}</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Shipping To</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.7 }}>
              {shipping.name}<br />{shipping.address}<br />{shipping.city} {shipping.zip}, {shipping.country}
            </div>
          </div>
          <div style={{ width: 280 }}>
            <div className="card" style={{ padding: '20px 24px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 14 }}>Total</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--brand)', marginBottom: 18 }}>{formatPrice(cartTotal * 1.08)}</div>
              <button className="btn btn-success btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={placeOrder}>
                {loading ? 'Placing...' : '✓ Place Order'}
              </button>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(1)}>← Back</button>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>No real payment is processed.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderSummary({ total, onNext, nextLabel }) {
  const cartCount = useCart().cartCount;
  return (
    <div style={{ width: 280 }}>
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Order Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
          <span style={{ color: 'var(--text-muted)' }}>Subtotal ({cartCount} items)</span>
          <span>{'₹' + Number(total).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
          <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
          <span style={{ color: 'var(--success)' }}>Free</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
          <span style={{ color: 'var(--text-muted)' }}>Tax (8%)</span>
          <span>{'₹' + (total * 0.08).toFixed(2)}</span>
        </div>
        <div className="divider" style={{ margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 18 }}>
          <span>Total</span>
          <span style={{ color: 'var(--brand)' }}>{'₹' + (total * 1.08).toFixed(2)}</span>
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={onNext}>{nextLabel}</button>
      </div>
    </div>
  );
}
