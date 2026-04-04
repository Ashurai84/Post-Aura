import express from "express";
import { verifyFirebaseToken, AuthRequest } from "../../backend/middleware/auth";
import { getAdminDb } from "../../backend/services/firebaseAdmin";

const router = express.Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "raia40094@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Admin routes correctly mounted" });
});

router.get("/stats", verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const email = (req.user!.email || "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const db = getAdminDb();

    const usersSnap = await db.collection("users").count().get();
    const totalUsers = usersSnap.data().count;

    const activeUsersSnap = await db.collection("users").where("postsAnalyzed", ">", 0).count().get();
    const activeUsers = activeUsersSnap.data().count;

    const proUsersSnap = await db.collection("users").where("isPro", "==", true).count().get();
    const proUsers = proUsersSnap.data().count;

    const analyticsSnap = await db.collection("analytics").get();
    let postGenerations = 0;
    let imageGenerations = 0;
    let intentPro = 0;
    let intentStudent = 0;

    analyticsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.type === "post-generated") postGenerations++;
      if (data.type === "image-generated") imageGenerations++;
      if (data.type === "intent") {
        if (data.plan === "pro") intentPro++;
        else if (data.plan === "student") intentStudent++;
      }
    });

    res.json({
      totalUsers,
      activeUsers,
      proUsers,
      postGenerations,
      imageGenerations,
      intents: {
        pro: intentPro,
        student: intentStudent,
        total: intentPro + intentStudent,
      },
      conversionRate: totalUsers > 0 ? (proUsers / totalUsers) * 100 : 0,
    });
  } catch (error: unknown) {
    console.error("Stats fetching failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const email = (req.user!.email || "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const db = getAdminDb();
    const usersSnap = await db.collection("users").orderBy("createdAt", "desc").limit(100).get();
    
    const users = usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || "",
        displayName: data.displayName || "Unknown",
        isPro: !!data.isPro,
        planType: data.planType || "free",
        createdAt: data.createdAt,
        postsAnalyzed: data.voiceProfile?.postsAnalyzed || 0
      };
    });

    res.json({ users });
  } catch (error: unknown) {
    console.error("Users fetching failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
