import express from "express";
import { verifyFirebaseToken, AuthRequest } from "../middleware/auth";
import { getAdminDb, getAdminAuth } from "../services/firebaseAdmin";
import { Feedback } from "../models/Feedback.model";
import { ErrorLog } from "../models/ErrorLog.model";
import { Survey, SurveyResponse } from "../models/Survey.model";

const router = express.Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function requireAdminEmail(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const email = (req.user?.email || "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  next();
}

router.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Admin routes correctly mounted" });
});

router.use(verifyFirebaseToken, requireAdminEmail);

router.get("/stats", async (_req: AuthRequest, res) => {
  try {
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

    analyticsSnap.forEach((doc: any) => {
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

router.get("/users", async (_req: AuthRequest, res) => {
  try {
    const db = getAdminDb();
    const usersSnap = await db.collection("users").get();

    const users = usersSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || "",
        displayName: data.displayName || "Unknown",
        isPro: !!data.isPro,
        planType: data.planType || "free",
        createdAt: data.createdAt,
        postsAnalyzed: data.voiceProfile?.postsAnalyzed || 0,
      };
    }).sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || a.createdAt?._seconds || 0;
      const timeB = b.createdAt?.toMillis?.() || b.createdAt?._seconds || 0;
      return timeB - timeA;
    }).slice(0, 100);

    res.json({ users });
  } catch (error: unknown) {
    console.error("Users fetching failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:userId/posts", async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const db = getAdminDb();

    const postsSnap = await db
      .collection("posts")
      .where("userId", "==", userId)
      .get();

    const posts = postsSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        topic: data.topic || "",
        audience: data.audience || "",
        tone: data.tone || "",
        content: data.content || "",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        copiedAt: data.copiedAt || null,
        performance: data.performance || null,
      };
    }).sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || a.createdAt?._seconds || 0;
      const timeB = b.createdAt?.toMillis?.() || b.createdAt?._seconds || 0;
      return timeB - timeA;
    });

    res.json({ userId, postCount: posts.length, posts });
  } catch (error: unknown) {
    console.error("User posts fetching failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user-data", async (_req: AuthRequest, res) => {
  try {
    const db = getAdminDb();
    const usersSnap = await db.collection("users").get();
    
    // Sort and limit users first
    const sortedUserDocs = usersSnap.docs.slice().sort((a: any, b: any) => {
      const timeA = a.data().createdAt?.toMillis?.() || a.data().createdAt?._seconds || 0;
      const timeB = b.data().createdAt?.toMillis?.() || b.data().createdAt?._seconds || 0;
      return timeB - timeA;
    }).slice(0, 50);

    const usersWithPosts = await Promise.all(
      sortedUserDocs.map(async (userDoc: any) => {
        const userData = userDoc.data();
        const postsSnap = await db.collection("posts")
          .where("userId", "==", userDoc.id)
          .get();

        const posts = postsSnap.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            topic: data.topic || "",
            content: data.content?.substring(0, 100) + "..." || "[empty]",
            createdAt: data.createdAt,
            performance: data.performance || null,
          };
        }).sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || a.createdAt?._seconds || 0;
          const timeB = b.createdAt?.toMillis?.() || b.createdAt?._seconds || 0;
          return timeB - timeA;
        }).slice(0, 10);

        return {
          uid: userDoc.id,
          email: userData.email || "",
          displayName: userData.displayName || "Unknown",
          isPro: !!userData.isPro,
          createdAt: userData.createdAt,
          totalPosts: posts.length,
          recentPosts: posts,
        };
      })
    );

    res.json({ totalUsers: usersWithPosts.length, users: usersWithPosts });
  } catch (error: unknown) {
    console.error("User data fetching failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:userId", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    const db = getAdminDb();
    
    // 1. Delete user doc
    await db.collection("users").doc(userId).delete().catch(console.warn);

    // 2. Delete posts
    const postsSnap = await db.collection("posts").where("userId", "==", userId).get();
    const batch = db.batch();
    postsSnap.docs.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit().catch(console.warn);

    // 3. Delete from Firebase Auth
    try {
      const auth = getAdminAuth();
      await auth.deleteUser(userId);
    } catch (authError) {
      console.warn("Failed to delete user from Firebase Auth:", authError);
    }

    res.json({ success: true, message: `User ${userId} completely deleted` });
  } catch (error: unknown) {
    console.error("User deletion failed:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.get("/feedback", async (_req: AuthRequest, res) => {
  try {
    const feedback = await Feedback.find({})
      .sort({ submittedAt: -1 })
      .select('-__v')
      .limit(100);
    
    res.json({ feedback });
  } catch (error: unknown) {
    console.error("Feedback fetching failed:", error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

router.get("/errors", async (_req: AuthRequest, res) => {
  try {
    const errors = await ErrorLog.find({})
      .sort({ timestamp: -1 })
      .select('-__v')
      .limit(100);
    
    res.json({ errors });
  } catch (error: unknown) {
    console.error("Error logs fetching failed:", error);
    res.status(500).json({ error: "Failed to fetch error logs" });
  }
});

// ── Image Generation Tracking ──────────────────────
router.get("/images", async (_req: AuthRequest, res) => {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("analytics")
      .where("type", "==", "image-generated")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const images: any[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userId = data.userId;
      
      // Get user info
      let userName = "Unknown User";
      let userEmail = "unknown@email.com";
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userName = userData?.name || "Unnamed";
          userEmail = userData?.email || "unknown@email.com";
        }
      } catch (e) {
        console.warn("Could not fetch user info:", e);
      }

      images.push({
        _id: doc.id,
        userId,
        userName,
        userEmail,
        timestamp: data.timestamp?.toDate?.() || new Date(),
        type: "image-generated",
      });
    }

    res.json({ images });
  } catch (error: unknown) {
    console.error("Image generation fetch failed:", error);
    res.status(500).json({ error: "Failed to fetch image generations" });
  }
});

// ── Survey Management ──────────────────────────────
router.get("/surveys", async (_req: AuthRequest, res) => {
  try {
    const surveys = await Survey.find({})
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json({ surveys });
  } catch (error: unknown) {
    console.error("Surveys fetching failed:", error);
    res.status(500).json({ error: "Failed to fetch surveys" });
  }
});

router.post("/surveys", async (req: AuthRequest, res) => {
  try {
    const { title, question, options } = req.body;
    
    if (!title || !question || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ error: "Missing required fields: title, question, options" });
    }

    const formattedOptions = options.map((text: string, index: number) => ({
      id: `option-${index}`,
      text,
      count: 0,
    }));

    const survey = new Survey({
      title,
      question,
      options: formattedOptions,
      isActive: true,
    });

    await survey.save();
    res.status(201).json({ survey });
  } catch (error: unknown) {
    console.error("Survey creation failed:", error);
    res.status(500).json({ error: "Failed to create survey" });
  }
});

router.get("/surveys/:surveyId/results", async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const survey = await Survey.findById(surveyId);
    
    if (!survey) {
      return res.status(404).json({ error: "Survey not found" });
    }

    const responseCount = await SurveyResponse.countDocuments({ surveyId });
    
    res.json({ 
      survey, 
      totalResponses: responseCount,
      responsePercentages: survey.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        count: opt.count,
        percentage: responseCount > 0 ? ((opt.count / responseCount) * 100).toFixed(1) : 0,
      })),
    });
  } catch (error: unknown) {
    console.error("Survey results fetching failed:", error);
    res.status(500).json({ error: "Failed to fetch survey results" });
  }
});

export default router;
