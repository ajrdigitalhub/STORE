const pool = require('../db');

class Chat {
  constructor(data) {
    this.id = data.id;
    this.customerid = data.customerid;
    this.customer_name = data.customer_name;
    this.messages = data.messages || [];
    this.last_message = data.last_message;
    this.last_message_at = data.last_message_at;
    this.is_active = data.is_active !== false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new chat
  static async create(chatData) {
    const { customerid, customer_name, messages = [] } = chatData;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1].text : '';
    const lastMessageAt = messages.length > 0 ? new Date() : new Date();

    const query = `
      INSERT INTO chats (customerid, customer_name, messages, last_message, last_message_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [customerid, customer_name, JSON.stringify(messages), lastMessage, lastMessageAt];

    const result = await pool.query(query, values);
    return new Chat(result.rows[0]);
  }

  // Find by customer ID
  static async findByCustomer(customerId) {
    const query = 'SELECT * FROM chats WHERE customerid = $1';
    const result = await pool.query(query, [customerId]);
    if (result.rows.length === 0) return null;
    return new Chat(result.rows[0]);
  }

  // Find all active chats
  static async findAllActive() {
    const query = `
      SELECT * FROM chats
      WHERE is_active = true
      ORDER BY last_message_at DESC
    `;
    const result = await pool.query(query);
    return result.rows.map(row => new Chat(row));
  }

  // Add message to chat
  static async addMessage(chatId, message) {
    const query = `
      UPDATE chats
      SET messages = messages || $1::jsonb,
          last_message = $2,
          last_message_at = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const messageJson = JSON.stringify([message]);
    const values = [messageJson, message.text, new Date(), chatId];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    return new Chat(result.rows[0]);
  }

  // Update chat status
  static async updateStatus(chatId, isActive) {
    const query = `
      UPDATE chats
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [isActive, chatId]);
    if (result.rows.length === 0) return null;
    return new Chat(result.rows[0]);
  }

  // Get chat history for customer
  static async getHistory(customerId) {
    const query = 'SELECT * FROM chats WHERE customerid = $1';
    const result = await pool.query(query, [customerId]);
    if (result.rows.length === 0) return null;
    return new Chat(result.rows[0]);
  }
}

module.exports = Chat;
