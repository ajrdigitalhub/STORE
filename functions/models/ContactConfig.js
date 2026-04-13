const pool = require('../db');

class ContactConfig {
  constructor(data) {
    this.id = data.id;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
    this.working_hours = data.working_hours;
    this.updated_at = data.updated_at;
  }

  // Get config (singleton)
  static async get() {
    const query = 'SELECT * FROM contact_configs LIMIT 1';
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      // Create default
      return await this.create({
        address: 'Ideazone3D Headquarters, HITEC City, Hyderabad, Telangana, India 500081',
        phone: '+91 99890 13142',
        email: 'ideazone3d@gmail.com',
        working_hours: 'Mon - Sat, 9am - 7pm'
      });
    }
    return new ContactConfig(result.rows[0]);
  }

  // Create config
  static async create(configData) {
    const { address = 'Ideazone3D Headquarters, HITEC City, Hyderabad, Telangana, India 500081', phone = '+91 99890 13142', email = 'ideazone3d@gmail.com', working_hours = 'Mon - Sat, 9am - 7pm' } = configData;

    const query = `
      INSERT INTO contact_configs (address, phone, email, working_hours)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [address, phone, email, working_hours];

    const result = await pool.query(query, values);
    return new ContactConfig(result.rows[0]);
  }

  // Update config
  static async update(configData) {
    const { address, phone, email, working_hours } = configData;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (address !== undefined) {
      fields.push(`address = $${paramIndex}`);
      values.push(address);
      paramIndex++;
    }

    if (phone !== undefined) {
      fields.push(`phone = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }

    if (email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (working_hours !== undefined) {
      fields.push(`working_hours = $${paramIndex}`);
      values.push(working_hours);
      paramIndex++;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE contact_configs
      SET ${fields.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    return new ContactConfig(result.rows[0]);
  }
}

module.exports = ContactConfig;
