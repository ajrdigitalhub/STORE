import pg from 'pg';
const { Pool, types } = pg;
import dotenv from 'dotenv';

dotenv.config();

// The 'pg' driver returns NUMERIC types (OID 1700) as strings to avoid
// precision loss with very large numbers. For this application's purposes,
// parsing them as JavaScript numbers (floats) is safe and aligns with the
// frontend's data models, preventing `toFixed is not a function` errors.
types.setTypeParser(1700, (val) => {
  return val === null ? null : parseFloat(val);
});

const poolConfig = {
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false
};

if (process.env['DATABASE_URL']) {
  poolConfig.connectionString = process.env['DATABASE_URL'];
} else {
  poolConfig.user = process.env['PG_USER'];
  poolConfig.host = process.env['PG_HOST'];
  poolConfig.database = process.env['PG_DATABASE'];
  poolConfig.password = process.env['PG_PASSWORD'];
  poolConfig.port = process.env['PG_PORT'] ? parseInt(process.env['PG_PORT']) : 5432;
}

const pool = new Pool(poolConfig);

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

export { pool };

export default pool;
