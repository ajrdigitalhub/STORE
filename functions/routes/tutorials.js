const express = require('express');
const Busboy = require('busboy');
const path = require('path');
const { bucket } = require('../firebase');
const { auth, adminAuth } = require('../middleware/auth');
const { TutorialCategory, Tutorial } = require('../models/Tutorial');

const router = express.Router();

// ==========================================
// CATEGORIES (Tutorial Categories)
// ==========================================

// GET /api/tutorials/categories - Get all categories
router.get('/categories', auth, async (req, res, next) => {
  try {
    const cats = await TutorialCategory.findAll();
    res.json(cats);
  } catch (error) {
    next(error);
  }
});

// POST /api/tutorials/categories - Create category (Admin only)
router.post('/categories', adminAuth, async (req, res, next) => {
  try {
    const { name, description, display_order } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const cat = await TutorialCategory.create({ name, description, display_order });
    res.status(201).json(cat);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tutorials/categories/:id - Update category (Admin only)
router.put('/categories/:id', adminAuth, async (req, res, next) => {
  try {
    const { name, description, display_order } = req.body;
    const cat = await TutorialCategory.update(req.params.id, { name, description, display_order });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json(cat);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tutorials/categories/:id - Delete category (Admin only)
router.delete('/categories/:id', adminAuth, async (req, res, next) => {
  try {
    const deleted = await TutorialCategory.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/tutorials/categories/reorder - Reorder categories (Admin only)
router.post('/categories/reorder', adminAuth, async (req, res, next) => {
  try {
    const { orders } = req.body; // array of { id, display_order }
    await TutorialCategory.reorder(orders);
    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// TUTORIALS
// ==========================================

// GET /api/tutorials/admin - Get all tutorials for Admin (both draft and published)
router.get('/admin', adminAuth, async (req, res, next) => {
  try {
    const { categoryId, search } = req.query;
    const list = await Tutorial.findAll({ categoryId, search });
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// GET /api/tutorials - Get accessible tutorials for Customer (published only)
router.get('/', auth, async (req, res, next) => {
  try {
    const list = await Tutorial.findAccessibleByUser(req.userId);
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// GET /api/tutorials/stream-by-path - Admin only stream by path (Redirect to secure CDN)
router.get('/stream-by-path', adminAuth, async (req, res, next) => {
  try {
    const { filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ message: 'File path is required.' });
    }

    if (!bucket) {
      return res.status(500).json({ message: 'Firebase Storage bucket not configured.' });
    }

    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ message: 'Video file does not exist in Storage.' });
    }

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 2 // 2 hours
    });

    res.redirect(signedUrl);
  } catch (error) {
    console.error('Error redirecting to secure preview video:', error);
    next(error);
  }
});

// GET /api/tutorials/:id - Get tutorial details (checks user access)
router.get('/:id', auth, async (req, res, next) => {
  try {
    const tutorialId = parseInt(req.params.id);
    const hasAccess = await Tutorial.checkUserAccess(req.userId, tutorialId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You do not have access to this tutorial.' });
    }
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });
    
    // Check progress
    const progress = await Tutorial.getProgress(req.userId, tutorialId);
    res.json({ tutorial, progress });
  } catch (error) {
    next(error);
  }
});

// POST /api/tutorials - Create tutorial (Admin only)
router.post('/', adminAuth, async (req, res, next) => {
  try {
    const {
      title, subtitle, description, thumbnail_url, video_url,
      category_id, duration, difficulty, display_order, status, resources, product_ids
    } = req.body;

    if (!title || !video_url) {
      return res.status(400).json({ message: 'Title and Video File are required' });
    }

    const tutorial = await Tutorial.create({
      title, subtitle, description, thumbnail_url, video_url,
      category_id, duration, difficulty, display_order, status, resources, product_ids
    });
    res.status(201).json(tutorial);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tutorials/:id - Update tutorial (Admin only)
router.put('/:id', adminAuth, async (req, res, next) => {
  try {
    const {
      title, subtitle, description, thumbnail_url, video_url,
      category_id, duration, difficulty, display_order, status, resources, product_ids
    } = req.body;

    const tutorial = await Tutorial.update(req.params.id, {
      title, subtitle, description, thumbnail_url, video_url,
      category_id, duration, difficulty, display_order, status, resources, product_ids
    });

    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });
    res.json(tutorial);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tutorials/:id - Delete tutorial (Admin only)
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const deleted = await Tutorial.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Tutorial not found' });
    res.json({ message: 'Tutorial deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/tutorials/reorder - Reorder tutorials (Admin only)
router.post('/reorder', adminAuth, async (req, res, next) => {
  try {
    const { orders } = req.body; // array of { id, display_order }
    await Tutorial.reorder(orders);
    res.json({ message: 'Tutorials reordered successfully' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// FILE UPLOAD (Video / Thumbnail)
// ==========================================

// GET /api/tutorials/stream-by-path moved to top of file

// POST /api/tutorials/upload - Upload file to storage (Admin only)
router.post('/upload', 
  adminAuth, 
  express.raw({ type: 'multipart/form-data', limit: '200mb' }),
  (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body;
    }
    next();
  },
  (req, res) => {
    if (!req.rawBody) {
      return res.status(400).json({ error: 'No request body found.' });
    }

    const busboy = Busboy({ headers: req.headers });
    const uploadPromises = [];
    const type = req.query.type || 'video'; // 'video', 'thumbnail', or 'resource'
    const categorySlug = req.query.categorySlug || 'general';

    busboy.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      
      if (!bucket) {
        console.error('Upload attempted but bucket is not initialized');
        file.resume();
        return;
      }

      const promise = new Promise((resolve, reject) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(filename);
        const newFileName = uniqueSuffix + ext;

        let storagePath;
        if (type === 'thumbnail') {
          storagePath = `tutorial-thumbnails/${newFileName}`;
        } else if (type === 'resource') {
          storagePath = `tutorial-resources/${newFileName}`;
        } else {
          storagePath = `tutorials/${categorySlug}/${newFileName}`;
        }

        const blob = bucket.file(storagePath);
        const blobStream = blob.createWriteStream({
          metadata: { contentType: mimeType },
          resumable: false
        });

        blobStream.on('error', (err) => {
          console.error('Blob stream error:', err);
          reject(err);
        });

        blobStream.on('finish', async () => {
          try {
            let url = '';
            if (type === 'thumbnail' || type === 'resource') {
              const [signedUrl] = await blob.getSignedUrl({
                action: 'read',
                expires: '03-01-2500'
              });
              url = signedUrl;
            } else {
              // For video, we save the storagePath internally
              url = storagePath;
            }
            resolve({ url, storagePath, fileName: newFileName });
          } catch (err) {
            reject(err);
          }
        });

        file.pipe(blobStream);
      });

      uploadPromises.push(promise);
    });

  busboy.on('finish', async () => {
    try {
      const results = await Promise.all(uploadPromises);
      if (results.length === 1) {
        res.json({
          success: true,
          url: results[0].url,
          storagePath: results[0].storagePath,
          fileName: results[0].fileName
        });
      } else {
        res.json({
          success: true,
          urls: results.map(r => r.url),
          files: results
        });
      }
    } catch (err) {
      console.error('Upload processing error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Upload failed', message: err.message });
      }
    }
  });

  busboy.on('error', (err) => {
    console.error('Busboy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Parsing failed: ${err.message}` });
    }
  });

  busboy.end(req.rawBody);
});

// ==========================================
// SECURE VIDEO STREAMING
// ==========================================

// GET /api/tutorials/:id/stream - Secure range request stream (authenticated)
router.get('/:id/stream', auth, async (req, res, next) => {
  try {
    const tutorialId = parseInt(req.params.id);
    const hasAccess = await Tutorial.checkUserAccess(req.userId, tutorialId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You do not have access to this tutorial.' });
    }

    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial || !tutorial.video_url) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    if (!bucket) {
      return res.status(500).json({ message: 'Firebase Storage bucket not configured.' });
    }

    const file = bucket.file(tutorial.video_url);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ message: 'Video file does not exist in Storage.' });
    }

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 2 // 2 hours
    });

    res.redirect(signedUrl);
  } catch (error) {
    console.error('Error redirecting to secure video stream:', error);
    next(error);
  }
});

// ==========================================
// USER PROGRESS
// ==========================================

// GET /api/tutorials/:id/progress - Get user progress
router.get('/:id/progress', auth, async (req, res, next) => {
  try {
    const progress = await Tutorial.getProgress(req.userId, parseInt(req.params.id));
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

// POST /api/tutorials/:id/progress - Update progress and watch history
router.post('/:id/progress', auth, async (req, res, next) => {
  try {
    const { last_watched_position, percentage_watched, watch_duration } = req.body;
    const progress = await Tutorial.updateProgress(req.userId, parseInt(req.params.id), {
      last_watched_position: parseFloat(last_watched_position || 0),
      percentage_watched: parseInt(percentage_watched || 0),
      watch_duration: parseInt(watch_duration || 0)
    });
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

// POST /api/tutorials/:id/analytics-event - Log user click event
router.post('/:id/analytics-event', auth, async (req, res, next) => {
  try {
    const { eventType, eventData } = req.body;
    await Tutorial.logAnalyticsEvent(req.userId, parseInt(req.params.id), eventType, eventData);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// ANALYTICS (Admin only)
// ==========================================

// GET /api/tutorials/admin/analytics - Overall stats
router.get('/admin/analytics', adminAuth, async (req, res, next) => {
  try {
    const stats = await Tutorial.getAdminOverallStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/tutorials/admin/analytics/tutorial/:tutorialId - Per-tutorial stats
router.get('/admin/analytics/tutorial/:tutorialId', adminAuth, async (req, res, next) => {
  try {
    const stats = await Tutorial.getStatsPerTutorial(parseInt(req.params.tutorialId));
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/tutorials/admin/analytics/user/:userId - Per-user stats
router.get('/admin/analytics/user/:userId', adminAuth, async (req, res, next) => {
  try {
    const stats = await Tutorial.getStatsPerUser(parseInt(req.params.userId));
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
