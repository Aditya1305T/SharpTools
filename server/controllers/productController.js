const pool = require('../config/db');

async function getAll(req, res) {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR category ILIKE $${params.length} OR attributes::text ILIKE $${params.length})`;
    }
    if (category && category !== 'All') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    query += ' ORDER BY id ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getAll products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getOne(req, res) {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function create(req, res) {
  const { name, price, emoji, category, description, attributes, stock, rating, reviews } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  try {
    const result = await pool.query(
      `INSERT INTO products (name,price,emoji,category,description,attributes,stock,rating,reviews)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, price, emoji || '🔩', category, description, JSON.stringify(attributes || {}), stock || 0, rating || 4.5, reviews || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('create product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function update(req, res) {
  const { name, price, emoji, category, description, attributes, stock, rating, reviews } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1,price=$2,emoji=$3,category=$4,description=$5,
       attributes=$6,stock=$7,rating=$8,reviews=$9 WHERE id=$10 RETURNING *`,
      [name, price, emoji, category, description, JSON.stringify(attributes || {}), stock, rating, reviews, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function remove(req, res) {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAll, getOne, create, update, remove };
