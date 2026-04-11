import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/postaura",
  DAILY_POST_LIMIT: process.env.DAILY_POST_LIMIT || "3",
  DAILY_ITER_LIMIT: process.env.DAILY_ITER_LIMIT || "10",
};
