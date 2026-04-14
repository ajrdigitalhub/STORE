const pool = require('../db');

class Product {
  constructor(data) {
    console.log('Product constructor data:', JSON.stringify(data, null, 2));
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = parseFloat(data.price);
    this.compare_price = data.compare_price ? parseFloat(data.compare_price) : null;
    this.category_id = data.category_id;
    this.images = data.images || [];
    this.stock = parseInt(data.stock) || 0;
    this.variants = data.variants || [];
    this.specification = data.specification || {};
    this.tags = data.tags || [];
    this.rating = parseFloat(data.rating) || 0;
    this.reviews_count = parseInt(data.reviews_count) || 0;
    this.featured = data.featured || false;
    this.active = data.active !== false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new product
  static async create(productData) {
    const { 
      name, description, price, compare_price, images = [], 
      stock = 0, variants = [], featured = false, active = true,
      specification = {}, tags = [], category_id
    } = productData;

    const query = `
      INSERT INTO products (
        name, description, price, compare_price, images, 
        stock, variants, featured, active, specification, tags, category_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      name, description, price, compare_price, JSON.stringify(images), 
      stock, JSON.stringify(variants), featured, active, 
      JSON.stringify(specification), JSON.stringify(tags), category_id
    ];

    const result = await pool.query(query, values);
    return new Product(result.rows[0]);
  }

  // Find by ID with category
  static async findById(id) {
    const query = `
      SELECT p.*, c.name as category_name, c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.active = true
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return new Product(result.rows[0]);
  }

  // Find all with filters and pagination
  static async findAll({ page = 1, limit = 12, search = '', category = '', minPrice, maxPrice, featured, sort = 'created_at', order = 'desc' } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = true
    `;
    let countQuery = `
      SELECT COUNT(*) FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = true
    `;
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      countQuery += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND c.name ILIKE $${paramIndex}`;
      countQuery += ` AND EXISTS (SELECT 1 FROM categories WHERE id = p.category_id AND name ILIKE $${paramIndex})`;
      values.push(`%${category}%`);
      paramIndex++;
    }

    if (minPrice !== undefined) {
      query += ` AND p.price >= $${paramIndex}`;
      countQuery += ` AND p.price >= $${paramIndex}`;
      values.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      query += ` AND p.price <= $${paramIndex}`;
      countQuery += ` AND p.price <= $${paramIndex}`;
      values.push(maxPrice);
      paramIndex++;
    }

    if (featured !== undefined) {
      query += ` AND p.featured = $${paramIndex}`;
      countQuery += ` AND p.featured = $${paramIndex}`;
      values.push(featured);
      paramIndex++;
    }

    const sortColumn = sort === 'price' ? 'p.price' : 'p.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const [productsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2))
    ]);

    return {
      products: productsResult.rows.map(row => new Product(row)),
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  // Update product
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (['images', 'variants', 'specification', 'tags'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
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
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    return new Product(result.rows[0]);
  }

  // Delete product
  static async delete(id) {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }

  // Update stock
  static async updateStock(id, quantity) {
    const query = `
      UPDATE products
      SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [quantity, id]);
    if (result.rows.length === 0) return null;
    return new Product(result.rows[0]);
  }

  // Get featured products
  static async getFeatured(limit = 8) {
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = true AND p.featured = true
      ORDER BY p.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => new Product(row));
  }
}

module.exports = Product;
