import mongoose, { Schema, Document } from 'mongoose';

export interface ISurveyOption {
  id: string;
  text: string;
  count: number;
}

export interface ISurvey extends Document {
  title: string;
  question: string;
  options: ISurveyOption[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SurveySchema = new Schema<ISurvey>({
  title: { type: String, required: true, maxlength: 100 },
  question: { type: String, required: true, maxlength: 500 },
  options: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true, maxlength: 200 },
      count: { type: Number, default: 0 },
    }
  ],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);

// Response tracking
export interface ISurveyResponse extends Document {
  userId: string;
  surveyId: string;
  optionId: string;
  submittedAt: Date;
}

const SurveyResponseSchema = new Schema<ISurveyResponse>({
  userId: { type: String, required: true, index: true },
  surveyId: { type: String, required: true, index: true },
  optionId: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

// Unique constraint: one response per user per survey
SurveyResponseSchema.index({ userId: 1, surveyId: 1 }, { unique: true });

export const SurveyResponse = mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
