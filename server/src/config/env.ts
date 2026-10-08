import dotenv from 'dotenv';
dotenv.config();

// Keep HTTP and Socket.IO on the same explicit origin allowlist.
export const CLIENT_ORIGINS = [...new Set([
  process.env.CLIENT_URL?.trim().replace(/\/+$/, ''),
  'https://money-flow-two-ochre.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter((origin): origin is string => Boolean(origin)))];

export interface ServerEnv {
  PORT: number | string;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CLIENT_URL: string;
  COOKIE_SECRET: string;
  USE_IN_MEMORY_DB: string;
}

export const ENV: ServerEnv = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/moneyflow',
  JWT_SECRET: process.env.JWT_SECRET || 'moneyflow_jwt_secret_dev_key_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'moneyflow_jwt_refresh_dev_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'moneyflow_cookie_secret',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB || 'false'
};
