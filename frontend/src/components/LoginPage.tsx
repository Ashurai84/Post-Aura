import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { auth, signInWithGoogle, handleRedirectResult } from "../firebase";

export function LoginPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
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
  }, []);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        // silent
      } else {
        alert("Sign-in failed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#FAFAF8", color: "#0F0F0F" }}
    >
      {/* ─── LEFT: Brand panel ─── */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          width: "45%",
          backgroundColor: "#0F0F0F",
          padding: "48px",
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "20px",
              color: "#FAFAF8",
              letterSpacing: "-0.02em",
            }}
          >
            PostAura
          </span>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          style={{ maxWidth: "400px" }}
        >
          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "clamp(32px, 4vw, 44px)",
              fontWeight: 400,
              color: "#FAFAF8",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              marginBottom: "24px",
            }}
          >
            Write like yourself.
            <br />
            Perform like a creator.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#6B6B6B",
            }}
          >
            The algorithm rewards structure, not vocabulary.
            PostAura formats your raw thoughts into posts that actually get read.
          </motion.p>
        </motion.div>

        <div>
          <p
            style={{
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: "11px",
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Free to use · No credit card
          </p>
        </div>
      </div>

      {/* ─── RIGHT: Auth form ─── */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ padding: "48px 24px" }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          style={{ maxWidth: "380px", width: "100%" }}
        >
          {/* Mobile logo (hidden on desktop) */}
          <motion.div variants={fadeUp} className="lg:hidden" style={{ marginBottom: "48px" }}>
            <span
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "20px",
                color: "#0F0F0F",
                letterSpacing: "-0.02em",
              }}
            >
              PostAura
            </span>
          </motion.div>

          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: "11px",
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "16px",
            }}
          >
            Welcome back
          </motion.p>

          <motion.h1
            variants={fadeUp}
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "36px",
              fontWeight: 400,
              color: "#0F0F0F",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: "12px",
            }}
          >
            Sign in to PostAura
          </motion.h1>

          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "15px",
              color: "#6B6B6B",
              lineHeight: 1.6,
              marginBottom: "40px",
            }}
          >
            Continue with your Google account to start writing.
            Your posts and settings are saved automatically.
          </motion.p>

          {/* Google sign-in button */}
          <motion.div variants={fadeUp}>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                backgroundColor: "#0F0F0F",
                color: "#FAFAF8",
                border: "none",
                borderRadius: "6px",
                padding: "14px 24px",
                fontSize: "15px",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
                cursor: isSigningIn ? "wait" : "pointer",
                transition: "background-color 0.2s ease",
                opacity: isSigningIn ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSigningIn) e.currentTarget.style.backgroundColor = "#D4522A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0F0F0F";
              }}
            >
              {/* Google "G" icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isSigningIn ? "Signing in…" : "Continue with Google"}
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              margin: "32px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E5E0" }} />
            <span
              style={{
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: "10px",
                color: "#6B6B6B",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E5E0" }} />
          </motion.div>

          {/* Back to landing */}
          <motion.div variants={fadeUp} style={{ textAlign: "center" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "1px solid #E5E5E0",
                borderRadius: "6px",
                padding: "12px 24px",
                width: "100%",
                fontSize: "14px",
                fontFamily: "system-ui, sans-serif",
                color: "#0F0F0F",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0F0F0F")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E5E0")}
            >
              ← Back to PostAura
            </button>
          </motion.div>

          {/* Terms */}
          <motion.p
            variants={fadeUp}
            style={{
              marginTop: "32px",
              fontFamily: "system-ui, sans-serif",
              fontSize: "12px",
              color: "#6B6B6B",
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            By signing in, you agree to our terms of use.
            <br />
            Your data stays yours. We never post on your behalf.
          </motion.p>
        </motion.div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: "11px",
            color: "#6B6B6B",
          }}
        >
          raia40094@gmail.com
        </div>
      </div>
    </div>
  );
}
