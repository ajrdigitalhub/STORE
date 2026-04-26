const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Sanitize hostname to avoid EAI_AGAIN for known placeholder/invalid values
let dbHost = process.env.PG_HOST;
if (dbHost === 'hggfh' || !dbHost) {
  console.warn(`Invalid PG_HOST "${dbHost}" detected. Falling back to localhost.`);
  dbHost = 'localhost';
}

const pool = new Pool({
  user: process.env.PG_USER,
  host: dbHost,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('CRITICAL: Database connection failed. Is PostgreSQL running at', dbHost + ':' + (process.env.PG_PORT || 5432) + '?');
    console.error('Error detail:', err.message);
  } else {
    console.log('Successfully connected to the database at', dbHost);

    // Migration: Add gst_amount and shipping_charge if they don't exist
    client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10,2) DEFAULT 0;
    `).then(() => {
      console.log('Database migration successful: added gst_amount and shipping_charge columns');
      release();
    }).catch(migrationErr => {
      console.error('Database migration failed:', migrationErr.message);
      release();
    });
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
