import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { signInWithGoogle, handleRedirectResult } from "../firebase";

export function LandingPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    handleRedirectResult().catch(() => {});
  }, []);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // silent
      } else if (code === "auth/unauthorized-domain") {
        alert("Sign-in is not available from this domain right now. Please try again later.");
      } else {
        alert("Sign-in failed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: "#FAFAF8",
        color: "#0F0F0F",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ─── NAV ─── */}
      <nav
        style={{ borderBottom: "1px solid #E5E5E0" }}
        className="fixed top-0 w-full z-50 backdrop-blur-md"
      >
        <div
          className="flex items-center justify-between max-w-6xl mx-auto"
          style={{ padding: "16px 24px", backgroundColor: "rgba(250,250,248,0.85)" }}
        >
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "18px",
              fontWeight: 400,
              color: "#0F0F0F",
              letterSpacing: "-0.02em",
            }}
          >
            PostAura
          </span>
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "system-ui, sans-serif",
              fontSize: "14px",
              color: "#6B6B6B",
              padding: 0,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            {isSigningIn ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </nav>

      <main style={{ paddingTop: "80px" }}>
        {/* ─── HERO ─── */}
        <section
          className="max-w-3xl mx-auto"
          style={{ padding: "100px 24px 80px" }}
        >
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: "11px",
                color: "#6B6B6B",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "32px",
              }}
            >
              PostAura — LinkedIn Writing Engine
            </motion.p>

            <motion.h1
              variants={fadeUp}
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "clamp(42px, 6vw, 68px)",
                fontWeight: 400,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "#0F0F0F",
                marginBottom: "32px",
              }}
            >
              Most people write
              <br />
              great posts.
              <br />
              Nobody reads them.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "18px",
                lineHeight: 1.6,
                color: "#6B6B6B",
                maxWidth: "440px",
                marginBottom: "48px",
              }}
            >
              The algorithm doesn't punish bad writing.
              <br />
              It punishes bad formatting.
              <br />
              PostAura fixes that.
            </motion.p>

            <motion.div variants={fadeUp}>
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                style={{
                  backgroundColor: "#0F0F0F",
                  color: "#FAFAF8",
                  border: "none",
                  borderRadius: "6px",
                  padding: "14px 32px",
                  fontSize: "15px",
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D4522A")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0F0F0F")}
              >
                {isSigningIn ? "Signing in…" : "Start Writing — It's Free"}
              </button>
            </motion.div>

            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: "12px",
                color: "#6B6B6B",
                marginTop: "24px",
              }}
            >
              12 writers already using PostAura
            </motion.p>
          </motion.div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section style={{ borderTop: "1px solid #E5E5E0", padding: "80px 24px" }}>
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "36px",
                fontWeight: 400,
                color: "#0F0F0F",
                marginBottom: "64px",
                letterSpacing: "-0.02em",
              }}
            >
              Here's what PostAura does.
            </motion.h2>

            <div
              className="grid gap-12"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              {/* Left: Steps */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
              >
                {[
                  {
                    num: "01",
                    title: "Brain dump your thoughts",
                    body: "Paste raw notes from a talk, a meeting, a shower thought. Don't format anything — that's our job.",
                  },
                  {
                    num: "02",
                    title: "Pick your audience",
                    body: "Students, founders, CEOs, or general. PostAura adjusts tone, hooks, and structure to match who you're writing for.",
                  },
                  {
                    num: "03",
                    title: "Get a ready-to-post draft",
                    body: "Formatted for the algorithm. Authentic to your voice. One click to copy, paste, publish.",
                  },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    style={{
                      paddingBottom: "32px",
                      marginBottom: "32px",
                      borderBottom: i < 2 ? "1px solid #E5E5E0" : "none",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                        fontSize: "11px",
                        color: "#6B6B6B",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "12px",
                      }}
                    >
                      {step.num}
                    </p>
                    <h3
                      style={{
                        fontFamily: "system-ui, sans-serif",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#0F0F0F",
                        marginBottom: "8px",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "system-ui, sans-serif",
                        fontSize: "15px",
                        color: "#6B6B6B",
                        lineHeight: 1.6,
                      }}
                    >
                      {step.body}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Right: Mock post */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                <div
                  style={{
                    border: "1px solid #E5E5E0",
                    borderRadius: "8px",
                    padding: "32px",
                    backgroundColor: "#FFFFFF",
                    position: "relative",
                  }}
                >
                  <p
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "20px",
                      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                      fontSize: "11px",
                      color: "#D4522A",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    High reach ↑
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      paddingBottom: "20px",
                      marginBottom: "20px",
                      borderBottom: "1px solid #E5E5E0",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#E5E5E0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#6B6B6B",
                      }}
                    >
                      Y
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F" }}>
                        Your Name
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#6B6B6B",
                          fontFamily: "system-ui, sans-serif",
                        }}
                      >
                        Building in public · 2h
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: "15px",
                      lineHeight: 1.7,
                      color: "#0F0F0F",
                    }}
                  >
                    <p style={{ marginBottom: "12px" }}>
                      Just walked out of an incredible session with the CTO of Meesho at our
                      college fest.
                    </p>
                    <p style={{ marginBottom: "12px", fontWeight: 600 }}>
                      Stop overthinking. Build the MVP. Fail fast.
                    </p>
                    <p style={{ marginBottom: "12px" }}>
                      Too many founders get stuck in the "perfect product" trap. The market
                      doesn't care about perfect — it cares about solutions.
                    </p>
                    <p>What's the fastest MVP you've ever shipped?</p>
                  </div>

                  <p
                    style={{
                      marginTop: "20px",
                      fontSize: "13px",
                      color: "#6B6B6B",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    #StartupLessons #BuildInPublic #Meesho
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES (2 columns, no cards) ─── */}
        <section style={{ borderTop: "1px solid #E5E5E0", padding: "80px 24px" }}>
          <div
            className="max-w-5xl mx-auto"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
              gap: "48px",
              alignItems: "start",
            }}
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h3
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontStyle: "italic",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#0F0F0F",
                  lineHeight: 1.2,
                  marginBottom: "16px",
                  letterSpacing: "-0.02em",
                }}
              >
                Your words,
                <br />
                never diluted.
              </h3>
              <p
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "16px",
                  color: "#6B6B6B",
                  lineHeight: 1.6,
                }}
              >
                PostAura preserves your voice. No corporate jargon injection. No
                "thought-leadership" filler. What you say stays yours — just structured to
                perform.
              </p>
            </motion.div>

            {/* Vertical divider */}
            <div style={{ backgroundColor: "#E5E5E0", width: "1px", minHeight: "100%" }} />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h3
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontStyle: "italic",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#0F0F0F",
                  lineHeight: 1.2,
                  marginBottom: "16px",
                  letterSpacing: "-0.02em",
                }}
              >
                Zero "delve".
                <br />
                Zero "tapestry".
              </h3>
              <p
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "16px",
                  color: "#6B6B6B",
                  lineHeight: 1.6,
                }}
              >
                We actively strip AI-sounding words. Your readers won't cringe. Your
                LinkedIn won't feel like it was written by a chatbot pretending to be human.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section
          style={{
            backgroundColor: "#0F0F0F",
            padding: "80px 24px",
          }}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeUp}
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 400,
                color: "#FAFAF8",
                marginBottom: "16px",
                letterSpacing: "-0.02em",
              }}
            >
              Write once. Be remembered.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "16px",
                color: "#6B6B6B",
                marginBottom: "40px",
              }}
            >
              Free to use. No credit card.
            </motion.p>

            <motion.div variants={fadeUp}>
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                style={{
                  backgroundColor: "#D4522A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "14px 32px",
                  fontSize: "15px",
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {isSigningIn ? "Signing in…" : "Start Writing Now →"}
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer
          style={{
            borderTop: "1px solid #E5E5E0",
            padding: "24px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#FAFAF8",
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "14px",
              color: "#6B6B6B",
            }}
          >
            PostAura
          </span>
          <a
            href="mailto:raia40094@gmail.com"
            style={{
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: "12px",
              color: "#6B6B6B",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            raia40094@gmail.com
          </a>
        </footer>
      </main>
    </div>
  );
}
