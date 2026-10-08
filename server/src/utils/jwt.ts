import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const generateAccessToken = (payload: any): string => {
  return jwt.sign(payload, ENV.JWT_SECRET as jwt.Secret, {
    expiresIn: ENV.JWT_EXPIRES_IN
  } as any);
};

export const generateRefreshToken = (payload: any): string => {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN
  } as any);
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, ENV.JWT_SECRET as jwt.Secret);
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET as jwt.Secret);
  } catch (err) {
    return null;
  }
};
