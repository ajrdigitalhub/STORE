const pool = require('../db');

class Config {
  static async get(key) {
    const query = 'SELECT value FROM config WHERE key = $1';
    const result = await pool.query(query, [key]);
    if (result.rows.length === 0) return null;
    return result.rows[0].value;
  }

  static async set(key, value) {
    const query = `
      INSERT INTO config (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key)
      DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [key, JSON.stringify(value)]);
    return result.rows[0].value;
  }

  static async delete(key) {
    const query = 'DELETE FROM config WHERE key = $1 RETURNING *';
    const result = await pool.query(query, [key]);
    return result.rows.length > 0;
  }
}

module.exports = Config;
