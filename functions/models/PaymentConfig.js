const pool = require('../db');

class PaymentConfig {
  constructor(data) {
    this.id = data.id;
    this.razorpay_keyid = data.razorpay_keyid;
    this.razorpay_key_secret = data.razorpay_key_secret;
    this.merchant_name = data.merchant_name;
    this.merchant_logo = data.merchant_logo;
    this.updated_at = data.updated_at;
  }

  // Get config (singleton)
  static async get() {
    const query = 'SELECT * FROM payment_configs LIMIT 1';
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      // Create default
      return await this.create({
        razorpay_keyid: '',
        razorpay_key_secret: '',
        merchant_name: 'IDEAZONE 3D',
        merchant_logo: ''
      });
    }
    return new PaymentConfig(result.rows[0]);
  }

  // Create config
  static async create(configData) {
    const { razorpay_keyid, razorpay_key_secret, merchant_name = 'IDEAZONE 3D', merchant_logo = '' } = configData;

    const query = `
      INSERT INTO payment_configs (razorpay_keyid, razorpay_key_secret, merchant_name, merchant_logo)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [razorpay_keyid, razorpay_key_secret, merchant_name, merchant_logo];

    const result = await pool.query(query, values);
    return new PaymentConfig(result.rows[0]);
  }

  // Update config
  static async update(configData) {
    const { razorpay_keyid, razorpay_key_secret, merchant_name, merchant_logo } = configData;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (razorpay_keyid !== undefined) {
      fields.push(`razorpay_keyid = $${paramIndex}`);
      values.push(razorpay_keyid);
      paramIndex++;
    }

    if (razorpay_key_secret !== undefined) {
      fields.push(`razorpay_key_secret = $${paramIndex}`);
      values.push(razorpay_key_secret);
      paramIndex++;
    }

    if (merchant_name !== undefined) {
      fields.push(`merchant_name = $${paramIndex}`);
      values.push(merchant_name);
      paramIndex++;
    }

    if (merchant_logo !== undefined) {
      fields.push(`merchant_logo = $${paramIndex}`);
      values.push(merchant_logo);
      paramIndex++;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE payment_configs
      SET ${fields.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    return new PaymentConfig(result.rows[0]);
  }
}

module.exports = PaymentConfig;
