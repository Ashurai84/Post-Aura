// ═══════════════════════════════════════════════════════════════════════════
// 🚀 AI Service: Groq (LLaMA Models)
// ═══════════════════════════════════════════════════════════════════════════
// SWITCHED TO: Groq API (llama-3.3-70b-versatile) - Free, fast, unlimited
// REASON: Google Gemini quota exceeded - Groq provides unlimited access
// 
// TO REVERT TO GEMINI: See commented code at bottom of file
// ═══════════════════════════════════════════════════════════════════════════

import dotenv from "dotenv";
dotenv.config();

// ── Groq Configuration ────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const pollinationsApiKey = process.env.POLLINATIONS_API_KEY;

if (!GROQ_API_KEY) {
  console.warn("⚠️  GROQ_API_KEY is not defined in backend/.env");
  console.warn("   Post generation will fail. Add: GROQ_API_KEY=gsk_...");
}

// Models in priority order — falls back if primary hits quota/unavailable
const MODELS = [
  "llama-3.3-70b-versatile",  // ⭐ Best quality (280 T/sec)
  "llama-3.1-8b-instant",     // Fast alternative (560 T/sec)
];

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as any).status;
    return status === 429 || status === 503; // Rate limit or service unavailable
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /429|503|RATE_LIMIT|SERVICE_UNAVAILABLE|quota|rate.?limit/i.test(msg);
}

async function callGroqAPI(model: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    const err: any = new Error(error.error?.message || "Groq API error");
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callWithRetryAndFallback(
  promptFn: (model: string) => Promise<string>,
  maxRetries = 2,
): Promise<string> {
  let lastError: any = null;
  
  for (const model of MODELS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Groq] Request: model=${model}, attempt=${attempt + 1}`);
        const result = await promptFn(model);
        if (result) return result;
        throw new Error("Empty response from Groq");
      } catch (err) {
        lastError = err;
        console.error(`[Groq] Error on ${model} (attempt ${attempt + 1}):`, err instanceof Error ? err.message : err);

        if (isRetryableError(err) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(`[Groq] Retrying ${model} in ${Math.round(delay)}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        
        // If it's not retryable on THIS model, or we've run out of retries,
        // break to try the NEXT model in the list.
        console.warn(`[Groq] Model ${model} failed, trying next available model...`);
        break; 
      }
    }
  }
  
  console.error("[Groq] All models failed. Last error:", lastError);
  throw new Error(lastError?.message || "All Groq models failed. Please try again later.");
}


export async function synthesizePost(
  topic: string,
  takeaway: string,
  audience: string,
  tone: string,
  voiceProfile?: any,
  hashtagCount = 5,
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("AI service is not configured. GROQ_API_KEY is missing.");
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

  const systemPrompt = `You are an expert LinkedIn copywriter. Write authentic, human-sounding posts centered on the author's PERSONAL TAKEAWAY.`;

  const userPrompt = `
Create a LinkedIn post with these details:
- What happened: ${topic}
- Author's opinion: ${takeaway}
- Target audience: ${audience}
- Tone: ${tone}
${voiceInstructions}

FORMATTING RULES:
1. Use **bold** for hook, key phrases, and CTA
2. Strategic emojis (3-5 total, not decorative)
3. Generous line breaks between paragraphs
4. 150-250 words total
5. Premium feel - like from a 50K+ follower account

CONTENT RULES:
- Post MUST center on the takeaway (author's opinion/belief)
- NO generic summaries - make it unique
- NO fluff: "delve", "tapestry", "game-changer", "unlock", "supercharge"
- Structure: Hook → Context → Insight → CTA
- Short, punchy sentences
- First-person voice
- Hook should be provocative

END WITH: Exactly ${hashtagCount} highly relevant hashtags (one per line, start with #)
`;

  return callWithRetryAndFallback(async (model) => {
    const response = await callGroqAPI(model, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    return response;
  });
}

export async function iteratePost(
  currentContent: string,
  instruction: string,
  existingHashtags: string[] = [],
  hashtagCount = 5,
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("AI service is not configured. GROQ_API_KEY is missing.");
  }

  const systemPrompt = `You are an expert LinkedIn copywriter editing an existing post.`;

  const userPrompt = `
Current Post:
"""
${currentContent}
"""

Instruction for iteration: ${instruction}
Current locked hashtags:
${existingHashtags.join(" ")}

CRITICAL RULES:
1. Apply the instruction to the current post.
2. DO NOT hallucinate new facts or change the original core story/message.
3. DO NOT use robotic fluff words like "delve", "tapestry", "game-changer", "unlock", "supercharge".
4. Maintain the LinkedIn formatting (Hook, Body, Conclusion, CTA) unless the instruction implies otherwise.
5. Preserve the same hashtags from Current locked hashtags unless the topic changes dramatically.
6. Keep exactly ${hashtagCount} hashtags at the end.
7. Return ONLY the updated post content, without any meta-commentary.
`;

  return callWithRetryAndFallback(async (model) => {
    const response = await callGroqAPI(model, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    return response;
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






