import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { getAdminDb, FieldValue } from "../services/firebaseAdmin";

export async function checkUsage(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const userRef = getAdminDb().collection("users").doc(req.user.uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    // Create user doc if it doesn't exist (e.g., first generation)
    const newUser = {
      freeGenerationsUsed: 1,
      isPro: false,
      planType: "free",
      planActivatedAt: null,
      planExpiresAt: null,
      instamojoPaymentId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await userRef.set(newUser);
    return next();
  }

  const userData = userDoc.data();
  if (userData?.isPro === true) {
    // Check if plan is still active
    if (userData.planExpiresAt && userData.planExpiresAt.toDate() < new Date()) {
      // Plan expired
      await userRef.update({ isPro: false, planType: "free" });
    } else {
      return next();
    }
  }

  const freeGenerationsUsed = userData?.freeGenerationsUsed || 0;
  if (freeGenerationsUsed >= 5) {
    return res.status(402).json({ code: "UPGRADE_REQUIRED", error: "Free limit reached. Please upgrade to Pro." });
  }

  // Increment usage
  await userRef.update({
    freeGenerationsUsed: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  next();
}
