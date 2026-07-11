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
    this.tutorial_access = data.tutorial_access || false;
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
    const { name, email, password, role = 'customer', phone, address, tutorial_access = false } = userData;
    const hashedPassword = await this.hashPassword(password);

    const query = `
      INSERT INTO users (name, email, password, role, phone, address, tutorial_access)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [name, email, hashedPassword, role, phone, JSON.stringify(address), tutorial_access];

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
  static async findAll({ page = 1, limit = 10, search = '', tutorialIds } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT DISTINCT u.* 
      FROM users u
      LEFT JOIN user_tutorial_access uta ON uta.user_id = u.id
      LEFT JOIN tutorial_product_mappings tpm ON true
      LEFT JOIN orders o ON o.user_id = u.id AND o.payment_status = 'paid'
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) 
      FROM users u
      LEFT JOIN user_tutorial_access uta ON uta.user_id = u.id
      LEFT JOIN tutorial_product_mappings tpm ON true
      LEFT JOIN orders o ON o.user_id = u.id AND o.payment_status = 'paid'
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      countQuery += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (Array.isArray(tutorialIds) && tutorialIds.length > 0) {
      query += ` AND (
        u.role = 'admin' 
        OR u.tutorial_access = true 
        OR uta.tutorial_id = ANY($${paramIndex}::int[])
        OR (
          tpm.tutorial_id = ANY($${paramIndex}::int[]) 
          AND o.items::jsonb @> JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT('product', tpm.product_id))
        )
      )`;
      countQuery += ` AND (
        u.role = 'admin' 
        OR u.tutorial_access = true 
        OR uta.tutorial_id = ANY($${paramIndex}::int[])
        OR (
          tpm.tutorial_id = ANY($${paramIndex}::int[]) 
          AND o.items::jsonb @> JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT('product', tpm.product_id))
        )
      )`;
      values.push(tutorialIds);
      paramIndex++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, paramIndex - 1))
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
