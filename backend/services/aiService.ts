import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const pollinationsApiKey = process.env.POLLINATIONS_API_KEY;

if (!geminiApiKey) {
  console.warn("GEMINI_API_KEY is not defined in backend/.env");
}

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Models in priority order — falls back if primary hits quota/unavailable
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as any).status;
    return status === 429 || status === 503;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|quota|rate.?limit/i.test(msg);
}

async function callWithRetryAndFallback(
  promptFn: (model: string) => Promise<string>,
  maxRetries = 2,
): Promise<string> {
  for (const model of MODELS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI request: model=${model}, attempt=${attempt + 1}`);
        return await promptFn(model);
      } catch (err) {
        if (isRetryableError(err) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(`Retryable error on ${model} (attempt ${attempt + 1}), waiting ${Math.round(delay)}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (isRetryableError(err)) {
          console.warn(`Model ${model} exhausted retries, trying next model...`);
          break; // try next model
        }
        throw err; // non-retryable error, bail out
      }
    }
  }
  throw new Error("All Gemini models failed after retries. Please try again later.");
}


export async function synthesizePost(
  topic: string,
  takeaway: string,
  audience: string,
  tone: string,
  voiceProfile?: any,
): Promise<string> {
  if (!ai) {
    throw new Error("AI service is not configured. GEMINI_API_KEY is missing.");
  }

  // Build voice instructions from profile
  let voiceInstructions = "";
  if (voiceProfile) {
    const parts: string[] = [];

    // Direct corrections from 👎 feedback (strongest signals)
    if (voiceProfile.prefersCasual) {
      parts.push("IMPORTANT: Write CASUALLY. Sound like a college student sharing with friends, not a corporate exec. Use simple words and short sentences.");
    }
    if (voiceProfile.prefersSpecific) {
      parts.push("IMPORTANT: Be VERY SPECIFIC. Use concrete details, numbers, names. Remove any generic advice that could apply to anyone.");
    }
    if (voiceProfile.prefersStrongStance) {
      parts.push("IMPORTANT: Make the opinion LOUD and PROVOCATIVE. The reader should feel the author's conviction. Don't hedge or soften the stance.");
    }

    // Automatic profile (kicks in after 2+ posts)
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
      const postsInfo = voiceProfile.postsAnalyzed ? ` from ${voiceProfile.postsAnalyzed} posts + direct feedback` : " from direct feedback";
      voiceInstructions = `\n    VOICE PROFILE (learned${postsInfo} — STRICTLY match this style):\n    ${parts.join("\n    ")}`;
    }
  }

  const prompt = `
    You are an expert LinkedIn copywriter. Your goal is to write an authentic, human-sounding LinkedIn post that centers on the author's PERSONAL TAKEAWAY — not a generic summary of the topic.

    WHAT HAPPENED: ${topic}
    THE AUTHOR'S MAIN TAKEAWAY / OPINION: ${takeaway}
    Target Audience: ${audience}
    Desired Tone: ${tone}
    ${voiceInstructions}

    FORMATTING RULES (CRITICAL — follow these EXACTLY):
    1. Use **bold text** (markdown bold with double asterisks) for:
       - The opening hook line (MUST be bold)
       - Key phrases or insights throughout the post (2-3 bold phrases total)
       - The final call to action or closing statement
    2. Use emojis strategically:
       - Start major sections with a relevant emoji (🔥, 💡, 🚀, ⚡, 🎯, 💪, 🧠, etc.)
       - Use 3-5 emojis total throughout the post — NOT more
       - Emojis should feel natural and expressive, not decorative
       - The hook can start with an emoji
    3. Use generous line breaks between paragraphs — single sentences as their own lines
    4. Keep the post between 150-250 words — long enough to have substance, short enough to not lose attention

    CONTENT RULES:
    1. The post MUST be built around the TAKEAWAY. The takeaway is the author's personal opinion/belief — it should be the CORE MESSAGE of the post. The topic/event is just context.
    2. DO NOT write a generic summary of the topic. The takeaway makes this post UNIQUE.
    3. DO NOT use robotic fluff words like "delve", "tapestry", "game-changer", "unlock", "supercharge", "navigate", "landscape", "leverage", "foster".
    4. Structure: **Bold provocative Hook** → Personal context (1-2 lines) → 💡 The insight/takeaway expanded → 🎯 Call to Action or question
    5. Keep sentences SHORT and punchy.
    6. Sound like a real person who was THERE and has a STRONG OPINION, not an AI summarizing a topic.
    7. Write in first person. The author experienced this.
    8. The hook should be PROVOCATIVE — make someone stop scrolling. Lead with the opinion, not the event.
    9. Do not include hashtags unless specifically asked.
    10. The overall feel should be PREMIUM — like a post from someone with 50K followers, not a beginner. Confident, bold, expressive.
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

export async function iteratePost(currentContent: string, instruction: string): Promise<string> {
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
    
    CRITICAL RULES:
    1. Apply the instruction to the current post.
    2. DO NOT hallucinate new facts or change the original core story/message.
    3. DO NOT use robotic fluff words like "delve", "tapestry", "game-changer", "unlock", "supercharge".
    4. Maintain the LinkedIn formatting (Hook, Body, Conclusion, CTA) unless the instruction implies otherwise.
    5. Return ONLY the updated post content, without any meta-commentary.
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






