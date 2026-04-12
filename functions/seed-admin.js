require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  try {
    const email = 'admin@ideazone.com';
    const password = await bcrypt.hash('admin123', 10);
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Admin', email, password, 'admin']
      );
      console.log('Admin user seeded successfully.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    pool.end();
  }
}

seedAdmin();
