// ═══════════════════════════════════════════════════════════════════════════
// 🚀 AI Service: Google Gemini
// ═══════════════════════════════════════════════════════════════════════════

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

// ── Gemini Configuration ──────────────────────────────────────────────────
const geminiApiKey = process.env.GEMINI_API_KEY;
const pollinationsApiKey = process.env.POLLINATIONS_API_KEY;

if (!geminiApiKey) {
  console.warn("⚠️  GEMINI_API_KEY is not defined in backend/.env");
}

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Models in priority order — falls back if primary hits quota/unavailable
const MODELS = [
  "gemini-2.5-flash",       // ⭐ Primary — has free-tier quota (5 RPM, 20 RPD)
  "gemini-2.0-flash-lite",  // Lightweight fallback
];

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as any).status;
    return status === 429 || status === 503; // Rate limit or service unavailable
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|quota|rate.?limit/i.test(msg);
}

async function callWithRetryAndFallback(
  promptFn: (model: string) => Promise<string>,
  maxRetries = 2,
): Promise<string> {
  let lastError: any = null;
  
  for (const model of MODELS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini] Request: model=${model}, attempt=${attempt + 1}`);
        const result = await promptFn(model);
        if (result) return result;
        throw new Error("Empty response from Gemini");
      } catch (err) {
        lastError = err;
        console.error(`[Gemini] Error on ${model} (attempt ${attempt + 1}):`, err instanceof Error ? err.message : err);

        if (isRetryableError(err) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(`[Gemini] Retrying ${model} in ${Math.round(delay)}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        
        // If it's not retryable on THIS model, or we've run out of retries,
        // break to try the NEXT model in the list.
        console.warn(`[Gemini] Model ${model} failed, trying next available model...`);
        break; 
      }
    }
  }
  
  console.error("[Gemini] All models failed. Last error:", lastError);
  // Re-throw the original error so route-level quota detection can inspect it
  if (lastError) throw lastError;
  throw new Error("All Gemini models failed. Please try again later.");
}

export async function synthesizePost(
  topic: string,
  takeaway: string,
  audience: string,
  tone: string,
  voiceProfile?: any,
  hashtagCount = 5,
): Promise<string> {
  if (!ai) {
    throw new Error("AI service is not configured. GEMINI_API_KEY is missing.");
  }

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

  return callWithRetryAndFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.8,
      },
    });
    return response.text || "";
  });
}

export async function iteratePost(
  currentContent: string,
  instruction: string,
  existingHashtags: string[] = [],
  hashtagCount = 5,
): Promise<string> {
  if (!ai) {
    throw new Error("AI service is not configured. GEMINI_API_KEY is missing.");
  }

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

  return callWithRetryAndFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || "";
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
