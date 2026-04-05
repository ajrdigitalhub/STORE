const pool = require('../db');

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
    this.active = data.active !== false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new category
  static async create(categoryData) {
    const { name, description, image, active = true } = categoryData;

    const query = `
      INSERT INTO categories (name, description, image, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [name, description, image, active];

    try {
      const result = await pool.query(query, values);
      return new Category(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // unique violation
        throw new Error('Category name already exists');
      }
      throw error;
    }
  }

  // Find by ID
  static async findById(id) {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return new Category(result.rows[0]);
  }

  // Find all active categories
  static async findAllActive() {
    const query = 'SELECT * FROM categories WHERE active = true ORDER BY name';
    const result = await pool.query(query);
    return result.rows.map(row => new Category(row));
  }

  // Find all with pagination
  static async findAll({ page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM categories
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = 'SELECT COUNT(*) FROM categories';

    const [categoriesResult, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);

    return {
      categories: categoriesResult.rows.map(row => new Category(row)),
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  // Update category
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(updateData[key]);
      paramIndex++;
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE categories
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return null;
      return new Category(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Category name already exists');
      }
      throw error;
    }
  }

  // Delete category
  static async delete(id) {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }
}

module.exports = Category;
