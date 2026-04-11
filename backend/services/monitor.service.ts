import { ErrorLog } from '../models/ErrorLog.model';

export const logError = async (details: {
  route: string;
  method: string;
  error: string;
  userId?: string;
  statusCode: number;
}) => {
  try {
    await ErrorLog.create(details);
  } catch (e) {
    // Never let error logging crash the app
    console.error('[Monitor] Failed to log error:', e);
  }
};

export const getRecentErrors = async () => {
  return await ErrorLog.find({})
    .sort({ timestamp: -1 })
    .limit(50)
    .select('-__v');
};
