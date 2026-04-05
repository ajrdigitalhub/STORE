const pool = require('../db');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'customer';
    this.phone = data.phone;
    this.address = data.address;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Hash password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  // Compare password
  async comparePassword(candidatePassword) {
    console.log("comparePassword",candidatePassword,this.password);
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Convert to JSON without password
  toJSON() {
    const user = { ...this };
    delete user.password;
    return user;
  }

  // Create new user
  static async create(userData) {
    const { name, email, password, role = 'customer', phone, address } = userData;
    const hashedPassword = await this.hashPassword(password);

    const query = `
      INSERT INTO users (name, email, password, role, phone, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [name, email, hashedPassword, role, phone, JSON.stringify(address)];

    try {
      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // unique violation
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  // Find by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    console.log("emailll",result);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Find by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Find all users with pagination and search
  static async findAll({ page = 1, limit = 10, search = '' } = {}) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      countQuery += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, search ? [`%${search}%`] : [])
    ]);

    return {
      users: usersResult.rows.map(row => new User(row)),
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  // Count users
  static async count() {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count);
  }

  // Update user
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (key === 'password') {
        // Hash password if updating
        fields.push(`password = $${paramIndex}`);
        values.push(updateData[key]); // Assume already hashed
        paramIndex++;
      } else if (key === 'address') {
        fields.push(`address = $${paramIndex}`);
        values.push(JSON.stringify(updateData[key]));
        paramIndex++;
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Delete user
  static async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }
}

module.exports = User;
