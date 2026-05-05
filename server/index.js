require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.get("/", (req, res) => {
  res.send("API is running");
});

// ─── Middleware ───────────────────────────────────────────
// app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// ─── Middleware ───────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,       // your Vercel URL
  'http://localhost:5173'       // local dev
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/products',        require('./routes/products'));
app.use('/api/orders',          require('./routes/orders'));
app.use('/api/custom-requests', require('./routes/customRequests'));
app.use('/api/messages',        require('./routes/messages'));
app.use('/api/users',           require('./routes/users'));

// ─── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── 404 ─────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.path} not found` }));

// ─── Error handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✓ CutPro API running on http://localhost:${PORT}`));
