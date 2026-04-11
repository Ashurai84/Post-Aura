import { User } from '../models/User.model';
import { env } from '../config/env';

export const getOrCreateUser = async (userId: string) => {
  let user = await User.findOne({ userId });
  if (!user) {
    user = await User.create({ userId });
  }
  // Reset daily counts if past midnight
  if (new Date() > user.dailyResetAt) {
    user.postsToday = 0;
    user.iterationsToday = 0;
    user.dailyResetAt = nextMidnight();
    await user.save();
  }
  return user;
};

export const trackSynthesize = async (userId: string) => {
  await User.findOneAndUpdate(
    { userId },
    {
      $inc: { postsToday: 1, totalPostsEver: 1 },
      $set: { lastActiveAt: new Date() }
    },
    { upsert: true }
  );
};

export const trackIteration = async (userId: string) => {
  await User.findOneAndUpdate(
    { userId },
    {
      $inc: { iterationsToday: 1, totalIterationsEver: 1 },
      $set: { lastActiveAt: new Date() }
    },
    { upsert: true }
  );
};

export const getUsage = async (userId: string) => {
  const user = await getOrCreateUser(userId);
  const DAILY_POST_LIMIT = parseInt(env.DAILY_POST_LIMIT);
  const DAILY_ITER_LIMIT = parseInt(env.DAILY_ITER_LIMIT);
  return {
    postsToday:             user.postsToday,
    iterationsToday:        user.iterationsToday,
    totalPostsEver:         user.totalPostsEver,
    postsRemaining:         Math.max(0, DAILY_POST_LIMIT - user.postsToday),
    iterationsRemaining:    Math.max(0, DAILY_ITER_LIMIT - user.iterationsToday),
    resetAt:                user.dailyResetAt.toISOString(),
    plan:                   user.plan,
  };
};

function nextMidnight(): Date {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}
