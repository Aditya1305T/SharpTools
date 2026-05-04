const pool = require('../config/db');

async function getOrders(req, res) {
  try {
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin
      ? `SELECT o.*, u.name as user_name, u.email as user_email,
           json_agg(json_build_object('id',oi.id,'product_id',oi.product_id,'name',oi.name,'quantity',oi.quantity,'price',oi.price)) as items
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         LEFT JOIN order_items oi ON o.id = oi.order_id
         GROUP BY o.id, u.name, u.email
         ORDER BY o.created_at DESC`
      : `SELECT o.*,
           json_agg(json_build_object('id',oi.id,'product_id',oi.product_id,'name',oi.name,'quantity',oi.quantity,'price',oi.price)) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.user_id = $1
         GROUP BY o.id
         ORDER BY o.created_at DESC`;

    const result = isAdmin
      ? await pool.query(query)
      : await pool.query(query, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createOrder(req, res) {
  const { items } = req.body; // [{ productId, name, quantity, price }]
  if (!items || !items.length) return res.status(400).json({ error: 'Order items are required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, status, total) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, 'Pending', total.toFixed(2)]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES ($1,$2,$3,$4,$5)',
        [order.id, item.productId, item.name, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ...order, items });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const result = await pool.query(
      'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getOrders, createOrder, updateOrderStatus };
