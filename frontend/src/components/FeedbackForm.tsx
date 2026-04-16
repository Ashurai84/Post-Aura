import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { MessageSquare, Loader2 } from "lucide-react";
import { getApiBase } from "../lib/api";
import { auth } from "../firebase";

type FeedbackType = "bug" | "feature" | "love" | "hate" | "suggestion";

interface FeedbackFormProps {
  userId: string;
}

export function FeedbackForm({ userId }: FeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${getApiBase()}/api/voice-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          message: message.trim(),
          rating,
          page: window.location.pathname,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setMessage("");
          setRating(5);
          setType("suggestion");
          setSubmitted(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Feedback submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 text-xs"
          title="Send feedback to help us improve"
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve PostAura. Your feedback matters! 💙
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="text-3xl">✅</div>
            <p className="font-semibold">Thanks for the feedback!</p>
            <p className="text-sm text-muted-foreground">We really appreciate it.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Feedback Type */}
            <div>
              <label className="text-sm font-semibold mb-2 block">What kind of feedback?</label>
              <div className="grid grid-cols-5 gap-2">
                {(["bug", "feature", "love", "hate", "suggestion"] as FeedbackType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      type === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {t === "bug" && "🐛"}
                    {t === "feature" && "✨"}
                    {t === "love" && "❤️"}
                    {t === "hate" && "😤"}
                    {t === "suggestion" && "💡"}
                    <span className="block text-[10px] mt-1 capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-semibold mb-2 block">How happy are you with PostAura?</label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      rating === r
                        ? "bg-primary text-primary-foreground scale-105"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {"😔😕😐😊😍"[r - 1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Your message</label>
              <Textarea
                placeholder={
                  type === "bug"
                    ? "Describe the bug you found..."
                    : type === "feature"
                    ? "What feature would help you?"
                    : "Tell us what you think..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-24 resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Feedback"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
