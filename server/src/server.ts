import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV, CLIENT_ORIGINS } from './config/env.js';
import { initSocket } from './sockets/socketHandler.js';
import { initWarrantyCron } from './jobs/warrantyCron.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();


  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize WebSockets
  initSocket(httpServer, CLIENT_ORIGINS);

  // Initialize Cron Jobs
  initWarrantyCron();

  httpServer.listen(ENV.PORT, () => {
    console.log(`🚀 MoneyFlow Server is running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
    console.log(`📡 Client origins allowed: ${CLIENT_ORIGINS.join(', ')}`);
  });
};

startServer().catch(err => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});
