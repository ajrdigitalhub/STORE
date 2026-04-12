import { Router } from 'express';
import Busboy from 'busboy';
import path from 'path';
import { bucket } from '../firebase.js';

const router = Router();

// Middleware to capture raw body for busboy.end(req.rawBody)
// Note: This buffers the entire file in memory.
const rawBodyMiddleware = (req, res, next) => {
  let data = Buffer.alloc(0);
  req.on('data', (chunk) => {
    data = Buffer.concat([data, chunk]);
  });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
  req.on('error', (err) => {
    next(err);
  });
};

router.post('/', rawBodyMiddleware, (req, res) => {
  // 1. Check if rawBody exists (standard for Firebase Functions)
  if (!req.rawBody || req.rawBody.length === 0) {
    return res.status(400).json({ error: 'No request body found.' });
  }

  const busboy = Busboy({ headers: req.headers });
  let fileProcessed = false;

  busboy.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFileName = uniqueSuffix + path.extname(filename);

    const blob = bucket.file(`uploads/${newFileName}`);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: mimeType },
      resumable: false
    });

    blobStream.on('error', (err) => {
      console.error('Blob stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Upload failed', message: err.message });
      }
    });

    blobStream.on('finish', async () => {
      fileProcessed = true;
      try {
        // Generating Signed URL for Uniform Access buckets
        const [url] = await blob.getSignedUrl({
          action: 'read',
          expires: '03-01-2500'
        });

        if (!res.headersSent) {
          res.json({
            success: true,
            url: url,
            fileName: newFileName
          });
        }
      } catch (err) {
        console.error('Error generating URL:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Could not generate file URL' });
        }
      }
    });

    file.pipe(blobStream);
  });

  busboy.on('error', (err) => {
    console.error('Busboy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Parsing failed: ${err.message}` });
    }
  });

  busboy.on('finish', () => {
    if (!fileProcessed && !res.headersSent) {
      res.status(400).json({ error: 'No file found in request' });
    }
  });

  // 2. Instead of req.pipe(busboy), use busboy.end(req.rawBody)
  // This pushes the already-buffered body into Busboy
  busboy.end(req.rawBody);
});

export const uploadRoutes = router;
