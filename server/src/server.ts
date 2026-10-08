// Run one backend instance per configured port.
import http from 'http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
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

  // Await binding so EADDRINUSE follows the startup error path instead of
  // becoming an unhandled EventEmitter error. Start jobs only after binding.
  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(ENV.PORT, () => resolve());
  });
  initWarrantyCron();
  console.log(`🚀 MoneyFlow Server is running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
  console.log(`📡 Client origins allowed: ${CLIENT_ORIGINS.join(', ')}`);
};

startServer().catch(async err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Cổng ${ENV.PORT} đang được sử dụng. Nếu MoneyFlow đã chạy, hãy dùng phiên hiện tại. Chỉ chạy một backend; tại thư mục Money có thể dùng npm run dev để tự dùng lại dịch vụ đang chạy.`);
  } else {
    console.error('Không khởi động được MoneyFlow:', err.message);
  }
  await disconnectDB().catch(() => {});
  process.exit(1);
});
