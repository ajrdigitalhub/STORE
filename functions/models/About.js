const pool = require('../db');

class About {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.subtitle = data.subtitle;
    this.description = data.description;
    this.mission = data.mission;
    this.vision = data.vision;
    this.last_updated = data.last_updated;
  }

  // Get about (singleton)
  static async get() {
    const query = 'SELECT * FROM abouts LIMIT 1';
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      // Create default
      return await this.create({
        title: 'About Us',
        subtitle: 'Discover Our Story',
        description: 'Premium products with exceptional craftsmanship.',
        mission: 'To provide high-quality products that inspire.',
        vision: 'To be the leading choice for premium lifestyle products.'
      });
    }
    return new About(result.rows[0]);
  }

  // Create about
  static async create(aboutData) {
    const { title = 'About Us', subtitle = 'Discover Our Story', description = 'Premium products with exceptional craftsmanship.', mission = 'To provide high-quality products that inspire.', vision = 'To be the leading choice for premium lifestyle products.' } = aboutData;

    const query = `
      INSERT INTO abouts (title, subtitle, description, mission, vision)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [title, subtitle, description, mission, vision];

    const result = await pool.query(query, values);
    return new About(result.rows[0]);
  }

  // Update about
  static async update(aboutData) {
    const { title, subtitle, description, mission, vision } = aboutData;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      fields.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (subtitle !== undefined) {
      fields.push(`subtitle = $${paramIndex}`);
      values.push(subtitle);
      paramIndex++;
    }

    if (description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (mission !== undefined) {
      fields.push(`mission = $${paramIndex}`);
      values.push(mission);
      paramIndex++;
    }

    if (vision !== undefined) {
      fields.push(`vision = $${paramIndex}`);
      values.push(vision);
      paramIndex++;
    }

    fields.push(`last_updated = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE abouts
      SET ${fields.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    return new About(result.rows[0]);
  }
}

module.exports = About;
