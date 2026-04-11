import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('[PostAura] MongoDB connected successfully');
  } catch (error) {
    console.error('[PostAura] MongoDB connection failed:', error);
    process.exit(1);  // crash hard if DB fails on startup
  }
};
