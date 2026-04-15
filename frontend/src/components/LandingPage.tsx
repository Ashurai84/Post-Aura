import { useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import {
  CheckCircle2,
  ChevronRight,
  CircleArrowRight,
  Copy,
  FileText,
  Linkedin,
  Mail,
  MessageSquareText,
  Quote,
  Sparkles,
  Timer,
} from "lucide-react";
import { Button } from "./ui/button";
import { signInWithGoogle } from "../firebase";

export function LandingPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [demoState, setDemoState] = useState<"before" | "after">("before");
  const [demoInput, setDemoInput] = useState(
    "Had a great client call today. They said our product finally feels simple."
  );
  const [demoOutput, setDemoOutput] = useState(
    "Today a client said something I want to remember: \"Your product feels simple now.\"\n\nThat sentence means more than any dashboard metric. We removed extra steps, and clarity finally showed up in the experience.\n\nIf users hesitate, the interface is still doing too much.\n\n#BuildInPublic #ProductDesign #LinkedInCreators"
  );
  const [demoTone, setDemoTone] = useState<"crisp" | "story" | "opinion">("story");
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    mass: 0.2,
  });
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, shouldReduceMotion ? 0 : -30]);

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 },
    },
  };

  // Used by all CTA buttons so sign-in behavior stays consistent.
  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        alert("Sign-in failed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const createDemoOutput = (rawInput: string, tone: "crisp" | "story" | "opinion") => {
    const cleaned = rawInput.trim() || "I shipped something small today and learned a useful lesson.";
    const line = cleaned.endsWith(".") ? cleaned : `${cleaned}.`;

    if (tone === "crisp") {
      return `${line}\n\nSmall fix. Big signal. Less friction gets faster trust.\n\nIf your user has to think too hard, your product is still unfinished.\n\n#ProductThinking #BuildInPublic #LinkedIn`;
    }

    if (tone === "opinion") {
      return `${line}\n\nMost teams add features to look impressive. Great teams remove steps so users move faster.\n\nComplexity is not depth. Simplicity is discipline.\n\n#FounderMode #ProductStrategy #LinkedInCreators`;
    }

    return `Today this happened: ${line}\n\nA client called our product \"simple\" for the first time. That happened only after we removed unnecessary choices.\n\nThe best growth move is often subtraction, not addition.\n\n#BuildInPublic #ProductDesign #CreatorJourney`;
  };

  const triggerDemo = () => {
    if (isGeneratingDemo) return;
    setIsGeneratingDemo(true);
    setDemoState("before");
    const nextOutput = createDemoOutput(demoInput, demoTone);

    if (shouldReduceMotion) {
      setDemoOutput(nextOutput);
      setDemoState("after");
      setIsGeneratingDemo(false);
      return;
    }

    window.setTimeout(() => {
      setDemoOutput(nextOutput);
      setDemoState("after");
      setIsGeneratingDemo(false);
    }, 650);
  };

  return (
    <div
      className="min-h-screen text-[#101112] overflow-x-hidden font-sans selection:bg-[#f97316]/25"
      style={{
        background:
          "radial-gradient(circle at 10% 2%, rgba(249, 115, 22, 0.14), transparent 30%), radial-gradient(circle at 88% 6%, rgba(56, 189, 248, 0.12), transparent 34%), #f7f4ee",
      }}
    >
      <nav className="fixed top-0 w-full z-50 border-b border-white/15 bg-[#0f1116]/78 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/20 bg-white/10">
              <Linkedin className="h-5 w-5 text-[#F5F3EE]" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#F5F3EE]">PostAura</span>
          </div>
          <Button
            onClick={handleSignIn}
            variant="outline"
            className="rounded-full px-6 border-white/25 bg-white/10 text-[#F5F3EE] hover:bg-white/20"
          >
            {isSigningIn ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </nav>

      <motion.div
        className="fixed top-16 left-0 right-0 h-0.5 z-50 origin-left"
        style={{
          scaleX: progressScaleX,
          background: "linear-gradient(90deg, #f97316, #38bdf8)",
          boxShadow: "0 0 22px rgba(56, 189, 248, 0.45)",
        }}
      />

      <main>
        <section
          className="px-6 pt-24 pb-20"
          style={{
            background:
              "radial-gradient(circle at 14% 10%, rgba(249, 115, 22, 0.22), transparent 35%), radial-gradient(circle at 84% 4%, rgba(56, 189, 248, 0.16), transparent 32%), linear-gradient(180deg, #0a0d13 0%, #121722 100%)",
          }}
        >
          <motion.div
            className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center"
            style={shouldReduceMotion ? undefined : { y: heroY }}
          >
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/12 text-[#e9dfd1] text-xs sm:text-sm font-medium border border-white/15">
                <Sparkles className="h-4 w-4 text-[#ffd4a8]" />
                <span>Made for creators who keep skipping LinkedIn</span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="max-w-3xl text-3xl md:text-5xl xl:text-6xl font-bold leading-[1.06] tracking-tight text-[#f8f5ef]">
                Turn 1-2 messy lines into a LinkedIn post in your voice.
              </motion.h1>

              <motion.p variants={fadeUp} className="text-base md:text-lg text-[#d8d0c3] max-w-xl leading-relaxed">
                No prompts. No rewrite loop. Just daily visibility with less effort.
              </motion.p>

              <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                {[
                  { icon: <Timer className="h-4 w-4" />, value: "10 sec", label: "to first transformation" },
                  { icon: <MessageSquareText className="h-4 w-4" />, value: "Voice match", label: "sounds like your tone" },
                  { icon: <CheckCircle2 className="h-4 w-4" />, value: "No skip days", label: "built for lazy consistency" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <div className="flex items-center gap-2 text-[#ffd8b4] text-xs mb-1">{item.icon}<span>{item.value}</span></div>
                    <p className="text-xs text-[#d7cdbf]">{item.label}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} className="space-y-3">
                <label htmlFor="demo-input" className="text-xs uppercase tracking-[0.12em] text-[#cabfae]">
                  Try the live input
                </label>
                <textarea
                  id="demo-input"
                  value={demoInput}
                  onChange={(event) => {
                    setDemoInput(event.target.value);
                    setDemoState("before");
                  }}
                  className="w-full max-w-xl min-h-24 rounded-2xl border border-white/20 bg-white/10 text-[#f4efe6] placeholder:text-[#bcae9d] p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/60"
                  placeholder="Had a great client call today..."
                />

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "story", label: "Story" },
                    { id: "crisp", label: "Crisp" },
                    { id: "opinion", label: "Opinion" },
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => {
                        setDemoTone(tone.id as "story" | "crisp" | "opinion");
                        setDemoState("before");
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs border transition ${
                        demoTone === tone.id
                          ? "bg-[#38bdf8]/25 border-[#38bdf8]/60 text-[#d6f2ff]"
                          : "bg-white/10 border-white/20 text-[#d8cec0]"
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                <Button
                  onClick={triggerDemo}
                  size="lg"
                  className="rounded-full h-12 px-7 text-base bg-[#f97316] text-white hover:bg-[#fb8a35]"
                >
                  {isGeneratingDemo ? "Generating..." : "Try it in 10 seconds"}
                  <CircleArrowRight className="ml-2 h-4 w-4" />
                </Button>
                </div>
              </motion.div>

              <motion.p variants={fadeUp} className="text-xs text-[#c2b6a5] uppercase tracking-[0.12em]">No signup required for preview demo</motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-[#38bdf8]/20 blur-3xl" />
              <div className="relative rounded-[1.7rem] border border-white/15 bg-[#11151f]/92 p-5 md:p-6 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] tracking-[0.14em] uppercase text-[#cabfae]">Live Preview</p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#38bdf8]/20 text-[#d6f3ff] border border-[#38bdf8]/35">Type and transform</span>
                </div>

                <div className="space-y-4">
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl bg-[#f5f3ee] p-4 text-[#141414]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.13em] text-[#6f6a61] mb-3">Your note</p>
                    <div className="rounded-xl border border-[#e7dfd3] bg-white p-3">
                      <p className="text-sm text-[#2a2a2a]">{demoInput || "Type one line to preview the transformation."}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ opacity: demoState === "after" ? 1 : 0.74, y: demoState === "after" ? 0 : 4 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl bg-[#f5f3ee] p-4 text-[#141414]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.13em] text-[#6f6a61] mb-3">Ready to post output</p>
                    <div className="rounded-xl border border-[#e7dfd3] bg-white p-3 text-sm leading-relaxed space-y-2">
                      {demoOutput.split("\n").map((line, index) => {
                        if (!line.trim()) {
                          return <div key={`spacer-${index}`} className="h-1" />;
                        }

                        const isHashtagLine = line.trim().startsWith("#");
                        return (
                          <p key={`line-${index}`} className={isHashtagLine ? "text-[#13599a] font-medium" : ""}>
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={false}
                  animate={demoState === "after" ? { x: [0, 0, 0], opacity: [0.95, 1, 0.95] } : { x: 0, opacity: 0.85 }}
                  transition={{ duration: 0.9 }}
                  className="mt-4 flex items-center gap-2 text-[11px] text-[#dbcfbe]"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-[#38bdf8]" />
                  <span>{demoState === "before" ? "Tap Try it in 10 seconds" : "Transformation complete"}</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="px-6 py-16 bg-[#f7f4ee]">
          <div className="max-w-6xl mx-auto rounded-[2rem] border border-[#eadfce] bg-white p-6 md:p-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[#17181d]">Why posting keeps slipping</motion.h2>
              <motion.p variants={fadeUp} className="mt-3 text-[#595c66] max-w-2xl">You are not lazy. The process is heavy at the exact moment you need to publish.</motion.p>
              <motion.div variants={staggerContainer} className="mt-7 grid gap-4 md:grid-cols-3">
                {[
                  "You open LinkedIn and freeze on what to post",
                  "A simple thought turns into 30 minutes of rewriting",
                  "You skip one day, then lose momentum for a week",
                ].map((pain) => (
                  <motion.div key={pain} variants={fadeUp} className="rounded-2xl border border-[#ebe1d2] bg-[#fffcf8] p-5">
                    <p className="text-sm text-[#23252c] font-medium">{pain}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-16 bg-[#f7f4ee]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={staggerContainer}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[#17181d]">
                How it works
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-[#4e4e55] leading-relaxed">
                3 simple steps. No overthinking loop.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className="grid gap-4 md:grid-cols-3"
            >
              {[
                {
                  icon: <FileText className="h-5 w-5" />,
                  title: "1. Type 1-2 messy lines",
                  body: "No prompt engineering. Just type what happened.",
                },
                {
                  icon: <Sparkles className="h-5 w-5" />,
                  title: "2. PostAura structures in your voice",
                  body: "Turns rough thought into a clean, human LinkedIn format.",
                },
                {
                  icon: <Copy className="h-5 w-5" />,
                  title: "3. Copy -> Paste -> Post",
                  body: "One clean output you can publish immediately.",
                },
              ].map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                  className="rounded-2xl border border-[#e4ded3] bg-white p-5 shadow-[0_10px_28px_-20px_rgba(0,0,0,0.25)] relative"
                >
                  <div className="mb-4 w-10 h-10 rounded-xl bg-[#f9efe4] text-[#d4522a] flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[#17181d] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#5b5b63] leading-relaxed">{feature.body}</p>
                  <span className="hidden md:inline-flex absolute -right-4 top-1/2 -translate-y-1/2 text-[#d6ccbf]"><ChevronRight className="h-5 w-5" /></span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-16 bg-[#f7f4ee]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={staggerContainer}
              className="mb-10"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[#17181d]">Proof from real posting outcomes</motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-[#595c66] max-w-3xl">No vanity dashboards here. See direct before-to-after transformations from real creator-style inputs.</motion.p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} className="grid gap-5 lg:grid-cols-2">
              <motion.div variants={fadeUp} className="rounded-3xl border border-[#e5dccf] bg-white p-6">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#7d7368]">Transformation gallery</p>
                <div className="mt-4 grid gap-3">
                  {[
                    {
                      before: "Spent 2 hours fixing onboarding confusion today.",
                      after: "I spent two hours on onboarding today, and the issue was not design quality. It was decision overload. We removed three choices and activation jumped immediately. Simpler is harder, but it wins. #ProductDesign #BuildInPublic",
                    },
                    {
                      before: "A recruiter asked for my portfolio and I froze.",
                      after: "A recruiter asked for my portfolio today, and I realized I had no clear narrative behind my work. Skills are not enough if your story is scattered. This week I am rebuilding my portfolio around outcomes, not just screens. #CareerGrowth #DesignCareer",
                    },
                    {
                      before: "Our first paying user churned in 4 days.",
                      after: "Our first paying user churned in four days. Painful, but useful. The product was not failing because of features, it was failing because setup felt heavy. We are now rebuilding onboarding before adding anything new. #StartupLessons #SaaS",
                    },
                  ].map((item, index) => (
                    <div key={`transform-${index}`} className="rounded-2xl border border-[#ece3d6] bg-[#fffdf8] p-4">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#7d7368]">Before</p>
                      <p className="text-sm text-[#22242b] mt-1">{item.before}</p>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#0c5f8e] mt-3">After</p>
                      <p className="text-sm text-[#2e4f63] mt-1">{item.after}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="rounded-3xl border border-[#e5dccf] bg-white p-6">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#7d7368]">Creator snapshots</p>
                <p className="text-xs text-[#6a6258] mt-2">Evidence labels: sample transformation, creator-submitted screenshot, internal product test.</p>
                <div className="mt-4 grid gap-3">
                  {[
                    {
                      name: "Ankit, Product Designer",
                      line: "I stopped skipping days because I no longer start from a blank page.",
                      meta: "Creator-submitted screenshot",
                    },
                    {
                      name: "Riya, Student Founder",
                      line: "My rough notes now turn into posts that still sound like me.",
                      meta: "Internal product test",
                    },
                  ].map((quote) => (
                    <div key={quote.name} className="rounded-2xl border border-[#ece3d6] bg-[#fffdf8] p-4">
                      <div className="flex items-start gap-2">
                        <Quote className="h-4 w-4 mt-0.5 text-[#f97316]" />
                        <div>
                          <p className="text-sm text-[#20222a]">{quote.line}</p>
                          <p className="mt-2 text-xs text-[#61666f]">{quote.name}</p>
                          <p className="text-xs text-[#0c5f8e]">{quote.meta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-16 bg-[#f7f4ee]">
          <div className="max-w-6xl mx-auto rounded-[2rem] border border-[#e3d8c9] bg-white p-7 md:p-10 shadow-[0_25px_80px_-60px_rgba(8,16,32,0.45)]">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={staggerContainer}
              className="space-y-5"
            >
              <motion.p variants={fadeUp} className="text-[11px] uppercase tracking-[0.12em] text-[#7b6f60]">Why not just use ChatGPT?</motion.p>

              <motion.div variants={staggerContainer} className="grid md:grid-cols-2 gap-4">
                <motion.div variants={fadeUp} className="rounded-2xl border border-[#eadfce] bg-[#f9f6f1] p-5">
                  <h3 className="text-xl font-semibold text-[#1f232d]">ChatGPT</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[#5e636e]">
                    <li>Generic output unless you keep prompting</li>
                    <li>Prompt-heavy workflow</li>
                    <li>Hard to keep your exact tone daily</li>
                  </ul>
                </motion.div>

                <motion.div variants={fadeUp} className="rounded-2xl border border-[#d6e6f2] bg-[#f2f9ff] p-5">
                  <h3 className="text-xl font-semibold text-[#122b3f]">PostAura</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[#36566b]">
                    <li>Starts from 1-2 messy lines</li>
                    <li>Instant ready-to-post transformation</li>
                    <li>Voice-matched output built for daily consistency</li>
                  </ul>
                </motion.div>
              </motion.div>

              <motion.p variants={fadeUp} className="text-center text-lg md:text-2xl font-semibold text-[#182634] pt-2">
                ChatGPT helps you write. PostAura makes you post.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <section className="px-6 pt-16 pb-20 bg-[#f7f4ee]">
          <div className="max-w-5xl mx-auto rounded-[2rem] border border-white/10 bg-[#10131b] p-8 md:p-12 text-center shadow-2xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.35 }}
              variants={staggerContainer}
              className="space-y-4"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#c5b8a6]">
                <Sparkles className="h-4 w-4 text-[#ffd2a8]" />
                Fastest way to stop skipping
              </motion.div>

              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-semibold text-[#f5f3ee] leading-tight">
                Your next post is already in your head.
                <br />
                Just drop it in.
              </motion.h2>

              <motion.p variants={fadeUp} className="text-[#bcae9d] max-w-2xl mx-auto">
                One small input. One clean output. Then copy, paste, publish.
              </motion.p>

              <motion.div variants={fadeUp}>
                <Button
                  onClick={triggerDemo}
                  size="lg"
                  className="rounded-full h-12 px-8 text-base bg-[#f97316] text-white hover:bg-[#fb8a35]"
                >
                  Try your first post now
                </Button>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Button
                  onClick={handleSignIn}
                  variant="ghost"
                  className="text-[#ded2c4] hover:text-white hover:bg-white/10"
                >
                  {isSigningIn ? "Signing in..." : "Sign in to save your posts"}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <footer className="border-t border-[#e4ddd2] py-10 px-6 bg-[#f7f4ee]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#17181d]">
              <Linkedin className="h-4 w-4 text-[#f97316]" />
              <span className="font-semibold">PostAura</span>
            </div>
            <p className="text-sm text-[#696970] text-center">Built for effortless daily LinkedIn consistency.</p>
            <a href="mailto:raia40094@gmail.com" className="inline-flex items-center gap-2 text-sm text-[#4e4e55] hover:text-[#f97316] transition-colors">
              <Mail className="h-4 w-4" />
              raia40094@gmail.com
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
