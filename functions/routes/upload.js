const express = require('express');
const Busboy = require('busboy');
const path = require('path');
const { bucket } = require('../firebase');
const router = express.Router();

router.post('/', (req, res) => {
  if (!req.rawBody) {
    return res.status(400).json({ error: 'No request body found.' });
  }

  const busboy = Busboy({ headers: req.headers });
  const uploadPromises = [];
  const uploadedFiles = [];

  busboy.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFileName = uniqueSuffix + path.extname(filename);

    const blob = bucket.file(`uploads/${newFileName}`);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: mimeType },
      resumable: false
    });

    const uploadPromise = new Promise((resolve, reject) => {
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
          uploadedFiles.push({ url, fileName: newFileName });
          resolve();
        } catch (err) {
          console.error('Error generating URL:', err);
          reject(err);
        }
      });
    });

    uploadPromises.push(uploadPromise);
    file.pipe(blobStream);
  });

  busboy.on('finish', async () => {
    try {
      await Promise.all(uploadPromises);
      if (!res.headersSent) {
        res.json({
          success: true,
          urls: uploadedFiles.map(f => f.url),
          files: uploadedFiles
        });
      }
    } catch (err) {
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
