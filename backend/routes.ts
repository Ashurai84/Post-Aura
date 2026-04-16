import express from "express";
import * as aiService from "./services/aiService";
import paymentRoutes from "./routes/payment";
import adminRoutes from "./routes/admin";
import { verifyFirebaseToken, AuthRequest } from "./middleware/auth";
import { checkUsage } from "./middleware/checkUsage";
import { getAdminDb, FieldValue } from "./services/firebaseAdmin";
import { Survey, SurveyResponse } from "./models/Survey.model";

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

function extractHashtags(text: string): string[] {
  const matches = text.match(/(^|\s)#([A-Za-z][A-Za-z0-9_]{1,29})/g) || [];
  const clean = matches
    .map((m) => m.trim())
    .map((m) => (m.startsWith("#") ? m : `#${m.replace(/^\s+/, "")}`));
  return [...new Set(clean)];
}

function fallbackHashtags(topic: string, audience: string): string[] {
  const words = `${topic} ${audience}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, 10)
    .map((w) => `#${w.charAt(0).toUpperCase()}${w.slice(1)}`);

  const base = [
    "#BuildInPublic",
    "#FounderLife",
    "#CareerGrowth",
    "#StartupIndia",
    "#TechFounders",
    "#StudentBuilders",
    "#DigitalCreators",
    "#WorkSmarter",
    "#GrowthMindset",
    "#CreatorEconomy",
  ];

  return [...new Set([...words, ...base])].slice(0, 12);
}

function normalizeHashtagCount(value: unknown): 3 | 5 | 10 {
  if (value === 3 || value === "3") return 3;
  if (value === 10 || value === "10") return 10;
  return 5;
}

function ensureMandatoryHashtags(extracted: string[], topic: string, audience: string, targetCount: number): string[] {
  const banned = new Set(["#LinkedIn", "#Post", "#Content"]);
  const cleanExtracted = (extracted || []).filter((tag) => !banned.has(tag));
  const fallback = fallbackHashtags(topic, audience).filter((tag) => !banned.has(tag));
  const merged = [...new Set([...cleanExtracted, ...fallback])];

  if (merged.length >= targetCount) {
    return merged.slice(0, targetCount);
  }

  const globalFallback = [
    "#BuildInPublic",
    "#FounderLife",
    "#StartupIndia",
    "#TechFounders",
    "#StudentBuilders",
    "#CareerGrowth",
    "#DigitalCreators",
    "#CreatorEconomy",
    "#GrowthMindset",
    "#WorkSmarter",
  ].filter((tag) => !banned.has(tag));
  return [...new Set([...merged, ...globalFallback])].slice(0, targetCount);
}

function appendHashtagLineIfMissing(text: string, hashtags: string[]): string {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return hashtags.join(" ");
  }

  const hasHashtagInBody = /(^|\s)#[A-Za-z][A-Za-z0-9_]{1,29}/.test(normalized);
  if (hasHashtagInBody) {
    return normalized;
  }

  return `${normalized}\n\n${hashtags.join(" ")}`;
}

function recommendBestPostingTime(audience: string, topic: string, tone: string): { label: string; reason: string } {
  const a = audience.toLowerCase();
  const t = topic.toLowerCase();
  const tn = tone.toLowerCase();

  if (a.includes("student") || t.includes("college") || t.includes("campus")) {
    return {
      label: "Tomorrow, 9:00 AM",
      reason: "Students and early-career audiences engage most in the morning before classes/work.",
    };
  }

  if (a.includes("founder") || a.includes("ceo") || t.includes("startup") || t.includes("saas")) {
    return {
      label: "Tuesday, 8:30 AM",
      reason: "Founder/professional audiences typically engage strongly in weekday morning windows.",
    };
  }

  if (tn.includes("controversial") || tn.includes("hot")) {
    return {
      label: "Today, 8:00 PM",
      reason: "Debate-style posts often perform better in evening scroll sessions.",
    };
  }

  return {
    label: "Tomorrow, 10:00 AM",
    reason: "General professional engagement is usually strongest in late morning.",
  };
}

function toDateSafe(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getHourBucketLabel(hour: number): string {
  if (hour >= 7 && hour < 10) return "9:00 AM";
  if (hour >= 10 && hour < 13) return "11:00 AM";
  if (hour >= 13 && hour < 16) return "2:00 PM";
  if (hour >= 16 && hour < 19) return "5:30 PM";
  return "8:00 PM";
}

async function recommendBestPostingTimeForUser(
  userId: string,
  audience: string,
  topic: string,
  tone: string,
): Promise<{ label: string; reason: string }> {
  try {
    const postsSnap = await getAdminDb()
      .collection("posts")
      .where("userId", "==", userId)
      .limit(120)
      .get();

    if (postsSnap.empty) {
      return recommendBestPostingTime(audience, topic, tone);
    }

    const scores: Record<string, number> = {};
    const counts: Record<string, number> = {};
    const topicTokens = String(topic || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3);

    postsSnap.docs.forEach((doc) => {
      const data = doc.data() as any;
      const ts = toDateSafe(data.copiedAt) || toDateSafe(data.updatedAt) || toDateSafe(data.createdAt);
      if (!ts) return;

      const hour = ts.getHours();
      const bucket = getHourBucketLabel(hour);

      const perf = data.performance;
      let weight = 0.35;
      if (perf === "hot") weight = 3;
      else if (perf === "average") weight = 1;
      else if (perf === "flopped") weight = -1;

      const postTopic = String(data.topic || "").toLowerCase();
      const postAudience = String(data.audience || "").toLowerCase();
      const postTone = String(data.tone || "").toLowerCase();

      if (topicTokens.some((tok) => postTopic.includes(tok))) weight += 0.5;
      if (audience && postAudience === String(audience).toLowerCase()) weight += 0.4;
      if (tone && postTone === String(tone).toLowerCase()) weight += 0.2;

      scores[bucket] = (scores[bucket] || 0) + weight;
      counts[bucket] = (counts[bucket] || 0) + 1;
    });

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (!best) {
      return recommendBestPostingTime(audience, topic, tone);
    }

    const [bestLabel] = best;
    const sampleCount = counts[bestLabel] || 0;
    if (sampleCount < 2) {
      return recommendBestPostingTime(audience, topic, tone);
    }

    return {
      label: `Tomorrow, ${bestLabel}`,
      reason: `Based on your past posts, this time window has shown stronger engagement for your content style.`,
    };
  } catch (error) {
    console.warn("Personalized posting-time recommendation failed:", error);
    return recommendBestPostingTime(audience, topic, tone);
  }
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
    const { topic, takeaway, audience, tone, hashtagCount } = req.body;
    const targetHashtagCount = normalizeHashtagCount(hashtagCount);

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

    const rawResult = await aiService.synthesizePost(topic, takeaway || "", audience, tone, voiceProfile, targetHashtagCount);
    const extractedHashtags = extractHashtags(rawResult);
    const safeHashtags = ensureMandatoryHashtags(extractedHashtags, topic || "", audience || "", targetHashtagCount);
    const result = appendHashtagLineIfMissing(rawResult, safeHashtags);
    const bestPostingTime = await recommendBestPostingTimeForUser(
      req.user!.uid,
      audience || "",
      topic || "",
      tone || "",
    );

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
      hashtags: safeHashtags,
      bestPostingTime,
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
    // Do not leak internal error details to clients in production
    res.status(500).json({ error: "Internal server error. Please try again." });
  }
});

router.post("/ai/iterate", verifyFirebaseToken, checkUsage, async (req, res) => {
  try {
    const { currentContent, instruction, topic, audience, hashtags, hashtagCount } = req.body;
    const targetHashtagCount = normalizeHashtagCount(hashtagCount);
    const lockedHashtags = Array.isArray(hashtags) ? hashtags.filter((tag) => typeof tag === "string") : [];
    const rawResult = await aiService.iteratePost(currentContent, instruction, lockedHashtags, targetHashtagCount);
    const extractedHashtags = extractHashtags(rawResult);
    const safeHashtags = ensureMandatoryHashtags(
      extractedHashtags.length > 0 ? extractedHashtags : lockedHashtags,
      topic || "",
      audience || "",
      targetHashtagCount,
    );
    const result = appendHashtagLineIfMissing(rawResult, safeHashtags);
    res.json({ result, hashtags: safeHashtags });
  } catch (error: any) {
    console.error("Iterate error:", error);
    if (isGeminiQuotaError(error)) {
      return res.status(429).json({
        code: "QUOTA_EXCEEDED",
        error:
          "Gemini API quota exceeded. Check your Google AI plan and billing, or try again later.",
      });
    }
    // Do not leak internal error details to clients in production
    res.status(500).json({ error: "Internal server error. Please try again." });
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
    // Do not leak internal error details to clients in production
    res.status(500).json({ error: "Internal server error. Please try again." });
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

// ── Survey Submission ──────────────────────────────
router.get("/survey/active", async (_req, res) => {
  try {
    const survey = await Survey.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json({ survey: survey || null });
  } catch (error: unknown) {
    console.error("Active survey fetch failed:", error);
    res.status(500).json({ error: "Failed to fetch survey" });
  }
});

router.post("/survey/respond", verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const { surveyId, optionId } = req.body;
    
    if (!surveyId || !optionId) {
      return res.status(400).json({ error: "Missing surveyId or optionId" });
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: "Survey not found" });
    }

    // Check if user already responded
    const existingResponse = await SurveyResponse.findOne({
      userId: req.user!.uid,
      surveyId,
    });

    if (existingResponse) {
      return res.status(400).json({ error: "You have already responded to this survey" });
    }

    // Increment option count
    const option = survey.options.find(opt => opt.id === optionId);
    if (!option) {
      return res.status(404).json({ error: "Option not found" });
    }

    option.count += 1;
    await survey.save();

    // Save response
    const response = new SurveyResponse({
      userId: req.user!.uid,
      surveyId,
      optionId,
    });
    await response.save();

    res.json({ ok: true, message: "Survey response recorded" });
  } catch (error: unknown) {
    console.error("Survey response save failed:", error);
    res.status(500).json({ error: "Failed to save survey response" });
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
