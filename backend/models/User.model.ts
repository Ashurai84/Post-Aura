import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  email?: string;
  name?: string;
  linkedinUrl?: string;
  plan: 'free' | 'pro';
  postsToday: number;
  iterationsToday: number;
  totalPostsEver: number;
  totalIterationsEver: number;
  lastActiveAt: Date;
  dailyResetAt: Date;
  registeredAt: Date;
}

const UserSchema = new Schema<IUser>({
  userId:               { type: String, required: true, unique: true, index: true },
  email:                { type: String, default: null },
  name:                 { type: String, default: null },
  linkedinUrl:          { type: String, default: null },
  plan:                 { type: String, enum: ['free','pro'], default: 'free' },
  postsToday:           { type: Number, default: 0 },
  iterationsToday:      { type: Number, default: 0 },
  totalPostsEver:       { type: Number, default: 0 },
  totalIterationsEver:  { type: Number, default: 0 },
  lastActiveAt:         { type: Date, default: Date.now },
  dailyResetAt:         { type: Date, default: () => nextMidnight() },
  registeredAt:         { type: Date, default: Date.now },
});

function nextMidnight(): Date {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}

export const User = mongoose.model<IUser>('User', UserSchema);
