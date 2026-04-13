import { createApp } from './app.js';
import express from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = createApp();

const port = process.env['PORT'] || 3000;
const isProduction = process.env['NODE_ENV'] === 'production';

if (isProduction) {
  // Serve Angular static files from dist/app/browser
  const browserDistPath = join(__dirname, '../dist/app/browser');
  app.use(express.static(browserDistPath));

  // Fallback to index.html for SPA routing
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(join(browserDistPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).send('Application not built yet. Please run npm run build.');
      }
    });
  });
}

// Only listen if this file is run directly
if (process.argv[1] && (process.argv[1].endsWith('main.ts') || process.argv[1].endsWith('main.js') || process.argv[1].endsWith('server.mjs'))) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
export { app };
