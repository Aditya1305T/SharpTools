const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const sendEmail = require("../utils/mailer");

function makeInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, initials: user.initials, company: user.company },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  const { name, email, password, company } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const hashed = await bcrypt.hash(password, 10);
    const initials = makeInitials(name);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const upsert = await pool.query(
      `INSERT INTO pending_registrations (name,email,password,otp_hash,company,initials,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, password=EXCLUDED.password, otp_hash=EXCLUDED.otp_hash, company=EXCLUDED.company, initials=EXCLUDED.initials, expires_at=EXCLUDED.expires_at
       RETURNING id`,
      [name, email, hashed, otpHash, company || null, initials, expiresAt]
    );

    // send OTP email (uses env-based SMTP credentials)
    try {
      await sendEmail(email, otp);
    } catch (mailErr) {
      console.error('Failed to send OTP email:', mailErr);
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.status(202).json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
}

async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and otp are required' });

  try {
    const pending = await pool.query('SELECT * FROM pending_registrations WHERE email=$1', [email]);
    if (!pending.rows.length) return res.status(404).json({ error: 'No pending registration for this email' });

    const row = pending.rows[0];
    if (new Date(row.expires_at) < new Date()) {
      await pool.query('DELETE FROM pending_registrations WHERE email=$1', [email]);
      return res.status(410).json({ error: 'OTP expired' });
    }

    const match = await bcrypt.compare(otp, row.otp_hash);
    if (!match) return res.status(401).json({ error: 'Invalid OTP' });

    // create user
    const insert = await pool.query(
      'INSERT INTO users (name,email,password,role,company,initials) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,name,email,role,company,initials',
      [row.name, row.email, row.password, 'customer', row.company || null, row.initials]
    );
    const user = insert.rows[0];

    // remove pending registration
    await pool.query('DELETE FROM pending_registrations WHERE email=$1', [email]);

    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await pool.query(
      'SELECT id,name,email,password,role,company,initials FROM users WHERE email=$1',
      [email]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...safeUser } = user;
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
}

async function getMe(req, res) {
  try {
    const result = await pool.query(
      'SELECT id,name,email,role,company,initials,created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { register, login, getMe, verifyOtp };
