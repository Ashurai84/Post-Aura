import { User } from '../models/User.model';
import { Feedback } from '../models/Feedback.model';

export const registerUser = async (data: {
  userId: string;
  email?: string;
  name?: string;
  linkedinUrl?: string;
}) => {
  const user = await User.findOneAndUpdate(
    { userId: data.userId },
    {
      $set: {
        email: data.email,
        name: data.name,
        linkedinUrl: data.linkedinUrl,
        lastActiveAt: new Date(),
      },
      $setOnInsert: { registeredAt: new Date() }
    },
    { upsert: true, new: true }
  );
  return user;
};

export const saveFeedback = async (data: {
  userId: string;
  type: string;
  message: string;
  rating: number;
  page: string;
}) => {
  const feedback = await Feedback.create({ ...data, rating: data.rating as 1 | 2 | 3 | 4 | 5 });
  // Also log to Render console so you can see it live
  console.log(`[FEEDBACK] ⭐${data.rating} | ${data.type} | ${data.message}`);
  return feedback;
};

export const getAllUsers = async () => {
  return await User.find({})
    .sort({ registeredAt: -1 })
    .select('-__v');
};

export const getAllFeedback = async () => {
  return await Feedback.find({})
    .sort({ submittedAt: -1 })
    .select('-__v');
};
