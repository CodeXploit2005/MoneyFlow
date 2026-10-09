import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodInstance: any = null;
export const getDatabaseStatus = () => ({
  connected: mongoose.connection.readyState === 1,
  storage: mongodInstance ? 'temporary' : 'persistent'
});

export const connectDB = async (): Promise<void> => {
  if (ENV.USE_IN_MEMORY_DB === 'true') {
    if (ENV.NODE_ENV === 'production') throw new Error('Production requires a persistent database');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    await mongoose.connect(mongodInstance.getUri());
    console.log('Development preview connected to temporary database');
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Prefer IPv4 on Windows and tolerate transient Atlas connection closures.
      await mongoose.connect(ENV.MONGODB_URI, { family: 4, serverSelectionTimeoutMS: 30000, connectTimeoutMS: 30000 });
      console.log('Connected to persistent MongoDB database');
      return;
    } catch (error: any) {
      await mongoose.disconnect();
      // Log the error class only; connection strings can contain credentials.
      console.error(`MongoDB startup attempt ${attempt}/3 failed (${error.name || 'connection error'}).`);
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Persistent MongoDB connection failed after 3 attempts. Check database access and network configuration; temporary fallback is disabled.');
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) { await mongodInstance.stop(); mongodInstance = null; }
};
