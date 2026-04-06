import express from "express";
import * as aiService from "./services/aiService";
import paymentRoutes from "./routes/payment";
import adminRoutes from "./routes/admin";
import { verifyFirebaseToken, AuthRequest } from "./middleware/auth";
import { checkUsage } from "./middleware/checkUsage";
import { getAdminDb, FieldValue } from "./services/firebaseAdmin";

const router = express.Router();

console.log("[PostAura] Admin server router initialized");

function isGeminiQuotaError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null
        ? JSON.stringify(err)
        : String(err);
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    /quota|rate.?limit/i.test(msg)
  );
}

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "PostAura Backend is running" });
});

// Payment routes
router.use("/payment", paymentRoutes);

console.log("[PostAura] Mounting admin routes at /api/admin");
router.use("/admin", adminRoutes);

// AI routes with auth and usage check
router.post("/ai/synthesize", verifyFirebaseToken, checkUsage, async (req: AuthRequest, res) => {
  try {
    const { topic, takeaway, audience, tone } = req.body;

    // Read voice profile from user doc
    let voiceProfile = null;
    try {
      const userDoc = await getAdminDb().collection("users").doc(req.user!.uid).get();
      if (userDoc.exists) {
        voiceProfile = userDoc.data()?.voiceProfile || null;
      }
    } catch (e) {
      console.warn("Could not read voice profile:", e);
    }

    const result = await aiService.synthesizePost(topic, takeaway || "", audience, tone, voiceProfile);

    // Update voice profile in background (don't block response)
    updateVoiceProfile(req.user!.uid, result).catch(e => console.warn("Voice profile update failed:", e));

    // Build visible voice tags for the frontend
    const voiceTags: string[] = [];
    if (voiceProfile) {
      if (voiceProfile.prefersCasual) voiceTags.push("Casual");
      if (voiceProfile.prefersSpecific) voiceTags.push("Specific");
      if (voiceProfile.prefersStrongStance) voiceTags.push("Bold");
      if (voiceProfile.avgSentenceLength === "short") voiceTags.push("Concise");
      else if (voiceProfile.avgSentenceLength === "long") voiceTags.push("Detailed");
      if (voiceProfile.usesEmojis) voiceTags.push("Emoji-friendly");
      if (voiceProfile.asksQuestions) voiceTags.push("Conversational");
      if (voiceProfile.perspective === "first-person") voiceTags.push("Personal");
    }

    // Log generation analytics
    try {
      await getAdminDb().collection("analytics").add({
        type: "post-generated",
        userId: req.user!.uid,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn("Analytics log failed:", e);
    }

    res.json({ 
      result, 
      voiceTags, 
      postsAnalyzed: voiceProfile?.postsAnalyzed || 0,
    });
  } catch (error: any) {
    console.error("Synthesize error:", error);
    if (isGeminiQuotaError(error)) {
      return res.status(429).json({
        code: "QUOTA_EXCEEDED",
        error:
          "Gemini API quota exceeded. Check your Google AI plan and billing, or try again later.",
      });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post("/ai/iterate", verifyFirebaseToken, checkUsage, async (req, res) => {
  try {
    const { currentContent, instruction } = req.body;
    const result = await aiService.iteratePost(currentContent, instruction);
    res.json({ result });
  } catch (error: any) {
    console.error("Iterate error:", error);
    if (isGeminiQuotaError(error)) {
      return res.status(429).json({
        code: "QUOTA_EXCEEDED",
        error:
          "Gemini API quota exceeded. Check your Google AI plan and billing, or try again later.",
      });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post("/ai/generate-image", verifyFirebaseToken, checkUsage, async (req: AuthRequest, res) => {
  try {
    const { prompt, size } = req.body;
    const url = await aiService.generateImage(prompt, size);
    
    // Log image generation analytics
    try {
      await getAdminDb().collection("analytics").add({
        type: "image-generated",
        userId: req.user?.uid,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn("Analytics log failed:", e);
    }

    res.json({ url });
  } catch (error: any) {
    console.error("Generate image error:", error);
    if (isGeminiQuotaError(error)) {
      return res.status(429).json({
        code: "QUOTA_EXCEEDED",
        error:
          "Gemini API quota exceeded. Check your Google AI plan and billing, or try again later.",
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Voice feedback endpoint — learns from user corrections
router.post("/ai/voice-feedback", verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const { type, reason, content } = req.body;
    const userRef = getAdminDb().collection("users").doc(req.user!.uid);
    
    if (type === "approved" && content) {
      // User confirmed this sounds like them — reinforce the profile from this content
      await updateVoiceProfile(req.user!.uid, content);
    }

    if (type === "rejected" && reason) {
      // Direct signal — stronger than automatic analysis
      const userDoc = await userRef.get();
      const existing = userDoc.exists ? userDoc.data()?.voiceProfile || {} : {};
      const corrections = existing.corrections || {};
      corrections[reason] = (corrections[reason] || 0) + 1;

      // Apply direct corrections to profile
      const updates: Record<string, any> = { "voiceProfile.corrections": corrections };
      if (reason === "too formal") {
        updates["voiceProfile.prefersCasual"] = true;
      } else if (reason === "too long") {
        updates["voiceProfile.avgSentenceLength"] = "short";
      } else if (reason === "too generic") {
        updates["voiceProfile.prefersSpecific"] = true;
      } else if (reason === "not my opinion") {
        updates["voiceProfile.prefersStrongStance"] = true;
      }
      
      await userRef.update(updates);
    }

    res.json({ ok: true });
  } catch (error) {
    console.warn("Voice feedback error:", error);
    res.json({ ok: true }); // Don't fail the user experience
  }
});

// Analytics tracking endpoint
router.post("/analytics/track-intent", verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body;
    await getAdminDb().collection("analytics").add({
      type: "intent",
      plan,
      userId: req.user!.uid,
      timestamp: FieldValue.serverTimestamp(),
    });
    res.json({ ok: true });
  } catch (error) {
    console.warn("Intent tracking failed:", error);
    res.json({ ok: true });
  }
});

export default router;

// ── Voice Profile Analysis ────────────────────────────────────
interface VoiceProfile {
  avgSentenceLength: "short" | "medium" | "long";
  avgWordsPerSentence: number;
  usesEmojis: boolean;
  perspective: "first-person" | "neutral";
  asksQuestions: boolean;
  postsAnalyzed: number;
}

function analyzeContent(content: string): Omit<VoiceProfile, "postsAnalyzed"> {
  const sentences = content.split(/[.!?\n]+/).filter(s => s.trim().length > 5);
  const wordCounts = sentences.map(s => s.trim().split(/\s+/).length);
  const avgWords = wordCounts.length > 0 ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 12;

  const hasEmojis = /[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/u.test(content);
  const firstPersonCount = (content.match(/\bI\b/g) || []).length;
  const questionCount = (content.match(/\?/g) || []).length;

  return {
    avgSentenceLength: avgWords < 10 ? "short" : avgWords < 18 ? "medium" : "long",
    avgWordsPerSentence: Math.round(avgWords),
    usesEmojis: hasEmojis,
    perspective: firstPersonCount > 2 ? "first-person" : "neutral",
    asksQuestions: questionCount > 0,
  };
}

async function updateVoiceProfile(userId: string, content: string) {
  const analysis = analyzeContent(content);
  const userRef = getAdminDb().collection("users").doc(userId);
  const userDoc = await userRef.get();
  const existing: VoiceProfile | null = userDoc.exists ? userDoc.data()?.voiceProfile || null : null;

  if (!existing) {
    // First post — set initial profile
    await userRef.set({
      voiceProfile: { ...analysis, postsAnalyzed: 1 }
    }, { merge: true });
  } else {
    // Merge with running average  
    const n = existing.postsAnalyzed || 1;
    const newAvg = Math.round((existing.avgWordsPerSentence * n + analysis.avgWordsPerSentence) / (n + 1));
    await userRef.set({
      voiceProfile: {
        avgSentenceLength: newAvg < 10 ? "short" : newAvg < 18 ? "medium" : "long",
        avgWordsPerSentence: newAvg,
        usesEmojis: analysis.usesEmojis || existing.usesEmojis, // if they ever use emojis
        perspective: analysis.perspective === "first-person" || existing.perspective === "first-person" ? "first-person" : "neutral",
        asksQuestions: analysis.asksQuestions || existing.asksQuestions,
        postsAnalyzed: n + 1,
      }
    }, { merge: true });
  }
}
