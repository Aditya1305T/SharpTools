const pool = require('../config/db');

async function getAllUsers(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, company, initials, created_at FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    // Prevent deleting the current user
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id=$1', [id]);
    if (!userCheck.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAllUsers, deleteUser };
