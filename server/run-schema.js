const pool = require('./db');
const fs = require('fs');
const path = require('path');

const runSchema = async () => {
  try {
    console.log('Running schema.sql...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Execute the entire schema
    await pool.query(schemaSQL);

    console.log('Schema executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running schema:', error);
    process.exit(1);
  }
};

runSchema();

runSchema();