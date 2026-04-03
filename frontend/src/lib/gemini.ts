import { auth } from "../firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
}

export async function synthesizePost(topic: string, takeaway: string, audience: string, tone: string): Promise<SynthesizeResult> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/ai/synthesize`, {
    method: "POST",
    headers,
    body: JSON.stringify({ topic, takeaway, audience, tone }),
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
  return {
    result: data.result || "",
    voiceTags: data.voiceTags || [],
    postsAnalyzed: data.postsAnalyzed || 0,
  };
}

export async function iteratePost(currentContent: string, instruction: string): Promise<string> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/ai/iterate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ currentContent, instruction }),
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
  return data.result || "";
}

export async function generateImage(prompt: string, size: "1K" | "2K" | "4K"): Promise<string> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/ai/generate-image`, {
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
