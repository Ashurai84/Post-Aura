import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import backendRoutes from "./routes";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173", // Default Vite Frontend
  "http://localhost:5174", // Proposed standalone Admin
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    return callback(new Error("CORS not allowed"), false);
  },
  credentials: true
}));

app.use(express.json());

// API routes
app.use("/api", backendRoutes);

// Simple Health Check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[API] Server running on port ${PORT}`);
  console.log(`[CORS] Whitelist:`, allowedOrigins.length ? allowedOrigins : "Open (Dev Mode)");
});

