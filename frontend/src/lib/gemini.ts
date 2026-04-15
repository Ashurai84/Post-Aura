import { auth } from "../firebase";
import { getApiBase } from "./api";

function extractHashtagsFromText(text: string): string[] {
  const matches = String(text || "").match(/(^|\s)#([A-Za-z][A-Za-z0-9_]{1,29})/g) || [];
  const normalized = matches
    .map((m) => m.trim())
    .map((m) => (m.startsWith("#") ? m : `#${m.replace(/^\s+/, "")}`));
  return [...new Set(normalized)];
}

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return { "Content-Type": "application/json" };
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

export interface SynthesizeResult {
  result: string;
  voiceTags: string[];
  postsAnalyzed: number;
  hashtags: string[];
  bestPostingTime: {
    label: string;
    reason: string;
  } | null;
}

export interface IterateResult {
  result: string;
  hashtags: string[];
}

export async function synthesizePost(
  topic: string,
  takeaway: string,
  audience: string,
  tone: string,
  hashtagCount: 3 | 5 | 10,
): Promise<SynthesizeResult> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${getApiBase()}/api/ai/synthesize`, {
    method: "POST",
    headers,
    body: JSON.stringify({ topic, takeaway, audience, tone, hashtagCount }),
  });

  if (response.status === 402) {
    throw new Error("UPGRADE_REQUIRED");
  }

  if (response.status === 429) {
    throw new Error("QUOTA_EXCEEDED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to synthesize post");
  }

  const data = await response.json();
  const resultText = data.result || "";
  const safeHashtags = Array.isArray(data.hashtags) && data.hashtags.length > 0
    ? data.hashtags
    : extractHashtagsFromText(resultText);
  return {
    result: resultText,
    voiceTags: data.voiceTags || [],
    postsAnalyzed: data.postsAnalyzed || 0,
    hashtags: safeHashtags,
    bestPostingTime: data.bestPostingTime || null,
  };
}

export async function iteratePost(
  currentContent: string,
  instruction: string,
  topic?: string,
  audience?: string,
  hashtags: string[] = [],
  hashtagCount: 3 | 5 | 10 = 5,
): Promise<IterateResult> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${getApiBase()}/api/ai/iterate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ currentContent, instruction, topic, audience, hashtags, hashtagCount }),
  });

  if (response.status === 402) {
    throw new Error("UPGRADE_REQUIRED");
  }

  if (response.status === 429) {
    throw new Error("QUOTA_EXCEEDED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to iterate post");
  }

  const data = await response.json();
  const resultText = data.result || "";
  const safeHashtags = Array.isArray(data.hashtags) && data.hashtags.length > 0
    ? data.hashtags
    : extractHashtagsFromText(resultText);
  return {
    result: resultText,
    hashtags: safeHashtags,
  };
}

export async function generateImage(prompt: string, size: "1K" | "2K" | "4K"): Promise<string> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${getApiBase()}/api/ai/generate-image`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt, size }),
  });

  if (response.status === 402) {
    throw new Error("UPGRADE_REQUIRED");
  }

  if (response.status === 429) {
    throw new Error("QUOTA_EXCEEDED");
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate image");
  }

  const data = await response.json();
  const url = data.url;

  // Preload the image to keep the loading state active until it finishes generating
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error("Failed to load generated image"));
    img.src = url;
  });
}
