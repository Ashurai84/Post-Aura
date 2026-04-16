import { User } from '../models/User.model';

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

export const getAllUsers = async () => {
  return await User.find({})
    .sort({ registeredAt: -1 })
    .select('-__v');
};
