import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorLog extends Document {
  timestamp: Date;
  route: string;
  method: string;
  error: string;
  userId?: string;
  statusCode: number;
}

const ErrorLogSchema = new Schema<IErrorLog>({
  timestamp:  { type: Date, default: Date.now, index: true },
  route:      { type: String, required: true },
  method:     { type: String, required: true },
  error:      { type: String, required: true },
  userId:     { type: String, default: null },
  statusCode: { type: Number, required: true },
});

// Auto-delete error logs older than 30 days
ErrorLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export const ErrorLog = mongoose.model<IErrorLog>('ErrorLog', ErrorLogSchema);
