import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { initSocket } from './sockets/socketHandler.js';
import { initWarrantyCron } from './jobs/warrantyCron.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();


  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize WebSockets
  initSocket(httpServer, ENV.CLIENT_URL);

  // Initialize Cron Jobs
  initWarrantyCron();

  httpServer.listen(ENV.PORT, () => {
    console.log(`🚀 MoneyFlow Server is running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
    console.log(`📡 Client URL allowed: ${ENV.CLIENT_URL}`);
  });
};

startServer().catch(err => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});
