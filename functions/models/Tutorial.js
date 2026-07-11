const pool = require('../db');

class TutorialCategory {
  static async create({ name, description, display_order = 0 }) {
    const query = `
      INSERT INTO tutorial_categories (name, description, display_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, display_order]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM tutorial_categories ORDER BY display_order ASC, name ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM tutorial_categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async update(id, { name, description, display_order }) {
    const query = `
      UPDATE tutorial_categories
      SET name = $1, description = $2, display_order = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, display_order, id]);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM tutorial_categories WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }

  static async reorder(orders) {
    // orders is an array of { id, display_order }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of orders) {
        await client.query(
          'UPDATE tutorial_categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.display_order, item.id]
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

class Tutorial {
  static async create({
    title, subtitle, description, thumbnail_url, video_url,
    category_id, duration, difficulty, display_order = 0, status = 'draft', resources = [], product_ids = []
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const query = `
        INSERT INTO tutorials (
          title, subtitle, description, thumbnail_url, video_url,
          category_id, duration, difficulty, display_order, status, resources
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const result = await client.query(query, [
        title, subtitle, description, thumbnail_url, video_url,
        category_id || null, duration, difficulty || null, display_order, status,
        JSON.stringify(resources)
      ]);
      const tutorial = result.rows[0];

      // Insert mappings
      if (product_ids && product_ids.length > 0) {
        for (const prodId of product_ids) {
          await client.query(
            'INSERT INTO tutorial_product_mappings (tutorial_id, product_id) VALUES ($1, $2)',
            [tutorial.id, prodId]
          );
        }
      }

      await client.query('COMMIT');
      return { ...tutorial, product_ids };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const query = `
      SELECT t.*, c.name as category_name
      FROM tutorials t
      LEFT JOIN tutorial_categories c ON t.category_id = c.id
      WHERE t.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    const tutorial = result.rows[0];

    // Fetch products mapped
    const mappingsResult = await pool.query(
      'SELECT product_id FROM tutorial_product_mappings WHERE tutorial_id = $1',
      [id]
    );
    tutorial.product_ids = mappingsResult.rows.map(r => r.product_id);
    return tutorial;
  }

  static async findAll({ status, categoryId, search } = {}) {
    let query = `
      SELECT t.*, c.name as category_name
      FROM tutorials t
      LEFT JOIN tutorial_categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND t.category_id = $${paramIndex}`;
      values.push(categoryId);
      paramIndex++;
    }

    if (search) {
      query += ` AND (t.title ILIKE $${paramIndex} OR t.subtitle ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY t.display_order ASC, t.title ASC';

    const result = await pool.query(query, values);
    const tutorials = result.rows;

    // Attach product_ids for each tutorial
    for (const t of tutorials) {
      const maps = await pool.query(
        'SELECT product_id FROM tutorial_product_mappings WHERE tutorial_id = $1',
        [t.id]
      );
      t.product_ids = maps.rows.map(r => r.product_id);
    }

    return tutorials;
  }

  static async update(id, {
    title, subtitle, description, thumbnail_url, video_url,
    category_id, duration, difficulty, display_order, status, resources = [], product_ids = []
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const query = `
        UPDATE tutorials
        SET title = $1, subtitle = $2, description = $3, thumbnail_url = $4, video_url = $5,
            category_id = $6, duration = $7, difficulty = $8, display_order = $9, status = $10,
            resources = $11, updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
      `;
      const result = await client.query(query, [
        title, subtitle, description, thumbnail_url, video_url,
        category_id || null, duration, difficulty || null, display_order, status,
        JSON.stringify(resources), id
      ]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const tutorial = result.rows[0];

      // Update mappings: clear old, insert new
      await client.query('DELETE FROM tutorial_product_mappings WHERE tutorial_id = $1', [id]);
      if (product_ids && product_ids.length > 0) {
        for (const prodId of product_ids) {
          await client.query(
            'INSERT INTO tutorial_product_mappings (tutorial_id, product_id) VALUES ($1, $2)',
            [id, prodId]
          );
        }
      }

      await client.query('COMMIT');
      return { ...tutorial, product_ids };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM tutorials WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }

  static async reorder(orders) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of orders) {
        await client.query(
          'UPDATE tutorials SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.display_order, item.id]
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Check if a user has access to a specific tutorial
  static async checkUserAccess(userId, tutorialId) {
    // Admin check
    const userResult = await pool.query('SELECT role, tutorial_access FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return false;
    const user = userResult.rows[0];

    if (user.role === 'admin' || user.tutorial_access === true) {
      return true;
    }

    // Check explicit tutorial override mapping
    const explicitAccess = await pool.query(
      'SELECT 1 FROM user_tutorial_access WHERE user_id = $1 AND tutorial_id = $2',
      [userId, tutorialId]
    );
    if (explicitAccess.rows.length > 0) return true;

    // Check product purchase access (Option A):
    // 1. Get products mapped to this tutorial that have enable_tutorials_after_purchase = true
    // 2. Check if the user has a PAID order containing any of these products
    const productAccessQuery = `
      SELECT 1 
      FROM tutorial_product_mappings tpm
      JOIN products p ON tpm.product_id = p.id
      JOIN orders o ON o.user_id = $1 AND o.payment_status = 'paid'
      WHERE tpm.tutorial_id = $2
        AND p.enable_tutorials_after_purchase = true
        AND o.items::jsonb @> JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT('product', p.id))
    `;
    const productAccessResult = await pool.query(productAccessQuery, [userId, tutorialId]);
    return productAccessResult.rows.length > 0;
  }

  // Get all tutorials a user is authorized to see
  static async findAccessibleByUser(userId) {
    const userResult = await pool.query('SELECT role, tutorial_access FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return [];
    const user = userResult.rows[0];

    // If Admin or user has global override, they can see ALL published tutorials
    if (user.role === 'admin' || user.tutorial_access === true) {
      const result = await pool.query(`
        SELECT t.*, c.name as category_name,
               COALESCE(utp.percentage_watched, 0) as percentage_watched,
               COALESCE(utp.completed, FALSE) as completed
        FROM tutorials t
        LEFT JOIN tutorial_categories c ON t.category_id = c.id
        LEFT JOIN user_tutorial_progress utp ON utp.tutorial_id = t.id AND utp.user_id = $1
        WHERE t.status = 'published'
        ORDER BY t.display_order ASC, t.title ASC
      `, [userId]);
      return result.rows;
    }

    // Fetch explicit access tutorials
    const explicitTutorials = await pool.query(`
      SELECT t.*, c.name as category_name,
             COALESCE(utp.percentage_watched, 0) as percentage_watched,
             COALESCE(utp.completed, FALSE) as completed
      FROM user_tutorial_access uta
      JOIN tutorials t ON uta.tutorial_id = t.id
      LEFT JOIN tutorial_categories c ON t.category_id = c.id
      LEFT JOIN user_tutorial_progress utp ON utp.tutorial_id = t.id AND utp.user_id = $1
      WHERE uta.user_id = $1 AND t.status = 'published'
    `, [userId]);

    // Fetch purchased access tutorials
    const purchasedTutorials = await pool.query(`
      SELECT DISTINCT t.*, c.name as category_name,
             COALESCE(utp.percentage_watched, 0) as percentage_watched,
             COALESCE(utp.completed, FALSE) as completed
      FROM tutorial_product_mappings tpm
      JOIN tutorials t ON tpm.tutorial_id = t.id
      JOIN products p ON tpm.product_id = p.id
      JOIN orders o ON o.user_id = $1 AND o.payment_status = 'paid'
      LEFT JOIN tutorial_categories c ON t.category_id = c.id
      LEFT JOIN user_tutorial_progress utp ON utp.tutorial_id = t.id AND utp.user_id = $1
      WHERE t.status = 'published'
        AND p.enable_tutorials_after_purchase = true
        AND o.items::jsonb @> JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT('product', p.id))
    `, [userId]);

    // Combine and return distinct tutorials
    const map = new Map();
    explicitTutorials.rows.forEach(t => map.set(t.id, t));
    purchasedTutorials.rows.forEach(t => map.set(t.id, t));

    const combined = Array.from(map.values());
    combined.sort((a, b) => a.display_order - b.display_order);
    return combined;
  }

  // User Progress tracking
  static async getProgress(userId, tutorialId) {
    const query = 'SELECT * FROM user_tutorial_progress WHERE user_id = $1 AND tutorial_id = $2';
    const result = await pool.query(query, [userId, tutorialId]);
    return result.rows[0] || null;
  }

  static async updateProgress(userId, tutorialId, { last_watched_position, percentage_watched, watch_duration = 0 }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const existing = await client.query(
        'SELECT * FROM user_tutorial_progress WHERE user_id = $1 AND tutorial_id = $2',
        [userId, tutorialId]
      );

      const completed = percentage_watched >= 90; // consider completed if watched 90% or more

      let progress;
      if (existing.rows.length === 0) {
        const insertQuery = `
          INSERT INTO user_tutorial_progress (
            user_id, tutorial_id, last_watched_position, percentage_watched, completed,
            first_viewed_at, last_viewed_at, total_watch_time, sessions_count
          )
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $6, 1)
          RETURNING *
        `;
        const res = await client.query(insertQuery, [
          userId, tutorialId, last_watched_position, percentage_watched, completed, watch_duration
        ]);
        progress = res.rows[0];
      } else {
        const current = existing.rows[0];
        const newTotalWatch = parseInt(current.total_watch_time || 0) + parseInt(watch_duration);
        const wasCompleted = current.completed;
        const nowCompleted = wasCompleted || completed;

        const updateQuery = `
          UPDATE user_tutorial_progress
          SET last_watched_position = $1,
              percentage_watched = GREATEST(percentage_watched, $2),
              completed = $3,
              last_viewed_at = CURRENT_TIMESTAMP,
              total_watch_time = $4,
              sessions_count = sessions_count + $5
          WHERE user_id = $6 AND tutorial_id = $7
          RETURNING *
        `;
        const res = await client.query(updateQuery, [
          last_watched_position, percentage_watched, nowCompleted, newTotalWatch, watch_duration > 0 ? 1 : 0, userId, tutorialId
        ]);
        progress = res.rows[0];
      }

      // Log to watch history if we spent time watching
      if (watch_duration > 0) {
        await client.query(
          'INSERT INTO watch_history (user_id, tutorial_id, duration) VALUES ($1, $2, $3)',
          [userId, tutorialId, watch_duration]
        );
      }

      await client.query('COMMIT');
      return progress;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Analytics Events
  static async logAnalyticsEvent(userId, tutorialId, eventType, eventData = {}) {
    const query = `
      INSERT INTO tutorial_analytics_events (user_id, tutorial_id, event_type, event_data)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, tutorialId, eventType, JSON.stringify(eventData)]);
    return result.rows[0];
  }

  // Admin overall stats dashboard
  static async getAdminOverallStats() {
    const totalTutorials = await pool.query('SELECT COUNT(*) FROM tutorials');
    const totalCategories = await pool.query('SELECT COUNT(*) FROM tutorial_categories');
    const totalViews = await pool.query('SELECT COUNT(*) FROM watch_history');
    const totalWatchTime = await pool.query('SELECT COALESCE(SUM(total_watch_time), 0) as watch_time FROM user_tutorial_progress');
    const activeLearners = await pool.query('SELECT COUNT(DISTINCT user_id) FROM user_tutorial_progress');
    const completedTutorials = await pool.query('SELECT COUNT(*) FROM user_tutorial_progress WHERE completed = TRUE');
    const avgCompletion = await pool.query('SELECT COALESCE(AVG(percentage_watched), 0) as avg_percent FROM user_tutorial_progress');

    const popular = await pool.query(`
      SELECT t.id, t.title, COUNT(wh.id) as views_count
      FROM tutorials t
      LEFT JOIN watch_history wh ON t.id = wh.tutorial_id
      GROUP BY t.id, t.title
      ORDER BY views_count DESC
      LIMIT 5
    `);

    return {
      totalTutorials: parseInt(totalTutorials.rows[0].count),
      totalCategories: parseInt(totalCategories.rows[0].count),
      totalVideoViews: parseInt(totalViews.rows[0].count),
      totalWatchTime: parseInt(totalWatchTime.rows[0].watch_time),
      activeLearners: parseInt(activeLearners.rows[0].count),
      completedTutorials: parseInt(completedTutorials.rows[0].count),
      averageCompletionRate: parseFloat(avgCompletion.rows[0].avg_percent),
      popularTutorials: popular.rows
    };
  }

  // Admin stats per tutorial
  static async getStatsPerTutorial(tutorialId) {
    const totalPlays = await pool.query('SELECT COUNT(*) FROM watch_history WHERE tutorial_id = $1', [tutorialId]);
    const uniqueViewers = await pool.query('SELECT COUNT(DISTINCT user_id) FROM user_tutorial_progress WHERE tutorial_id = $1', [tutorialId]);
    const completionRate = await pool.query('SELECT COALESCE(AVG(percentage_watched), 0) as avg_pct FROM user_tutorial_progress WHERE tutorial_id = $1', [tutorialId]);
    const avgWatchTime = await pool.query('SELECT COALESCE(AVG(total_watch_time), 0) as avg_time FROM user_tutorial_progress WHERE tutorial_id = $1', [tutorialId]);
    
    const activeDays = await pool.query(`
      SELECT TO_CHAR(watched_at, 'YYYY-MM-DD') as day, COUNT(*) as views_count
      FROM watch_history
      WHERE tutorial_id = $1
      GROUP BY day
      ORDER BY views_count DESC
      LIMIT 7
    `, [tutorialId]);

    return {
      totalPlays: parseInt(totalPlays.rows[0].count),
      uniqueViewers: parseInt(uniqueViewers.rows[0].count),
      completionRate: parseFloat(completionRate.rows[0].avg_pct),
      averageWatchTime: parseFloat(avgWatchTime.rows[0].avg_time),
      activeDays: activeDays.rows
    };
  }

  // Admin stats per user
  static async getStatsPerUser(userId) {
    const userResult = await pool.query('SELECT name, email, role, tutorial_access, created_at FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return null;
    const user = userResult.rows[0];

    const purchased = await pool.query(`
      SELECT DISTINCT p.id, p.name 
      FROM orders o, jsonb_array_elements(o.items) item
      JOIN products p ON (item->>'product')::integer = p.id
      WHERE o.user_id = $1 AND o.payment_status = 'paid'
    `, [userId]);

    const accessible = await this.findAccessibleByUser(userId);

    const watchedResult = await pool.query(`
      SELECT utp.*, t.title as tutorial_title
      FROM user_tutorial_progress utp
      JOIN tutorials t ON utp.tutorial_id = t.id
      WHERE utp.user_id = $1
    `, [userId]);

    const watchHistory = await pool.query(`
      SELECT wh.*, t.title as tutorial_title
      FROM watch_history wh
      JOIN tutorials t ON wh.tutorial_id = t.id
      WHERE wh.user_id = $1
      ORDER BY wh.watched_at DESC
      LIMIT 20
    `, [userId]);

    const aggregates = await pool.query(`
      SELECT COALESCE(SUM(total_watch_time), 0) as total_watch,
             COALESCE(AVG(percentage_watched), 0) as avg_complete
      FROM user_tutorial_progress
      WHERE user_id = $1
    `, [userId]);

    const explicitAccessResult = await pool.query(
      'SELECT tutorial_id FROM user_tutorial_access WHERE user_id = $1',
      [userId]
    );
    const explicitTutorialIds = explicitAccessResult.rows.map(r => r.tutorial_id);

    return {
      userId,
      userName: user.name,
      userEmail: user.email,
      tutorialAccessOverride: user.tutorial_access,
      purchasedProducts: purchased.rows,
      accessibleTutorialsCount: accessible.length,
      tutorialsWatchedCount: watchedResult.rows.length,
      watchHistory: watchHistory.rows,
      totalWatchTime: parseInt(aggregates.rows[0].total_watch),
      completionPercentage: parseFloat(aggregates.rows[0].avg_complete),
      watchedTutorialsDetails: watchedResult.rows,
      explicitTutorialIds
    };
  }
}

module.exports = { TutorialCategory, Tutorial };
