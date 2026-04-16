import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff, Mail, Linkedin, Sparkles, ChevronRight } from "lucide-react";
import { auth, signInWithGoogle, signInWithLinkedIn, signUpWithEmail, signInWithEmail, handleRedirectResult } from "../firebase";
import { Button } from "./ui/button";

type AuthTab = "signin" | "signup";

export function AuthPage() {
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    handleRedirectResult()
      .then((user) => {
        if (isMounted && (user || auth.currentUser)) {
          navigate("/dashboard", { replace: true });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithLinkedIn();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        setError("LinkedIn sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email || !password || !displayName) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError("Sign-up failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "radial-gradient(circle at 10% 2%, rgba(249, 115, 22, 0.14), transparent 30%), radial-gradient(circle at 88% 6%, rgba(56, 189, 248, 0.12), transparent 34%), #f7f4ee",
      }}
    >
      {/* LEFT PANEL - Brand */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          width: "50%",
          background:
            "radial-gradient(circle at 14% 10%, rgba(249, 115, 22, 0.22), transparent 35%), radial-gradient(circle at 84% 4%, rgba(56, 189, 248, 0.16), transparent 32%), linear-gradient(180deg, #0a0d13 0%, #121722 100%)",
          padding: "48px",
        }}
      >
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/20 bg-white/10">
                <Sparkles className="h-6 w-6 text-[#ffd2a8]" />
              </div>
              <span
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontStyle: "italic",
                  fontSize: "24px",
                  color: "#FAFAF8",
                  letterSpacing: "-0.02em",
                }}
              >
                PostAura
              </span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} style={{ maxWidth: "400px", marginTop: "80px" }}>
            <h2
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 400,
                color: "#FAFAF8",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                marginBottom: "24px",
              }}
            >
              Write crazy.
              <br />
              Post consistently.
            </h2>

            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "15px",
                lineHeight: 1.6,
                color: "#d8d0c3",
              }}
            >
              Join thousands of creators who've ditched the blank page. One thought. One tap. Your voice. Always on.
            </motion.p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {[
                { icon: "⚡", label: "10 sec posts" },
                { icon: "🎯", label: "Your voice" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>{item.icon}</div>
                  <p style={{ fontSize: "12px", color: "#d8d0c3" }}>{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: "11px",
            color: "#6B6B6B",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Free tier includes daily posts
        </motion.p>
      </div>

      {/* RIGHT PANEL - Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          style={{ width: "100%", maxWidth: "420px" }}
        >
          {/* Header */}
          <motion.div variants={fadeUp} style={{ marginBottom: "36px", textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "28px",
                color: "#0F0F0F",
                marginBottom: "8px",
              }}
            >
              {tab === "signin" ? "Welcome back" : "Let's create your account"}
            </h1>
            <p style={{ fontSize: "14px", color: "#6B6B6B" }}>
              {tab === "signin"
                ? "Pick your favorite way to sign in"
                : "Join creators who've ditched the blank page"}
            </p>
          </motion.div>

          {/* Social Auth Buttons */}
          <motion.div variants={fadeUp} style={{ marginBottom: "24px", display: "grid", gap: "12px" }}>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "1.5px solid #E5E5E5",
                borderRadius: "12px",
                backgroundColor: "#FAFAF8",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s",
                background: "linear-gradient(135deg, #FAFAF8 0%, #F5F5F5 100%)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.target as HTMLElement).style.backgroundColor = "#F0F0F0";
                  (e.target as HTMLElement).style.borderColor = "#f97316";
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = "#FAFAF8";
                (e.target as HTMLElement).style.borderColor = "#E5E5E5";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
              </svg>
              Google
            </button>

            <button
              onClick={handleLinkedInSignIn}
              disabled={isLoading}
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "1.5px solid #0A66C2",
                borderRadius: "12px",
                backgroundColor: "#F0F7FF",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                fontSize: "14px",
                fontWeight: "500",
                color: "#0A66C2",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.target as HTMLElement).style.backgroundColor = "#E8F2FF";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = "#F0F7FF";
              }}
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E5E5" }} />
            <span style={{ fontSize: "12px", color: "#9B9B9B", textTransform: "uppercase", fontWeight: "500" }}>Or email</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E5E5" }} />
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              variants={fadeUp}
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                backgroundColor: "#FEE2E2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                fontSize: "13px",
                color: "#DC2626",
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              gap: "0",
              marginBottom: "24px",
              borderBottom: "1.5px solid #E5E5E5",
            }}
          >
            {[
              { id: "signin", label: "Sign In" },
              { id: "signup", label: "Sign Up" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id as AuthTab);
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: tab === t.id ? "#f97316" : "#9B9B9B",
                  borderBottom: tab === t.id ? "2px solid #f97316" : "none",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  border: "none",
                  transition: "all 0.2s",
                }}
              >
                {t.label}
              </button>
            ))}
          </motion.div>

          {/* Email Form */}
          <motion.form
            variants={fadeUp}
            onSubmit={tab === "signin" ? handleEmailSignIn : handleEmailSignUp}
            style={{ display: "grid", gap: "16px" }}
          >
            {tab === "signup" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#0F0F0F",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    border: "1.5px solid #E5E5E5",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontFamily: "system-ui, sans-serif",
                    backgroundColor: "#FAFAF8",
                    color: "#0F0F0F",
                    opacity: isLoading ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#f97316";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#E5E5E5";
                  }}
                />
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#0F0F0F",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid #E5E5E5",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontFamily: "system-ui, sans-serif",
                  backgroundColor: "#FAFAF8",
                  color: "#0F0F0F",
                  opacity: isLoading ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#f97316";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#E5E5E5";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#0F0F0F",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Password
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    paddingRight: "40px",
                    border: "1.5px solid #E5E5E5",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontFamily: "'SF Mono', 'Courier New', monospace",
                    backgroundColor: "#FAFAF8",
                    color: "#0F0F0F",
                    opacity: isLoading ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#f97316";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#E5E5E5";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "none",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[#9B9B9B]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[#9B9B9B]" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "12px",
                padding: "12px 16px",
                background: "linear-gradient(135deg, #f97316 0%, #fb8a35 100%)",
                color: "#FAFAF8",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.target as HTMLElement).style.boxShadow = "0 8px 16px rgba(249, 115, 22, 0.3)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.boxShadow = "none";
              }}
            >
              {isLoading ? "Loading..." : tab === "signin" ? "Sign In" : "Create Account"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.form>

          {/* Footer */}
          <motion.p
            variants={fadeUp}
            style={{
              marginTop: "20px",
              fontSize: "12px",
              color: "#9B9B9B",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {tab === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setTab("signup")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f97316",
                    fontWeight: "600",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setTab("signin")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f97316",
                    fontWeight: "600",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
