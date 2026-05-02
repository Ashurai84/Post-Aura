// ═══════════════════════════════════════════════════════════════════════════
// 🚀 AI Service: Google Gemini (Hybrid Free + Paid Rotation)
// ═══════════════════════════════════════════════════════════════════════════
// Free keys are loaded from GEMINI_API_KEY (comma-separated).
// Paid key is loaded from GEMINI_PAID_KEY and kept last in the pool.
// ═══════════════════════════════════════════════════════════════════════════

import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// ── Multi-Key Configuration ───────────────────────────────────────────────
const pollinationsApiKey = process.env.POLLINATIONS_API_KEY;
const KEY_EXHAUSTION_WINDOW_MS = 23 * 60 * 60 * 1000;

interface GeminiKeyEntry {
  key: string;
  isPaid: boolean;
  client: GoogleGenerativeAI;
  exhaustedAt: number | null;
}

// Parse comma-separated free keys first, then append the paid key last.
const rawFreeKeys = process.env.GEMINI_API_KEY || "";
const freeKeyValues = rawFreeKeys
  .split(",")
  .map((k) => k.trim())
  .filter((k) => k.length > 0);

const paidKeyValue = (process.env.GEMINI_PAID_KEY || "").trim();

const allKeys: GeminiKeyEntry[] = [
  ...freeKeyValues.map((key) => ({
    key,
    isPaid: false,
    client: new GoogleGenerativeAI(key),
    exhaustedAt: null,
  })),
  ...(paidKeyValue
    ? [
        {
          key: paidKeyValue,
          isPaid: true,
          client: new GoogleGenerativeAI(paidKeyValue),
          exhaustedAt: null,
        },
      ]
    : []),
];

const freeKeys = allKeys.filter((entry) => !entry.isPaid);
const paidKey = allKeys.find((entry) => entry.isPaid) || null;
const keyExhaustedAt = new Map<number, number>();

if (freeKeys.length === 0 && !paidKey) {
  console.warn("⚠️  GEMINI_API_KEY and GEMINI_PAID_KEY are not defined in backend/.env");
} else {
  console.log(
    `HYBRID KEY SYSTEM COMPLETE ✓ Free keys: ${freeKeys.length} loaded | Paid key: ${paidKey ? "loaded" : "not found"} | Model order: 1.5 → 2.0 → 2.5`,
  );
}

// Round-robin index — rotates through keys on each request
let currentKeyIndex = 0;

function isKeyFresh(keyIndex: number): boolean {
  const exhaustedAt = keyExhaustedAt.get(keyIndex) ?? allKeys[keyIndex]?.exhaustedAt ?? null;
  if (exhaustedAt === null) return true;
  return Date.now() - exhaustedAt >= KEY_EXHAUSTION_WINDOW_MS;
}

function markKeyExhausted(keyIndex: number): void {
  const now = Date.now();
  keyExhaustedAt.set(keyIndex, now);
  if (allKeys[keyIndex]) {
    allKeys[keyIndex].exhaustedAt = now;
  }
}

function countExhaustedFreeKeys(): number {
  return freeKeys.reduce((count, entry) => {
    const keyIndex = allKeys.findIndex((candidate) => candidate.key === entry.key && !candidate.isPaid);
    if (keyIndex === -1) return count;
    return isKeyFresh(keyIndex) ? count : count + 1;
  }, 0);
}

function getNextClient(usedKeys: Set<number>): { client: GoogleGenerativeAI; keyIndex: number; isPaid: boolean } | null {
  if (allKeys.length === 0) return null;

  const freeCount = freeKeys.length;
  const exhaustedFreeCount = countExhaustedFreeKeys();

  for (let offset = 0; offset < allKeys.length; offset += 1) {
    const keyIndex = (currentKeyIndex + offset) % allKeys.length;
    const entry = allKeys[keyIndex];

    if (usedKeys.has(keyIndex)) continue;
    if (entry.isPaid) continue;
    if (!isKeyFresh(keyIndex)) continue;

    currentKeyIndex = (keyIndex + 1) % allKeys.length;
    return { client: entry.client, keyIndex, isPaid: entry.isPaid };
  }

  if (!paidKey) return null;

  if (freeCount > 0 && exhaustedFreeCount < freeCount) {
    throw new Error("Free tier exhausted on this key, rotating to next free key");
  }

  const paidKeyIndex = allKeys.findIndex((entry) => entry.isPaid);
  if (paidKeyIndex === -1 || usedKeys.has(paidKeyIndex) || !isKeyFresh(paidKeyIndex)) {
    return null;
  }

  currentKeyIndex = (paidKeyIndex + 1) % allKeys.length;
  return { client: paidKey.client, keyIndex: paidKeyIndex, isPaid: true };
}

// Models in priority order — optimized for free-tier limits
const MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
];

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as any).status;
    return status === 429 || status === 503;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|quota|rate.?limit/i.test(msg);
}

function isQuotaExhausted(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
}

async function callWithRotationAndFallback(
  promptFn: (ai: GoogleGenerativeAI, model: string) => Promise<string>,
  maxRetries = 0, // No retries — just rotate to next model/key instantly
): Promise<string> {
  if (allKeys.length === 0) {
    throw new Error("AI service is not configured. GEMINI_API_KEY / GEMINI_PAID_KEY is missing.");
  }

  let lastError: any = null;
  const keysAttempted = new Set<number>();

  // Try each API key once per call, preferring fresh free keys before the paid key.
  while (keysAttempted.size < allKeys.length) {
    const entry = getNextClient(keysAttempted);

    if (!entry) break;

    if (keysAttempted.has(entry.keyIndex)) continue;
    keysAttempted.add(entry.keyIndex);

    // For each key, try each model
    let paidKeyWarningLogged = false;
    for (const model of MODELS) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (entry.isPaid) {
            if (!paidKeyWarningLogged) {
              console.warn("[Gemini] ⚠️ Using PAID key — free tier exhausted");
              paidKeyWarningLogged = true;
            }
            console.log(`[Gemini] ⚠️ PAID key | ${model}`);
          } else {
            const freeKeyIndex = freeKeys.findIndex((candidate) => candidate.key === allKeys[entry.keyIndex].key && !candidate.isPaid) + 1;
            console.log(`[Gemini] FREE Key ${freeKeyIndex}/${freeKeys.length} | ${model}`);
          }
          const result = await promptFn(entry.client, model);
          if (result) return result;
          throw new Error("Empty response from Gemini");
        } catch (err) {
          lastError = err;
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[Gemini] Key ${entry.keyIndex + 1} | ${model}:`, errMsg.substring(0, 100));

          // If quota exhausted on this key, skip to next KEY immediately
          if (isQuotaExhausted(err)) {
            markKeyExhausted(entry.keyIndex);
            console.warn(`[Gemini] Key ${entry.keyIndex + 1} exhausted, moving to next...`);
            break;
          }

          // Non-retryable or last attempt → try next model
          break;
        }
      }

      // If quota exhausted, don't try more models on this key
      if (lastError && isQuotaExhausted(lastError)) break;
    }
  }

  console.error(`[Gemini] All ${allKeys.length} key(s) × ${MODELS.length} model(s) failed.`);
  if (lastError) throw lastError;
  throw new Error("All Gemini keys and models failed. Please try again later.");
}


export async function synthesizePost(
  topic: string,
  takeaway: string,
  audience: string,
  tone: string,
  voiceProfile?: any,
  hashtagCount = 5,
): Promise<string> {
  // Build voice instructions from profile
  let voiceInstructions = "";
  if (voiceProfile) {
    const parts: string[] = [];

    if (voiceProfile.prefersCasual) {
      parts.push("IMPORTANT: Write CASUALLY. Sound like a college student sharing with friends, not a corporate exec. Use simple words and short sentences.");
    }
    if (voiceProfile.prefersSpecific) {
      parts.push("IMPORTANT: Be VERY SPECIFIC. Use concrete details, numbers, names. Remove any generic advice that could apply to anyone.");
    }
    if (voiceProfile.prefersStrongStance) {
      parts.push("IMPORTANT: Make the opinion LOUD and PROVOCATIVE. The reader should feel the author's conviction. Don't hedge or soften the stance.");
    }

    if (voiceProfile.postsAnalyzed >= 2) {
      if (voiceProfile.avgSentenceLength === "short") {
        parts.push("Use SHORT, punchy sentences (under 10 words on average). Be direct.");
      } else if (voiceProfile.avgSentenceLength === "long") {
        parts.push("Use flowing, detailed sentences. The user writes in longer form.");
      }
      if (voiceProfile.usesEmojis) {
        parts.push("Include a few relevant emojis naturally — the user likes them.");
      } else {
        parts.push("Do NOT use emojis — the user doesn't use them.");
      }
      if (voiceProfile.perspective === "first-person") {
        parts.push("Write in strong first-person voice. Use 'I' frequently.");
      }
      if (voiceProfile.asksQuestions) {
        parts.push("Include 1-2 rhetorical questions — the user's style includes them.");
      }
    }

    if (parts.length > 0) {
      const postsInfo = voiceProfile.postsAnalyzed ? ` from ${voiceProfile.postsAnalyzed} posts` : " from profile analysis";
      voiceInstructions = `\n    VOICE PROFILE (learned${postsInfo}):\n    ${parts.join("\n    ")}`;
    }
  }

  const prompt = `
    You are an expert LinkedIn copywriter. Write authentic, human-sounding posts centered on the author's PERSONAL TAKEAWAY.

    TOPIC: ${topic}
    TAKEAWAY: ${takeaway}
    AUDIENCE: ${audience}
    TONE: ${tone}
    ${voiceInstructions}

    FORMATTING RULES:
    1. Use **bold** for hook, key phrases, and CTA
    2. Strategic emojis (3-5 total)
    3. Generous line breaks
    4. 150-250 words
    5. Premium feel

    CONTENT RULES:
    - Center on takeaway
    - NO generic summaries
    - NO fluff: "delve", "tapestry", "game-changer", etc.
    - Hook → Context → Insight → CTA
    - Short, punchy sentences
    - First-person voice
    
    HashTags: Generate exactly ${hashtagCount} relevant hashtags.
  `;

  return callWithRotationAndFallback(async (ai, model) => {
    const genModel = ai.getGenerativeModel({ model });
    const response = await genModel.generateContent(prompt);
    return response.response.text() || "";
  });
}

export async function iteratePost(
  currentContent: string,
  instruction: string,
  existingHashtags: string[] = [],
  hashtagCount = 5,
): Promise<string> {
  const prompt = `
    You are an expert LinkedIn copywriter editing an existing post.

    Current Post:
    """
    ${currentContent}
    """

    Instruction for iteration: ${instruction}
    Current hashtags: ${existingHashtags.join(" ")}

    RULES:
    1. Apply instruction
    2. No new facts
    3. No robotic fluff
    4. Maintain LinkedIn formatting
    5. Keep exactly ${hashtagCount} hashtags.
    6. Return ONLY updated content.
  `;

  return callWithRotationAndFallback(async (ai, model) => {
    const genModel = ai.getGenerativeModel({ model });
    const response = await genModel.generateContent(prompt);
    return response.response.text() || "";
  });
}

export async function generateImage(prompt: string, size: "1K" | "2K" | "4K"): Promise<string> {
  let width = 1024;
  let height = 1024;

  if (size === "2K") {
    width = 2048;
    height = 2048;
  } else if (size === "4K") {
    width = 3840;
    height = 3840;
  }

  const encodedPrompt = encodeURIComponent(prompt);
  const baseUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux&width=${width}&height=${height}&seed=0&enhance=false`;
  const url = pollinationsApiKey ? `${baseUrl}&key=${pollinationsApiKey}` : baseUrl;

  return url;
}
