-- CutPro Industries — PostgreSQL Schema
-- Run: psql -U postgres -d cutpro -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  company    VARCHAR(150),
  initials   VARCHAR(4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PENDING REGISTRATIONS (OTP) ─────────────────────────
CREATE TABLE IF NOT EXISTS pending_registrations (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  otp_hash   VARCHAR(255) NOT NULL,
  company    VARCHAR(150),
  initials   VARCHAR(4),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  emoji       VARCHAR(10) DEFAULT '🔩',
  category    VARCHAR(100),
  description TEXT,
  attributes  JSONB DEFAULT '{}',
  stock       INTEGER DEFAULT 0,
  rating      NUMERIC(3,1) DEFAULT 4.5,
  reviews     INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status     VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending','Processing','Shipped','Delivered')),
  total      NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDER ITEMS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name       VARCHAR(200),
  quantity   INTEGER NOT NULL,
  price      NUMERIC(10,2) NOT NULL
);

-- ─── CUSTOM REQUESTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_requests (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  specs       TEXT,
  file_url    VARCHAR(500),
  status      VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MESSAGES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  receiver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEED DATA ───────────────────────────────────────────

-- Admin user (password: password)
INSERT INTO users (name, email, password, role, initials) VALUES
('Admin User', 'admin@cutpro.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'admin', 'AU')
ON CONFLICT (email) DO NOTHING;

-- Customer users (password: password)
INSERT INTO users (name, email, password, role, company, initials) VALUES
('James Whitfield', 'j.whitfield@acmemfg.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'customer', 'Acme Manufacturing', 'JW'),
('Sarah Chen', 's.chen@precisionworks.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'customer', 'Precision Works Inc', 'SC'),
('Marcus Okafor', 'm.okafor@rapidtech.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'customer', 'RapidTech Engineering', 'MO')
ON CONFLICT (email) DO NOTHING;

-- Products
INSERT INTO products (name, price, emoji, category, description, attributes, stock, rating, reviews) VALUES
('TitanCut End Mill', 149.99, '🔩', 'End Mills',
 'High-performance 4-flute carbide end mill for precision milling operations in hardened steel and exotic alloys. TiAlN coating for extended tool life.',
 '{"material":"Carbide","size":"12mm","type":"4-Flute"}', 48, 4.8, 124),
('ProDrill HSS Set', 89.95, '🔧', 'Drill Bits',
 'Professional 25-piece HSS drill bit set with titanium nitride coating. Suitable for wood, metal, and plastic. Industrial grade for demanding workshop environments.',
 '{"material":"HSS","size":"1-13mm","type":"Twist"}', 120, 4.6, 89),
('DiamondEdge Saw Blade', 219.00, '⚙️', 'Saw Blades',
 'Premium diamond-tipped circular saw blade for cutting reinforced concrete, porcelain tiles, and stone. Laser-cut steel body with anti-vibration slots.',
 '{"material":"Diamond","size":"250mm","type":"Circular"}', 32, 4.9, 67),
('CeraMill Face Cutter', 380.00, '🔨', 'Face Mills',
 'High-speed ceramic face milling cutter for machining cast iron and nickel alloys. Features 10 indexable inserts for maximum productivity.',
 '{"material":"Ceramic","size":"80mm","type":"Indexable"}', 15, 4.7, 43),
('MicroCut Reamer Set', 165.50, '🗜️', 'Reamers',
 'Precision adjustable reamer set for achieving tight tolerances in bore finishing. Cobalt content ensures performance in stainless steel and titanium.',
 '{"material":"HSS-Co","size":"6-20mm","type":"Adjustable"}', 27, 4.5, 56),
('TurboTap M3-M20', 75.00, '🔩', 'Taps',
 'Complete thread-forming tap set covering M3 to M20 metric threads. Suitable for blind and through holes. Ground threads for high dimensional accuracy.',
 '{"material":"HSS","size":"M3-M20","type":"Thread"}', 85, 4.4, 98),
('AlloyBore CBN Insert', 290.00, '💎', 'Inserts',
 'Cubic Boron Nitride turning inserts for hard turning hardened steel and cast iron. Replaces grinding for superior surface finish.',
 '{"material":"CBN","size":"CNMG120408","type":"Turning"}', 60, 4.9, 34),
('FlexiGrind Wheel', 55.00, '🌀', 'Grinding',
 'Industrial aluminium oxide grinding wheel for surface and cylindrical grinding. A-grade abrasive for consistent material removal.',
 '{"material":"Alumina","size":"200x25mm","type":"Surface"}', 200, 4.3, 142)
ON CONFLICT DO NOTHING;
