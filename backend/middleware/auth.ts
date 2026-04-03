import { Request, Response, NextFunction } from "express";
import { getAdminAuth } from "../services/firebaseAdmin";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

export async function verifyFirebaseToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
    };
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
