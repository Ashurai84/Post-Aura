import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('[PostAura] MongoDB connected successfully');
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.warn('[PostAura] ⚠️ MongoDB connection failed (non-blocking in dev mode)');
      console.warn('[PostAura]   Error:', error instanceof Error ? error.message : error);
      console.warn('[PostAura]   Some endpoints will not work, but server will continue running');
      console.warn('[PostAura]   This is OK for testing frontend/API integration locally');
      return; // don't crash in development
    } else {
      console.error('[PostAura] MongoDB connection failed (FATAL in production):', error);
      process.exit(1); // crash in production
    }
  }
};
