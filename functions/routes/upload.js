const express = require('express');
const Busboy = require('busboy');
const path = require('path');
const { bucket } = require('../firebase');
const router = express.Router();

router.post('/', (req, res) => {
  // 1. Check if rawBody exists (standard for Firebase Functions)
  if (!req.rawBody) {
    return res.status(400).json({ error: 'No request body found.' });
  }

  const busboy = Busboy({ headers: req.headers });
  const uploadPromises = [];

  busboy.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    
    if (!bucket) {
      console.error('Upload attempted but bucket is not initialized');
      file.resume();
      return;
    }

    const promise = new Promise((resolve, reject) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const newFileName = uniqueSuffix + path.extname(filename);

      const blob = bucket.file(`uploads/${newFileName}`);
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
          const [url] = await blob.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
          });
          resolve({ url, fileName: newFileName });
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

module.exports = router;
