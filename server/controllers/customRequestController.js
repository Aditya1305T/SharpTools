const pool = require('../config/db');

async function getCustomRequests(req, res) {
  try {
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin
      ? `SELECT cr.*, u.name as user_name, u.email as user_email, u.company as user_company
         FROM custom_requests cr LEFT JOIN users u ON cr.user_id = u.id
         ORDER BY cr.created_at DESC`
      : `SELECT * FROM custom_requests WHERE user_id=$1 ORDER BY created_at DESC`;

    const result = isAdmin
      ? await pool.query(query)
      : await pool.query(query, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error('getCustomRequests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createCustomRequest(req, res) {
  const { description, specs, file_url } = req.body;
  if (!description) return res.status(400).json({ error: 'Description is required' });
  try {
    const result = await pool.query(
      'INSERT INTO custom_requests (user_id, description, specs, file_url, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, description, specs || '', file_url || null, 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createCustomRequest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateRequestStatus(req, res) {
  const { status } = req.body;
  if (!['Pending', 'Approved', 'Rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  try {
    const result = await pool.query(
      'UPDATE custom_requests SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getCustomRequests, createCustomRequest, updateRequestStatus };
