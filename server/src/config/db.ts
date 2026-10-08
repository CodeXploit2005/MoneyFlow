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
  try {
    await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
    console.log('Connected to persistent MongoDB database');
  } catch {
    // Never print the connection URI or silently store business records in RAM.
    throw new Error('Persistent MongoDB connection failed. Check database access and network configuration; temporary fallback is disabled.');
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) { await mongodInstance.stop(); mongodInstance = null; }
};
