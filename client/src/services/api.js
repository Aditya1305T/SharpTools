import axios from 'axios';

// const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data).then(r => r.data),
  login:    (data) => api.post('/auth/login', data).then(r => r.data),
  me:       ()     => api.get('/auth/me').then(r => r.data),
};

// ─── Products ─────────────────────────────────────────────
export const productService = {
  getAll:  (params) => api.get('/products', { params }).then(r => r.data),
  getOne:  (id)     => api.get(`/products/${id}`).then(r => r.data),
  create:  (data)   => api.post('/products', data).then(r => r.data),
  update:  (id, data) => api.put(`/products/${id}`, data).then(r => r.data),
  remove:  (id)     => api.delete(`/products/${id}`).then(r => r.data),
};

// ─── Orders ───────────────────────────────────────────────
export const orderService = {
  getAll:         ()       => api.get('/orders').then(r => r.data),
  create:         (data)   => api.post('/orders', data).then(r => r.data),
  updateStatus:   (id, status) => api.patch(`/orders/${id}`, { status }).then(r => r.data),
};

// ─── Custom Requests ──────────────────────────────────────
export const customRequestService = {
  getAll:        ()       => api.get('/custom-requests').then(r => r.data),
  create:        (data)   => api.post('/custom-requests', data).then(r => r.data),
  updateStatus:  (id, status) => api.patch(`/custom-requests/${id}`, { status }).then(r => r.data),
};

// ─── Messages ─────────────────────────────────────────────
export const messageService = {
  getAll: ()     => api.get('/messages').then(r => r.data),
  send:   (data) => api.post('/messages', data).then(r => r.data),
};

// ─── Users (admin) ────────────────────────────────────────
export const userService = {
  getAll:   () => api.get('/users').then(r => r.data),
  delete:   (id) => api.delete(`/users/${id}`).then(r => r.data),
};

export default api;
