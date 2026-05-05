
const { Pool } = require('pg');
require('dotenv').config();

let connectionString;

if (process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL;
} else {
  const password = (process.env.DB_PASSWORD || '').replace(/#/g, '%23');
  connectionString = `postgresql://${process.env.DB_USER || 'postgres'}:${password}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'cutpro'}`;
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;


