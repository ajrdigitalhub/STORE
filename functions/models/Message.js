const pool = require('../db');

class Message {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.subject = data.subject;
    this.message = data.message;
    this.status = data.status || 'new';
    this.created_at = data.created_at;
  }

  // Create new message
  static async create(messageData) {
    const { name, email, subject, message } = messageData;

    const query = `
      INSERT INTO messages (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [name, email, subject, message];

    const result = await pool.query(query, values);
    return new Message(result.rows[0]);
  }

  // Find all messages with pagination
  static async findAll({ page = 1, limit = 10, status } = {}) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM messages WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM messages WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const [messagesResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, status ? [status] : [])
    ]);

    return {
      messages: messagesResult.rows.map(row => new Message(row)),
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  // Find by ID
  static async findById(id) {
    const query = 'SELECT * FROM messages WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return new Message(result.rows[0]);
  }

  // Update status
  static async updateStatus(id, status) {
    const query = `
      UPDATE messages
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    if (result.rows.length === 0) return null;
    return new Message(result.rows[0]);
  }

  // Delete message
  static async delete(id) {
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }
}

module.exports = Message;
