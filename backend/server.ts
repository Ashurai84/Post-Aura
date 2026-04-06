import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import backendRoutes from "./routes";

dotenv.config({ path: "./backend/.env" });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://post-aura-frontend.netlify.app",
    "https://post-aura-admin.netlify.app"
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api", backendRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`PostAura backend running on http://localhost:${PORT}`);
});
