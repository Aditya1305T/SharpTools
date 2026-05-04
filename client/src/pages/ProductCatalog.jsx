import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { productService } from '../services/api';
import Modal from '../components/Modal';

const CATEGORIES = ['All', 'End Mills', 'Drill Bits', 'Saw Blades', 'Face Mills', 'Reamers', 'Taps', 'Inserts', 'Grinding'];

function formatPrice(p) { return '₹' + Number(p).toFixed(2); }

export default function ProductCatalog() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [detail, setDetail] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  async function loadProducts() {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (catFilter !== 'All') params.category = catFilter;
      const data = await productService.getAll(params);
      setProducts(data);
    } catch {
      addToast('Failed to load products', 'warning');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, [search, catFilter]);

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this product?')) return;
    try {
      await productService.remove(id);
      addToast('Product deleted', 'warning');
      loadProducts();
    } catch { addToast('Failed to delete product', 'warning'); }
  }

  function handleAddToCart(p, e) {
    e.stopPropagation();
    const attrs = p.attributes || {};
    addToCart({ id: p.id, name: p.name, price: parseFloat(p.price), emoji: p.emoji, image: attrs.image, material: attrs.material, size: attrs.size });
    addToast(`${p.name} added to cart`);
  }

  return (
    <div className="page-enter" style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Product Catalog</h1>
          <p className="section-subtitle">{products.length} products available</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar" style={{ width: 280 }}>
            <input placeholder="Search tools, materials..." value={search} onChange={e => setSearch(e.target.value)} />
            <button>🔍</button>
          </div>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Product</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`filter-chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><h3>Loading products...</h3></div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🔍</div><h3>No products found</h3><p>Try adjusting your search or filters</p></div>
      ) : (
        <div className="grid grid-4">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              isAdmin={user?.role === 'admin'}
              onClick={() => setDetail(p)}
              onAddToCart={e => handleAddToCart(p, e)}
              onEdit={e => { e.stopPropagation(); setEditProduct(p); }}
              onDelete={e => handleDelete(p.id, e)}
            />
          ))}
        </div>
      )}

      {detail && <ProductDetailModal product={detail} onClose={() => setDetail(null)} />}
      {showAdd && <ProductFormModal onClose={() => { setShowAdd(false); loadProducts(); }} />}
      {editProduct && <ProductFormModal product={editProduct} onClose={() => { setEditProduct(null); loadProducts(); }} />}
    </div>
  );
}

function ProductCard({ product: p, isAdmin, onClick, onAddToCart, onEdit, onDelete }) {
  const attrs = p.attributes || {};
  const hasImage = attrs.image && attrs.image.startsWith('data:');
  
  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-img">
        {hasImage ? (
          <img src={attrs.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 64 }}>{p.emoji}</span>
        )}
      </div>
      <div className="product-body">
        <div className="product-name">{p.name}</div>
        <div className="product-attrs">
          {attrs.material && <span className="tag">{attrs.material}</span>}
          {attrs.size     && <span className="tag">{attrs.size}</span>}
          {attrs.type     && <span className="tag">{attrs.type}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="product-price">{formatPrice(p.price)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>★ {p.rating}</div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={onAddToCart}>Add to Cart</button>
          {isAdmin && <>
            <button className="btn btn-outline btn-sm" onClick={onEdit}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={onDelete}>✕</button>
          </>}
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product: p, onClose }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [qty, setQty] = useState(1);
  const attrs = p.attributes || {};
  const hasImage = attrs.image && attrs.image.startsWith('data:');

  function handleAdd() {
    addToCart({ id: p.id, name: p.name, price: parseFloat(p.price), emoji: p.emoji, image: attrs.image, material: attrs.material, size: attrs.size }, qty);
    addToast(`${p.name} added to cart`);
    onClose();
  }

  return (
    <Modal title="" onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 28 }}>
        <div style={{ width: 200, height: 200, background: 'var(--surface)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, flexShrink: 0, overflow: 'hidden' }}>
          {hasImage ? (
            <img src={attrs.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            p.emoji
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 4 }}>{p.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Category: <strong>{p.category}</strong></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {[['Material', attrs.material], ['Size', attrs.size], ['Type', attrs.type]].filter(([,v]) => v).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--surface)', borderRadius: 8, padding: '6px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{v}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{p.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#F5A623', fontSize: 14 }}>{'★'.repeat(Math.floor(p.rating))}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.rating} ({p.reviews} reviews)</span>
          </div>
          <div style={{ fontSize: 13, color: p.stock > 20 ? 'var(--success)' : 'var(--warning)' }}>
            {p.stock > 20 ? '✓ In Stock' : `⚠ Only ${p.stock} left`} — {p.stock} units
          </div>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--brand)' }}>{formatPrice(p.price)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span style={{ width: 32, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>Add to Cart</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ProductFormModal({ product, onClose }) {
  const { addToast } = useToast();
  const attrs = product?.attributes || {};
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price || '',
    emoji: product?.emoji || '🔩',
    category: product?.category || 'End Mills',
    description: product?.description || '',
    material: attrs.material || '',
    size: attrs.size || '',
    type: attrs.type || '',
    stock: product?.stock || 50,
    rating: product?.rating || 4.5,
    reviews: product?.reviews || 0,
    image: attrs.image || '',
  });

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addToast('Image must be less than 5MB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (evt) => {
      set('image', evt.target?.result);
      addToast('Image uploaded');
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    const payload = {
      name: form.name, price: parseFloat(form.price), emoji: form.emoji,
      category: form.category, description: form.description,
      attributes: { material: form.material, size: form.size, type: form.type, image: form.image },
      stock: parseInt(form.stock), rating: parseFloat(form.rating), reviews: parseInt(form.reviews),
    };
    try {
      if (product) {
        await productService.update(product.id, payload);
        addToast('Product updated');
      } else {
        await productService.create(payload);
        addToast('Product added');
      }
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save product', 'warning');
    }
  }

  return (
    <Modal title={product ? 'Edit Product' : 'Add New Product'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="grid-2">
          <div><label className="input-label">PRODUCT NAME</label><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div><label className="input-label">PRICE (₹)</label><input className="input-field" type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} /></div>
        </div>
        <div className="grid-2">
          <div>
            <label className="input-label">CATEGORY</label>
            <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="input-label">MATERIAL</label><input className="input-field" value={form.material} onChange={e => set('material', e.target.value)} /></div>
        </div>
        <div className="grid-2">
          <div><label className="input-label">SIZE</label><input className="input-field" value={form.size} onChange={e => set('size', e.target.value)} /></div>
          <div><label className="input-label">TYPE</label><input className="input-field" value={form.type} onChange={e => set('type', e.target.value)} /></div>
        </div>
        <div className="grid-2">
          <div><label className="input-label">STOCK</label><input className="input-field" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} /></div>
          <div><label className="input-label">EMOJI ICON</label><input className="input-field" value={form.emoji} onChange={e => set('emoji', e.target.value)} /></div>
        </div>
        <div>
          <label className="input-label">PRODUCT IMAGE</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1 }} />
            {form.image && <div style={{ width: 50, height: 50, borderRadius: 4, backgroundImage: `url(${form.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG, WebP (max 5MB). Leave blank to use emoji.</div>
        </div>
        <div><label className="input-label">DESCRIPTION</label><textarea className="input-field" rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>{product ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </div>
    </Modal>
  );
}
