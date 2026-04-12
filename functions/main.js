import { createApp } from './app.js';
import express from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import * as functions from 'firebase-functions/v2'; // Use v2 explicitly

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = createApp();

// Path to Angular assets - Ensure this folder is COPIED into the functions folder during build
const browserDistPath = join(__dirname, 'dist/browser');

if (existsSync(browserDistPath)) {
  console.log('✅ Static assets found. Serving frontend.');
  app.use(express.static(browserDistPath));
} else {
  console.warn('⚠️ Warning: dist/browser folder not found. API mode only.');
}

// Health check for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API Routes (Assuming your createApp handles these)
// app.use('/api', apiRoutes);

// SPA fallback: Only serve index.html if it exists and it's not an API call
app.get('*', (req, res) => {
  const indexPath = join(browserDistPath, 'index.html');

  if (!req.path.startsWith('/api') && existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Not Found',
      message: 'API route not defined or frontend assets missing.'
    });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// ✅ Export for Firebase Functions 2nd Gen
// export const api = functions.https.onRequest({
//   region: 'us-central1',
//   memory: '512MiB',
//   maxInstances: 10 // Good practice to limit costs
// }, app);