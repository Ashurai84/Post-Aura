import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  userId: string;
  type: 'bug' | 'feature' | 'love' | 'hate' | 'suggestion';
  message: string;
  rating: 1 | 2 | 3 | 4 | 5;
  page: string;
  submittedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  userId:      { type: String, required: true, index: true },
  type:        { type: String, enum: ['bug','feature','love','hate','suggestion'], required: true },
  message:     { type: String, required: true, maxlength: 1000 },
  rating:      { type: Number, min: 1, max: 5, required: true },
  page:        { type: String, default: 'unknown' },
  submittedAt: { type: Date, default: Date.now },
});

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
