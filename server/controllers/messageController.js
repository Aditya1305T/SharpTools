const pool = require('../config/db');

async function getMessages(req, res) {
  try {
    const isAdmin = req.user.role === 'admin';
    // Admin sees all messages; customer sees their own thread
    const query = isAdmin
      ? `SELECT m.*, 
           s.name as sender_name, s.initials as sender_initials, s.role as sender_role,
           r.name as receiver_name
         FROM messages m
         LEFT JOIN users s ON m.sender_id = s.id
         LEFT JOIN users r ON m.receiver_id = r.id
         ORDER BY m.created_at ASC`
      : `SELECT m.*,
           s.name as sender_name, s.initials as sender_initials, s.role as sender_role,
           r.name as receiver_name
         FROM messages m
         LEFT JOIN users s ON m.sender_id = s.id
         LEFT JOIN users r ON m.receiver_id = r.id
         WHERE m.sender_id=$1 OR m.receiver_id=$1
         ORDER BY m.created_at ASC`;

    const result = isAdmin
      ? await pool.query(query)
      : await pool.query(query, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function sendMessage(req, res) {
  const { content, receiver_id } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

  try {
    let recipientId = receiver_id;
    // If sender is customer and no receiver specified, find admin
    if (!recipientId && req.user.role !== 'admin') {
      const admin = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
      if (!admin.rows.length) return res.status(404).json({ error: 'No admin found' });
      recipientId = admin.rows[0].id;
    }

    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, recipientId, content.trim()]
    );

    const msg = result.rows[0];
    // Fetch joined data
    const full = await pool.query(
      `SELECT m.*, s.name as sender_name, s.initials as sender_initials, s.role as sender_role
       FROM messages m LEFT JOIN users s ON m.sender_id=s.id WHERE m.id=$1`,
      [msg.id]
    );
    res.status(201).json(full.rows[0]);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getMessages, sendMessage };
