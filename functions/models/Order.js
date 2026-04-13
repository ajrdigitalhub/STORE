const pool = require('../db');

class Order {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id || data.userid; // Handle both for backward compatibility
    this.items = data.items || [];
    this.total_amount = parseFloat(data.total_amount);
    this.shipping_address = data.shipping_address;
    this.payment_method = data.payment_method;
    this.payment_status = data.payment_status;
    this.order_status = data.order_status;
    this.razorpay_orderid = data.razorpay_orderid;
    this.razorpay_paymentid = data.razorpay_paymentid;
    this.razorpay_signature = data.razorpay_signature;
    this.order_number = data.order_number;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Generate unique order number
  static async generateOrderNumber() {
    let isUnique = false;
    let orderNumber = '';

    while (!isUnique) {
      const num = Math.floor(100000 + Math.random() * 900000);
      orderNumber = `ORD-${num}`;
      const result = await pool.query('SELECT 1 FROM orders WHERE order_number = $1', [orderNumber]);
      if (result.rows.length === 0) isUnique = true;
    }

    return orderNumber;
  }

  // Create new order with stock validation and deduction
  static async create(orderData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { user_id, userid, items, total_amount, shipping_address, payment_method } = orderData;
      const finalUserId = user_id || userid;

      console.log('Order.create - items:', JSON.stringify(items, null, 2));

      if (!payment_method) {
        throw new Error('Payment method is required');
      }

      // Validate stock for all items
      for (const item of items) {
        if (!item.product) {
          console.error('Order.create - Item missing product ID:', JSON.stringify(item, null, 2));
          throw new Error(`Order item is missing a valid product ID. Item: ${JSON.stringify(item)}`);
        }

        console.log('Validating item:', JSON.stringify(item, null, 2));
        const productResult = await client.query('SELECT stock FROM products WHERE id = $1 AND active = true', [item.product]);
        if (productResult.rows.length === 0) {
          throw new Error(`Product with ID ${item.product} not found or is inactive`);
        }
        if (productResult.rows[0].stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product}`);
        }
      }

      // Deduct stock
      for (const item of items) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product]);
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const query = `
        INSERT INTO orders (user_id, items, total_amount, shipping_address, payment_method, order_number)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [finalUserId, JSON.stringify(items), total_amount, JSON.stringify(shipping_address), payment_method, orderNumber];

      const result = await client.query(query, values);

      await client.query('COMMIT');

      return new Order(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Find by ID with user details
  static async findById(id) {
    const query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return new Order(result.rows[0]);
  }

  // Find by order number
  static async findByOrderNumber(orderNumber) {
    const query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.order_number = $1
    `;
    const result = await pool.query(query, [orderNumber]);
    if (result.rows.length === 0) return null;
    return new Order(result.rows[0]);
  }

  // Find orders by user
  static async findByUser(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countQuery = 'SELECT COUNT(*) FROM orders WHERE user_id = $1';

    const [ordersResult, countResult] = await Promise.all([
      pool.query(query, [userId, limit, offset]),
      pool.query(countQuery, [userId])
    ]);

    return {
      orders: ordersResult.rows.map(row => new Order(row)),
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  // Find all orders (admin)
  static async findAll({ page = 1, limit = 10, status, paymentStatus } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) FROM orders o WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND o.order_status = $${paramIndex}`;
      countQuery += ` AND o.order_status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (paymentStatus) {
      query += ` AND o.payment_status = $${paramIndex}`;
      countQuery += ` AND o.payment_status = $${paramIndex}`;
      values.push(paymentStatus);
      paramIndex++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const [ordersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2))
    ]);

    return {
      orders: ordersResult.rows.map(row => new Order(row)),
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  // Update order status
  static async updateStatus(id, { orderStatus, paymentStatus }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // If cancelling order, restore stock
      if (orderStatus === 'cancelled' && order.order_status !== 'cancelled') {
        for (const item of order.items) {
          await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product]);
        }
      }

      // If delivering COD order, set payment to paid
      let finalPaymentStatus = paymentStatus;
      if (orderStatus === 'delivered' && order.payment_method === 'cod' && order.payment_status === 'pending') {
        finalPaymentStatus = 'paid';
      }

      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (orderStatus) {
        fields.push(`order_status = $${paramIndex}`);
        values.push(orderStatus);
        paramIndex++;
      }

      if (finalPaymentStatus) {
        fields.push(`payment_status = $${paramIndex}`);
        values.push(finalPaymentStatus);
        paramIndex++;
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE orders
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      values.push(id);

      const result = await client.query(query, values);

      await client.query('COMMIT');

      return new Order(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update payment details
  static async updatePayment(id, paymentData) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentStatus } = paymentData;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (razorpayOrderId) {
      fields.push(`razorpay_orderid = $${paramIndex}`);
      values.push(razorpayOrderId);
      paramIndex++;
    }

    if (razorpayPaymentId) {
      fields.push(`razorpay_paymentid = $${paramIndex}`);
      values.push(razorpayPaymentId);
      paramIndex++;
    }

    if (razorpaySignature) {
      fields.push(`razorpay_signature = $${paramIndex}`);
      values.push(razorpaySignature);
      paramIndex++;
    }

    if (paymentStatus) {
      fields.push(`payment_status = $${paramIndex}`);
      values.push(paymentStatus);
      paramIndex++;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE orders
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    return new Order(result.rows[0]);
  }

  // Get dashboard stats
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE order_status = 'pending') as pending_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) as total_revenue,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_orders
      FROM orders
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get recent orders
  static async getRecent(limit = 5) {
    const query = `
      SELECT o.*, u.name as user_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => new Order(row));
  }
}

module.exports = Order;
