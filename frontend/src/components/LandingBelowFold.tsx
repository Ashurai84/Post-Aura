import { motion } from "motion/react";

interface LandingBelowFoldProps {
  isSigningIn: boolean;
  onSignIn: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delayChildren: 0.04, staggerChildren: 0.1 } },
};

export default function LandingBelowFold({ isSigningIn, onSignIn }: LandingBelowFoldProps) {
  return (
    <>
      {/* HOW IT WORKS: used for the 3-step product narrative under the hero. */}
      <section style={{ borderTop: "1px solid #E5E5E0", padding: "clamp(64px, 8vw, 92px) 24px" }}>
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
            From thought → post in 2 minutes
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-4 md:grid-cols-3"
          >
            {[
              {
                num: "01",
                icon: "⚡",
                time: "10 seconds",
                title: "Dump what happened",
                body: "No formatting needed.",
              },
              {
                num: "02",
                icon: "🧠",
                time: "5 seconds",
                title: "Add your takeaway",
                body: "What you actually think.",
              },
              {
                num: "03",
                icon: "✅",
                time: "Instant",
                title: "Get a ready-to-post draft",
                body: "Copy → paste → done.",
              },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className="rounded-2xl border border-[#E9E9E5] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-28px_rgba(15,15,15,0.35)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <p
                    style={{
                      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                      fontSize: "11px",
                      color: "#6B6B6B",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{step.icon}</span>
                    <span>{step.num}</span>
                  </p>
                  <span
                    style={{
                      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                      fontSize: "10px",
                      color: "#D4522A",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      border: "1px solid #F1D8CF",
                      borderRadius: "999px",
                      padding: "4px 9px",
                      backgroundColor: "#FFF6F2",
                    }}
                  >
                    {step.time}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#0F0F0F",
                    marginBottom: "8px",
                    lineHeight: 1.2,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "14px",
                    color: "#6B6B6B",
                    lineHeight: 1.45,
                  }}
                >
                  {step.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DIFFERENTIATION: used to position PostAura against generic AI writing tools. */}
      <section style={{ borderTop: "1px solid #E5E5E0", padding: "clamp(64px, 8vw, 92px) 24px" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5.5 items-stretch">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            style={{
              border: "1px solid #E5E5E0",
              borderRadius: "14px",
              backgroundColor: "#FFFFFF",
              padding: "28px",
            }}
          >
            <p
              style={{
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: "10px",
                color: "#6B6B6B",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Generic AI flow
            </p>
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
              ChatGPT makes
              <br />
              you think harder
            </h3>
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                "prompting again and again",
                "editing forever",
                "generic tone",
              ].map((point) => (
                <p key={point} style={{ fontSize: "15px", color: "#6B6B6B", lineHeight: 1.4 }}>
                  • {point}
                </p>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            style={{
              border: "1px solid #EFD3C9",
              borderRadius: "14px",
              background: "linear-gradient(180deg, #FFF8F5 0%, #FFFFFF 100%)",
              padding: "28px",
            }}
          >
            <p
              style={{
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: "10px",
                color: "#D4522A",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              PostAura flow
            </p>
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
              PostAura
              <br />
              removes friction
            </h3>
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                "tap → type → post",
                "learns your voice",
                "improves every post",
              ].map((point) => (
                <p key={point} style={{ fontSize: "15px", color: "#6B6B6B", lineHeight: 1.4 }}>
                  • {point}
                </p>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              marginTop: "14px",
            }}
          >
            <p
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "clamp(24px, 3.3vw, 34px)",
                color: "#0F0F0F",
                letterSpacing: "-0.02em",
              }}
            >
              ChatGPT helps you write. PostAura helps you post.
            </p>
          </motion.div>
        </div>
      </section>

      {/* BOTTOM CTA: used as the final conversion step before footer exit. */}
      <section
        style={{
          backgroundColor: "#0F0F0F",
          padding: "clamp(64px, 8vw, 92px) 24px",
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
            Your next post takes 2 minutes.
            <br />
            Or never happens.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "16px",
              color: "#B7B7B2",
              marginBottom: "12px",
            }}
          >
            You already have the thoughts. PostAura helps you ship them.
          </motion.p>

          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: "11px",
              color: "#9A9A93",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "32px",
            }}
          >
            Free. No credit card.
          </motion.p>

          <motion.div variants={fadeUp}>
            <motion.button
              onClick={onSignIn}
              disabled={isSigningIn}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
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
                boxShadow: "0 0 0 rgba(212, 82, 42, 0.45)",
                transition: "opacity 0.2s ease, box-shadow 0.25s ease, transform 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 36px rgba(212, 82, 42, 0.32)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 0 rgba(212, 82, 42, 0)";
              }}
            >
              {isSigningIn ? "Signing in…" : "Start Writing Now →"}
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER: used for brand and support contact. */}
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
    </>
  );
}
