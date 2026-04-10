import { createApp } from './app.js';
import express from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as functions from 'firebase-functions';

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = createApp();

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const browserDistPath = join(__dirname, '../dist/app/browser');

  // Serve static Angular files
  app.use(express.static(browserDistPath));

  // SPA fallback (Angular routing)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(join(browserDistPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('App not built. Run npm run build.');
      }
    });
  });
}

// Optional: Health check endpoint (helps Cloud Run)
app.get('/health', (req, res) => {
  res.status(200).send('OKk');
});

// ✅ Export for Firebase Functions (2nd gen / Cloud Run)


export const api = functions.https.onRequest(app);