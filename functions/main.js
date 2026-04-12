import { createApp } from './app.js';
import express from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('message', (message) => {
    console.log('Message received:', message);
    // Broadcast message to everyone (including sender for simplicity in this demo, 
    // or you can use socket.broadcast.emit to send to others)
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

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
  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
export { app };
