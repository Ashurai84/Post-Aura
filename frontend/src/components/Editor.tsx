import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { synthesizePost, iteratePost, SynthesizeResult } from "../lib/gemini";
import { Post, HistoryItem } from "../types";
import { FeedbackForm } from "./FeedbackForm";
import {
  Loader2, Copy, Check, ArrowRight, Wand2,
  Undo2, History as HistoryIcon, Trash2, RotateCcw,
  Zap, Lightbulb, Flame, BookOpen, Trophy,
  ChevronDown, Sparkles, Pencil, Settings2,
  ThumbsUp, ThumbsDown, Hash, Clock3
} from "lucide-react";
import { db, auth } from "../firebase";
import { doc, updateDoc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import Markdown from "react-markdown";
import { PaywallModal } from "./PaywallModal";
import { getApiBase } from "../lib/api";

const HASHTAG_COUNT_OPTIONS: Array<3 | 5 | 10> = [3, 5, 10];

// ── Quick Actions ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: "attended",
    icon: <Zap className="h-5 w-5" />,
    emoji: "⚡",
    label: "I attended something today",
    placeholder: 'e.g. "Attended a talk by Meesho CTO at our college fest"',
    audience: "College Students",
    tone: "Conversational",
  },
  {
    id: "built",
    icon: <Sparkles className="h-5 w-5" />,
    emoji: "🛠️",
    label: "I built something",
    placeholder: 'e.g. "Built a URL shortener using Redis and Node.js"',
    audience: "College Students",
    tone: "Professional",
  },
  {
    id: "learned",
    icon: <Lightbulb className="h-5 w-5" />,
    emoji: "💡",
    label: "I learned something",
    placeholder: 'e.g. "Learned how Docker containers actually work"',
    audience: "College Students",
    tone: "Inspirational",
  },
  {
    id: "hottake",
    icon: <Flame className="h-5 w-5" />,
    emoji: "🔥",
    label: "I have a hot take",
    placeholder: 'e.g. "DSA alone won\'t get you a good job anymore"',
    audience: "General Public",
    tone: "Controversial",
  },
  {
    id: "story",
    icon: <BookOpen className="h-5 w-5" />,
    emoji: "📖",
    label: "I want to share a story",
    placeholder: 'e.g. "How I went from 0 to 500 LinkedIn followers in 2 months"',
    audience: "College Students",
    tone: "Conversational",
  },
];

// ── Types ──────────────────────────────────────────────────────
interface EditorProps {
  post: Partial<Post> | null;
  userId: string;
  onPostUpdated: (post: Post) => void;
  onStartNewPost: () => void;
  onDeletePost: (id: string) => void;
  weeklyPostCount: number;
  weeklyGoal: number;
  postsToReview: Post[];
}

type EditorPhase = "select" | "input" | "result";

function toUnicodeBold(text: string): string {
  let result = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code === undefined) {
      result += ch;
      continue;
    }

    if (code >= 65 && code <= 90) {
      result += String.fromCodePoint(0x1D400 + (code - 65));
    } else if (code >= 97 && code <= 122) {
      result += String.fromCodePoint(0x1D41A + (code - 97));
    } else if (code >= 48 && code <= 57) {
      result += String.fromCodePoint(0x1D7CE + (code - 48));
    } else {
      result += ch;
    }
  }
  return result;
}

function convertMarkdownBoldToUnicode(text: string): string {
  // LinkedIn does not render markdown, so convert **bold** to Unicode bold letters for copy-paste.
  const withUnicodeBold = text.replace(/\*\*([\s\S]+?)\*\*/g, (_, inner: string) => toUnicodeBold(inner));
  return withUnicodeBold.replace(/\*\*/g, "");
}

function extractHashtagsFromText(text: string): string[] {
  const matches = String(text || "").match(/(^|\s)#([A-Za-z][A-Za-z0-9_]{1,29})/g) || [];
  const normalized = matches
    .map((m) => m.trim())
    .map((m) => (m.startsWith("#") ? m : `#${m.replace(/^\s+/, "")}`));
  return [...new Set(normalized)];
}

// ── Component ──────────────────────────────────────────────────
export function Editor({ post, userId, onPostUpdated, onStartNewPost, onDeletePost, weeklyPostCount, weeklyGoal, postsToReview }: EditorProps) {
  // Core state
  const [phase, setPhase] = useState<EditorPhase>("select");
  const [selectedAction, setSelectedAction] = useState<typeof QUICK_ACTIONS[0] | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customAudience, setCustomAudience] = useState("");
  const [customTone, setCustomTone] = useState("");
  const [takeaway, setTakeaway] = useState("");

  // Post state
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [iterationInstruction, setIterationInstruction] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [feedbackState, setFeedbackState] = useState<"pending" | "approved" | "rejected" | "fixing">("pending");
  const [showFeedbackOptions, setShowFeedbackOptions] = useState(false);
  const [voiceTags, setVoiceTags] = useState<string[]>([]);
  const [postsAnalyzed, setPostsAnalyzed] = useState(0);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagCount, setHashtagCount] = useState<3 | 5 | 10>(5);
  const [bestPostingTime, setBestPostingTime] = useState<{ label: string; reason: string } | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevHashtagCountRef = useRef<3 | 5 | 10>(5);

  // ── Sync with post prop ────────────────────────────────────
  useEffect(() => {
    if (post && post.content) {
      setTopic(post.topic || "");
      setAudience(post.audience || "");
      setTone(post.tone || "");
      setContent(post.content || "");
      setHistory(post.history || []);
      setHashtags(post.hashtags || []);
      if ((post.hashtags || []).length === 3 || (post.hashtags || []).length === 5 || (post.hashtags || []).length === 10) {
        setHashtagCount((post.hashtags || []).length as 3 | 5 | 10);
      } else {
        setHashtagCount(5);
      }
      setBestPostingTime(post.bestPostingTime || null);
      setPhase("result");
    } else {
      // Reset for new post
      setPhase("select");
      setSelectedAction(null);
      setRawInput("");
      setTakeaway("");
      setContent("");
      setTopic("");
      setAudience("");
      setTone("");
      setHistory([]);
      setShowAdvanced(false);
      setShowHistory(false);
      setIsEditing(false);
      setHashtags([]);
      setHashtagCount(5);
      setBestPostingTime(null);
    }
  }, [post]);

  // Auto-focus input when entering input phase
  useEffect(() => {
    if (phase === "input" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  // ── Regenerate hashtags when count changes in result phase ──
  useEffect(() => {
    if (phase !== "result" || !content || !topic || !audience || !tone) return;
    if (hashtagCount === prevHashtagCountRef.current) return; // Only regen if count actually changed

    const prevCount = prevHashtagCountRef.current;
    prevHashtagCountRef.current = hashtagCount;

    const regenerateHashtags = async () => {
      try {
        setIsGenerating(true);
        const { hashtags: newHashtags } = await iteratePost(
          content,
          `Change the number of hashtags from ${prevCount} to ${hashtagCount}`,
          topic,
          audience,
          hashtags,
          hashtagCount
        );
        setHashtags(newHashtags || []);
      } catch (error: any) {
        console.error("Hashtag regeneration error:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    regenerateHashtags();
  }, [hashtagCount, phase, content, topic, audience, tone, hashtags]);

  // ── Handlers ───────────────────────────────────────────────
  const handleSelectAction = (action: typeof QUICK_ACTIONS[0]) => {
    setSelectedAction(action);
    setCustomAudience(action.audience);
    setCustomTone(action.tone);
    setPhase("input");
  };

  const handleGenerate = async () => {
    if (!rawInput.trim() || !takeaway.trim()) return;

    const finalAudience = showAdvanced && customAudience ? customAudience : (selectedAction?.audience || "College Students");
    const finalTone = showAdvanced && customTone ? customTone : (selectedAction?.tone || "Conversational");

    setTopic(rawInput);
    setAudience(finalAudience);
    setTone(finalTone);
    setIsGenerating(true);

    try {
      const { result: generatedText, voiceTags: tags, postsAnalyzed: count, hashtags: generatedHashtags, bestPostingTime: generatedBestTime } = await synthesizePost(rawInput, takeaway, finalAudience, finalTone, hashtagCount);
      setVoiceTags(tags);
      setPostsAnalyzed(count);
      setHashtags(generatedHashtags || []);
      setBestPostingTime(generatedBestTime || null);

      const newHistoryItem: HistoryItem = {
        content: generatedText,
        label: "Initial Generation",
        timestamp: new Date(),
      };

      const newHistory = [newHistoryItem];
      setContent(generatedText);
      setHistory(newHistory);
      setPhase("result");
      setFeedbackState("pending");
      setShowFeedbackOptions(false);

      await savePost(rawInput, finalAudience, finalTone, generatedText, newHistory, generatedHashtags || [], generatedBestTime || null);
    } catch (error: any) {
      console.error("Synthesize error:", error);
      if (error.message === "UPGRADE_REQUIRED") {
        setShowPaywall(true);
      } else if (error.message === "QUOTA_EXCEEDED") {
        alert("Gemini API quota exceeded. Try again later or check your plan.");
      } else {
        alert("Failed to generate. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePost = async () => {
    if (!content || !topic || !audience || !tone) return;

    setIsGenerating(true);
    try {
      // Generate a completely different version using same parameters
      const { result: generatedText, hashtags: generatedHashtags } = await iteratePost(
        content,
        "Create a completely different version of this post that still conveys the same message.",
        topic,
        audience,
        hashtags,
        hashtagCount
      );

      const newHistoryItem: HistoryItem = {
        content: generatedText,
        label: "Regenerated",
        timestamp: new Date(),
      };

      const newHistory = [...history, newHistoryItem];
      setContent(generatedText);
      setHistory(newHistory);
      setHashtags(generatedHashtags || hashtags);
      setFeedbackState("pending");

      await savePost(rawInput || topic, audience, tone, generatedText, newHistory, generatedHashtags || hashtags, bestPostingTime || null);
    } catch (error: any) {
      console.error("Regeneration error:", error);
      alert("Failed to regenerate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIterate = async (instruction: string) => {
    if (!content || !instruction.trim()) return;

    setIsGenerating(true);
    try {
      const { result, hashtags: iteratedHashtags } = await iteratePost(content, instruction, topic, audience, hashtags, hashtagCount);
      const safeHashtags = iteratedHashtags.length > 0 ? iteratedHashtags : hashtags;
      const newHistoryItem: HistoryItem = {
        content: result,
        label: instruction,
        timestamp: new Date(),
      };
      const newHistory = [...history, newHistoryItem];
      setContent(result);
      setHashtags(safeHashtags);
      setHistory(newHistory);
      setIterationInstruction("");

      await savePost(topic, audience, tone, result, newHistory, safeHashtags, bestPostingTime);
    } catch (error: any) {
      console.error("Iterate error:", error);
      if (error.message === "UPGRADE_REQUIRED") {
        setShowPaywall(true);
      } else if (error.message === "QUOTA_EXCEEDED") {
        alert("Gemini API quota exceeded. Try again later.");
      } else {
        alert("Failed to iterate. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUndo = async () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const previousItem = newHistory[newHistory.length - 1];
    setContent(previousItem.content);
    setHistory(newHistory);
    await savePost(topic, audience, tone, previousItem.content, newHistory, hashtags, bestPostingTime);
  };

  const handleRevertTo = async (index: number) => {
    const selectedItem = history[index];
    const newHistory = history.slice(0, index + 1);
    setContent(selectedItem.content);
    setHistory(newHistory);
    setShowHistory(false);
    await savePost(topic, audience, tone, selectedItem.content, newHistory, hashtags, bestPostingTime);
  };

  const handleDeleteHistoryItem = async (index: number) => {
    if (history.length <= 1) return;
    const newHistory = history.filter((_, i) => i !== index);
    if (index === history.length - 1) {
      const lastItem = newHistory[newHistory.length - 1];
      setContent(lastItem.content);
    }
    setHistory(newHistory);
    await savePost(topic, audience, tone, content, newHistory, hashtags, bestPostingTime);
  };

  const savePost = async (
    t: string,
    a: string,
    tn: string,
    c: string,
    h: HistoryItem[],
    tags: string[],
    bestTime: { label: string; reason: string } | null,
  ) => {
    try {
      if (post?.id) {
        const postRef = doc(db, "posts", post.id);
        await updateDoc(postRef, {
          topic: t, audience: a, tone: tn, content: c, history: h,
          hashtags: tags,
          bestPostingTime: bestTime,
          updatedAt: serverTimestamp(),
        });
        onPostUpdated({
          ...post,
          topic: t,
          audience: a,
          tone: tn,
          content: c,
          history: h,
          hashtags: tags,
          bestPostingTime: bestTime,
          updatedAt: new Date(),
        } as Post);
      } else {
        const newPostRef = doc(collection(db, "posts"));
        const newPostData = {
          userId, topic: t, audience: a, tone: tn, content: c, history: h,
          hashtags: tags,
          bestPostingTime: bestTime,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        };
        await setDoc(newPostRef, newPostData);
        onPostUpdated({ ...newPostData, id: newPostRef.id, createdAt: new Date(), updatedAt: new Date() } as Post);
      }
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const copyToClipboard = () => {
    const linkedInReadyContent = convertMarkdownBoldToUnicode(content);
    const fallbackHashtags = extractHashtagsFromText(linkedInReadyContent);
    const finalHashtags = hashtags.length > 0 ? hashtags : fallbackHashtags;
    const hashtagLine = finalHashtags.length > 0 ? `\n\n${finalHashtags.join(" ")}` : "";
    const fullText = `${linkedInReadyContent}${hashtagLine}`.trim();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Mark copiedAt for the 24h review loop
    if (post?.id) {
      const postRef = doc(db, "posts", post.id);
      updateDoc(postRef, { copiedAt: serverTimestamp() }).catch(e => console.warn("copiedAt update failed:", e));
    }
  };

  // ── Handle performance review ───────────────────────────────
  const handlePerformanceReview = async (postId: string, rating: "hot" | "average" | "flopped") => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { performance: rating });
      setReviewMessage("Review submitted! Thank you.");
      setTimeout(() => setReviewMessage(null), 3000);
    } catch (error) {
      console.error("Performance review error:", error);
    }
  };

  const handleStartNew = () => {
    setPhase("select");
    setSelectedAction(null);
    setRawInput("");
    setTakeaway("");
    setContent("");
    setTopic("");
    setAudience("");
    setTone("");
    setHistory([]);
    setHashtags([]);
    setHashtagCount(5);
    setBestPostingTime(null);
    setShowAdvanced(false);
    setShowHistory(false);
    setIsEditing(false);
    onStartNewPost();
  };

  // ── Weekly Progress Ring ───────────────────────────────────
  const progressPercent = Math.min((weeklyPostCount / weeklyGoal) * 100, 100);
  const progressLeft = Math.max(weeklyGoal - weeklyPostCount, 0);
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const postLines = content.split("\n");
  const displayHashtags = hashtags.length > 0 ? hashtags : extractHashtagsFromText(content);
  const firstNonEmptyIndex = postLines.findIndex((line) => line.trim().length > 0);
  const hookLine = firstNonEmptyIndex >= 0 ? postLines[firstNonEmptyIndex].replace(/\*\*/g, "").trim() : "";
  const bodyMarkdown = firstNonEmptyIndex >= 0
    ? [...postLines.slice(0, firstNonEmptyIndex), ...postLines.slice(firstNonEmptyIndex + 1)].join("\n")
    : content;

  // ── Send voice feedback to backend ─────────────────────────
  const sendVoiceFeedback = async (type: "approved" | "rejected", reason: string | null) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      await fetch(`${getApiBase()}/api/ai/voice-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, reason, content }),
      });
    } catch (e) {
      console.warn("Voice feedback failed:", e);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.08),_transparent_35%),hsl(var(--background))] transition-colors">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 py-6 md:px-8 md:py-10 space-y-10">

          {/* ── Weekly Progress ─────────────────────────── */}
          <div className="premium-panel rounded-2xl p-5 md:p-6 flex items-start justify-between gap-5 animate-in fade-in duration-500">
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 mt-0.5">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/40" />
                  <circle
                    cx="20" cy="20" r="18" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    className={progressPercent >= 100 ? "text-emerald-500" : "text-primary"}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
                  {weeklyPostCount >= weeklyGoal ? "🎉" : `${weeklyPostCount}/${weeklyGoal}`}
                </span>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Weekly Momentum</p>
                <h2 className="text-lg md:text-2xl font-semibold tracking-tight">
                  Don&apos;t fall behind. What did you do today?
                </h2>
                <p className="text-sm font-semibold">
                  {weeklyPostCount >= weeklyGoal
                    ? "Weekly goal hit! 🔥"
                    : `${progressLeft} more to hit your goal`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {weeklyPostCount >= weeklyGoal
                    ? "You're outpacing most LinkedIn users"
                    : "Keep the streak alive while your audience is paying attention."}
                </p>
              </div>
            </div>
            {weeklyPostCount > 0 && weeklyPostCount < weeklyGoal && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2 rounded-full border border-amber-200 dark:border-amber-500/20 shadow-sm whitespace-nowrap">
                <Flame className="h-3 w-3" />
                Keep going
              </div>
            )}
          </div>

          {/* ── Post Performance Review (24h+ unreviewed) ── */}
          {postsToReview.length > 0 && phase === "select" && (
            <div className="space-y-3">
              {postsToReview.slice(0, 2).map((reviewPost) => (
                <div key={reviewPost.id} className="bg-gradient-to-r from-amber-500/8 to-orange-500/5 border border-amber-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm font-semibold mb-1">How did this post perform?</p>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 italic">
                    "{reviewPost.content.replace(/\*/g, '').slice(0, 100).replace(/\n/g, ' ')}…"
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePerformanceReview(reviewPost.id!, "hot")}
                      className="flex-1 h-9 rounded-lg text-xs font-medium border border-emerald-300/50 bg-emerald-50/50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      🔥 Performed well
                    </button>
                    <button
                      onClick={() => handlePerformanceReview(reviewPost.id!, "average")}
                      className="flex-1 h-9 rounded-lg text-xs font-medium border border-border bg-muted/30 hover:bg-muted/60 transition-all flex items-center justify-center gap-1.5"
                    >
                      👍 Average
                    </button>
                    <button
                      onClick={() => handlePerformanceReview(reviewPost.id!, "flopped")}
                      className="flex-1 h-9 rounded-lg text-xs font-medium border border-rose-300/50 bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      👎 Flopped
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reviewMessage && (
            <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
              <Check className="h-4 w-4" />
              {reviewMessage}
            </div>
          )}

          {/* ═══════ PHASE: SELECT ═══════ */}
          {phase === "select" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {post?.id && (
                <button
                  onClick={handleStartNew}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  ← Clear selection & start a new post
                </button>
              )}
              <div className="text-center space-y-2 pt-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  What did you do today?
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Pick the moment. PostAura turns it into a post people actually read.
                </p>
              </div>

              <div className="grid gap-4">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleSelectAction(action)}
                    className="premium-action-card group flex items-center gap-4 p-5 rounded-2xl text-left active:scale-[0.99]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-transparent flex items-center justify-center text-primary group-hover:scale-110 transition-all shrink-0">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base tracking-tight">{action.label}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{action.placeholder}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ PHASE: INPUT ═══════ */}
          {phase === "input" && selectedAction && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
              {/* Back link */}
              <button
                onClick={() => { setPhase("select"); setRawInput(""); setTakeaway(""); setShowAdvanced(false); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                ← Back
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedAction.emoji}</span>
                  <h2 className="text-xl font-bold tracking-tight">{selectedAction.label}</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tell us in 1–2 lines. That's all we need.
                </p>
              </div>

              <Textarea
                ref={inputRef}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={selectedAction.placeholder}
                className="min-h-[100px] text-base resize-none rounded-xl border-2 focus:border-primary/50 transition-colors"
                disabled={isGenerating}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />

              {/* Takeaway — mandatory */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  🎯 What's your main takeaway?
                  <span className="text-xs font-normal text-destructive">*required</span>
                </label>
                <Input
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  placeholder='e.g. "AI agents will replace 80% of repetitive dev work"'
                  className="h-11 text-base rounded-xl border-2 focus:border-primary/50 transition-colors"
                  disabled={isGenerating}
                />
                <p className="text-[11px] text-muted-foreground">
                  This is YOUR opinion — it's what makes the post sound like you, not a robot.
                </p>
              </div>

              {/* Advanced toggle */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Settings2 className="h-3 w-3" />
                  {showAdvanced ? "Hide" : "Customize"} audience & tone
                  <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                </button>

                {showAdvanced && (
                  <div className="mt-3 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Audience</label>
                      <select
                        value={customAudience}
                        onChange={(e) => setCustomAudience(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border bg-background text-sm"
                      >
                        <option value="College Students">College Students</option>
                        <option value="High School Students">High School Students</option>
                        <option value="General Public">General Public</option>
                        <option value="Parents">Parents</option>
                        <option value="Alumni">Alumni</option>
                        <option value="University Administrators">University Administrators</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Tone</label>
                      <select
                        value={customTone}
                        onChange={(e) => setCustomTone(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border bg-background text-sm"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Conversational">Conversational</option>
                        <option value="Inspirational">Inspirational</option>
                        <option value="Controversial">Controversial</option>
                        <option value="Data-driven">Data-driven</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">HASHTAGS</p>
                <div className="flex items-center gap-2">
                  {HASHTAG_COUNT_OPTIONS.map((count) => {
                    const isActive = hashtagCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setHashtagCount(count)}
                        className={`h-9 min-w-12 rounded-full border px-4 text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-primary/10 border-primary/35 text-primary"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                        disabled={isGenerating}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={!rawInput.trim() || !takeaway.trim() || isGenerating}
                className="premium-cta w-full h-14 rounded-2xl text-base font-semibold"
                size="lg"
              >
                {isGenerating ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Crafting your post...</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" /> Generate Post</>
                )}
              </Button>
            </div>
          )}

          {/* ═══════ PHASE: RESULT ═══════ */}
          {phase === "result" && content && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPhase("select")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  ← Back to templates
                </button>
                <div className="flex items-center gap-3">
                  {post?.id && (
                    <button
                      onClick={() => onDeletePost(post.id!)}
                      className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete this post
                    </button>
                  )}
                  <button
                    onClick={handleStartNew}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    + Start a new post
                  </button>
                </div>
              </div>

              {/* ── Post Card ─────────────────────────────── */}
              <div className="rounded-3xl border border-border/60 bg-card shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)] overflow-hidden transition-all duration-300">
                {/* LinkedIn-style header */}
                <div className="flex items-center gap-3 p-4 pb-3 border-b bg-muted/20 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                    <span className="font-bold text-primary text-sm">You</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Your Name</p>
                    <p className="text-[11px] text-muted-foreground">Just now · 🌐</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {history.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs" onClick={handleUndo} disabled={isGenerating}>
                        <Undo2 className="h-3.5 w-3.5 mr-1" /> Undo
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setShowHistory(!showHistory)}>
                      <HistoryIcon className="h-3.5 w-3.5 mr-1" /> {history.length}
                    </Button>
                    <FeedbackForm userId={userId} />
                  </div>
                </div>

                {/* Post content */}
                <div className="p-5 md:p-6 space-y-4">
                  {isEditing ? (
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[200px] text-[15px] leading-relaxed resize-y border-0 p-0 focus-visible:ring-0 bg-transparent"
                    />
                  ) : (
                    <>
                      {hookLine && (
                        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold mb-1">Hook</p>
                          <p className="text-lg md:text-xl leading-snug font-semibold tracking-tight">{hookLine}</p>
                        </div>
                      )}
                      <div className="prose prose-sm max-w-none dark:prose-invert text-[15px] leading-relaxed">
                        <Markdown>{bodyMarkdown || content}</Markdown>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    className="premium-cta h-10 px-6 rounded-full font-semibold text-sm text-primary-foreground"
                  >
                    {copied ? (
                      <><Check className="h-4 w-4 mr-1.5 text-emerald-300" /> Copied!</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-1.5" /> Copy to LinkedIn</>
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Visible Intelligence: Voice Tags ──────── */}
              {voiceTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-300">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Writing in your style:</span>
                  {voiceTags.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/15">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Best Post Time + Hashtags ─────────────── */}
              {(bestPostingTime || displayHashtags.length > 0) && (
                <div className="grid gap-3 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {bestPostingTime && (
                    <div className="bg-linear-to-r from-sky-500/10 to-indigo-500/5 border border-sky-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock3 className="h-4 w-4 text-sky-600" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">Best time to post</p>
                      </div>
                      <p className="text-sm font-bold">{bestPostingTime.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{bestPostingTime.reason}</p>
                    </div>
                  )}

                  {displayHashtags.length > 0 && (
                    <div className="bg-linear-to-r from-violet-500/10 to-fuchsia-500/5 border border-violet-500/20 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-violet-600" />
                          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">Suggested hashtags</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] font-semibold text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all"
                          onClick={() => {
                            setIsGenerating(true);
                            iteratePost(
                              content,
                              `Generate a completely different set of ${hashtagCount} hashtags. Use different hashtag topics and styles than before.`,
                              topic,
                              audience,
                              hashtags,
                              hashtagCount
                            )
                              .then(({ hashtags: newHashtags }) => {
                                setHashtags(newHashtags || []);
                              })
                              .catch((error) => {
                                console.error("Hashtag regeneration error:", error);
                              })
                              .finally(() => {
                                setIsGenerating(false);
                              });
                          }}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Generating...</>
                          ) : (
                            <>✨ Different hashtags</>
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {displayHashtags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] px-2 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Progress Milestone ────────────────────── */}
              {postsAnalyzed >= 5 && postsAnalyzed % 5 === 0 && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center animate-in fade-in zoom-in-95 duration-500">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    🧠 PostAura has analyzed {postsAnalyzed} of your posts
                  </p>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">
                    Your writing DNA is getting sharper with every post
                  </p>
                </div>
              )}

              {/* ── Feedback Loop (Step 2 — feels required) ── */}
              {feedbackState === "pending" && !isGenerating && (
                <div className="bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border-2 border-primary/20 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Step 2</span>
                    <p className="text-sm font-semibold">Quick check — does this sound like you?</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-11 rounded-xl border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-500/10 transition-all font-semibold"
                      onClick={() => {
                        setFeedbackState("approved");
                        sendVoiceFeedback("approved", null);
                      }}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2 text-emerald-600" />
                      Yes, this is me 🔥
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-11 rounded-xl border-2 border-amber-300 hover:bg-amber-50 hover:border-amber-400 dark:hover:bg-amber-500/10 transition-all font-semibold"
                      onClick={() => {
                        handleRegeneratePost();
                      }}
                      disabled={isGenerating}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2 text-amber-600" />
                      Not quite — Try again
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    This teaches PostAura your voice — posts get better every time
                  </p>
                </div>
              )}

              {/* Approved — instant value insight */}
              {feedbackState === "approved" && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">✨</span>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Voice locked in. Your DNA just got stronger.</p>
                  </div>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-500/70">
                    {postsAnalyzed <= 2
                      ? "📈 We're learning your style — next post will be even closer to your voice"
                      : `🧠 ${postsAnalyzed} posts analyzed. PostAura now writes ${voiceTags.length > 0 ? voiceTags.slice(0, 3).join(" + ") : "in your unique style"}`}
                  </p>
                </div>
              )}

              {/* What feels off? */}
              {feedbackState === "rejected" && showFeedbackOptions && !isGenerating && (
                <div className="border-2 border-amber-500/25 bg-gradient-to-br from-amber-500/8 to-transparent rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-sm font-semibold">What feels off? <span className="text-xs font-normal text-muted-foreground">(we'll fix it + remember for next time)</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "🏢 Too formal", feedback: "too formal", instruction: "Rewrite this to be way more casual and conversational. Sound like a college student talking to peers, not a corporate exec. Use simpler words, shorter sentences, and a natural flow. Keep the bold formatting and emojis." },
                      { label: "😐 Too generic", feedback: "too generic", instruction: "This feels too generic. Make it much more specific and personal — add concrete details, specific numbers or observations. Remove any advice that could apply to literally anyone. Keep the bold formatting and emojis." },
                      { label: "🤷 Not my opinion", feedback: "not my opinion", instruction: "The author's personal takeaway/opinion isn't coming through strongly enough. Make the stance BOLDER and more provocative. The reader should know exactly what the author believes and why. Keep the bold formatting and emojis." },
                      { label: "📏 Too long", feedback: "too long", instruction: "Cut this by 40%. Keep only the most impactful sentences. Remove all filler, unnecessary transitions, and generic lines. Be ruthless. Keep the bold formatting and emojis." },
                    ].map((option) => (
                      <Button
                        key={option.label}
                        variant="secondary"
                        size="sm"
                        className="h-10 text-xs rounded-lg justify-start font-medium"
                        onClick={() => {
                          setFeedbackState("fixing");
                          setShowFeedbackOptions(false);
                          sendVoiceFeedback("rejected", option.feedback);
                          handleIterate(option.instruction);
                          setTimeout(() => setFeedbackState("pending"), 100);
                        }}
                        disabled={isGenerating}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Version History (collapsible) ─────────── */}
              {showHistory && history.length > 0 && (
                <div className="bg-muted/20 border rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                      <HistoryIcon className="h-3.5 w-3.5" /> Version History
                    </h4>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{history.length} versions</span>
                  </div>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {[...history].reverse().map((item, ri) => {
                      const i = history.length - 1 - ri;
                      return (
                        <div key={i} className="flex items-center justify-between bg-background border rounded-lg p-2.5 text-xs group hover:border-primary/20 transition-colors">
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-medium truncate">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRevertTo(i)} title="Revert">
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            {history.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteHistoryItem(i)} title="Delete">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Iteration Dock ────────────────────────── */}
              <div className="bg-muted/30 rounded-xl p-4 border space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Wand2 className="h-3.5 w-3.5" /> Refine
                </div>

                <div className="flex flex-wrap gap-2">
                  {["Make it punchier", "Polarize", "Shorten", "Make it story-driven", "Add a CTA"].map((cmd) => (
                    <Button
                      key={cmd}
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs rounded-full"
                      onClick={() => handleIterate(cmd)}
                      disabled={isGenerating}
                    >
                      {cmd}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder='e.g. "Add my newsletter CTA at the end"'
                    value={iterationInstruction}
                    onChange={(e) => setIterationInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleIterate(iterationInstruction)}
                    disabled={isGenerating}
                    className="text-sm rounded-xl"
                  />
                  <Button
                    onClick={() => handleIterate(iterationInstruction)}
                    disabled={!iterationInstruction.trim() || isGenerating}
                    size="icon"
                    className="shrink-0 rounded-xl"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* ── New Post button ───────────────────────── */}
              <div className="text-center pt-2">
                <button
                  onClick={handleStartNew}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                >
                  + Start a new post
                </button>
              </div>
            </div>
          )}

          {/* ── Loading overlay for generation ────────── */}
          <AnimatePresence>
            {isGenerating && phase === "result" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 bg-background/78 backdrop-blur-md flex items-center justify-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative rounded-3xl border border-border/60 bg-card/95 px-8 py-7 shadow-[0_30px_90px_-45px_rgba(59,130,246,0.6)] min-w-[280px]"
                >
                  <motion.div
                    className="absolute -inset-0.5 rounded-3xl pointer-events-none"
                    style={{
                      background: "linear-gradient(120deg, rgba(99,102,241,0.22), rgba(14,165,233,0.18), rgba(16,185,129,0.18))",
                    }}
                    animate={{ opacity: [0.35, 0.65, 0.35] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />

                  <div className="relative flex flex-col items-center gap-4">
                    <div className="relative h-16 w-16">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/35"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-2 rounded-full border-2 border-sky-500/35"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-semibold tracking-tight">Refining your post</p>
                      <p className="text-xs text-muted-foreground mt-1">Polishing hook, flow, and CTA for stronger reach</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-primary/70"
                          animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
