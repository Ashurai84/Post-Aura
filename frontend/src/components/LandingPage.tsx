import { motion } from "motion/react";
import { Button } from "./ui/button";
import { 
  Linkedin, Bot, Sparkles, Wand2, Image as ImageIcon, 
  ArrowRight, Mail, MessageSquareText, Zap, Target, 
  Clock, CalendarCheck, Users, Edit3, TrendingUp, CheckCircle2
} from "lucide-react";
import { signInWithGoogle } from "../firebase";

const FEATURES = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Target Audience Choice",
    desc: "Tailor your tone instantly. Choose between Students, CEOs, Founders, or a General audience to hit the right chord.",
    glowClass: "bg-blue-500/10",
    iconClass: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: <CalendarCheck className="h-6 w-6" />,
    title: "Consistency Engine",
    desc: "Never miss a day. PostAura helps you maintain your streak by turning small thoughts into full posts in seconds.",
    glowClass: "bg-emerald-500/10",
    iconClass: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Time Flexibility",
    desc: "Get smart suggestions on the best times to post based on your selected audience to maximize your reach.",
    glowClass: "bg-purple-500/10",
    iconClass: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: <ImageIcon className="h-6 w-6" />,
    title: "AI Image Generation",
    desc: "Stop searching for stock photos. Generate custom, high-res visuals that perfectly match your post's vibe.",
    glowClass: "bg-orange-500/10",
    iconClass: "bg-orange-500/10 text-orange-600",
  },
];

export function LandingPage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const floatAnimation = {
    y: ["-10px", "10px"],
    transition: {
      duration: 4,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut" as any
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 transition-all">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Linkedin className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">PostAura</span>
          </div>
          <Button onClick={signInWithGoogle} variant="default" className="rounded-full px-6 shadow-sm hover:shadow-md transition-all">
            Sign In
          </Button>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="relative z-10 max-w-4xl space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/15 transition-colors cursor-default">
              <Sparkles className="h-4 w-4" />
              <span>The anti-robot AI co-writer for LinkedIn</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-balance">
              Turn scattered thoughts into <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">viral LinkedIn posts.</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
              Never break your posting consistency again. Dump your raw ideas, select your audience, and let PostAura craft authentic, high-engagement content that sounds exactly like you.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button onClick={signInWithGoogle} size="lg" className="rounded-full px-8 h-14 text-base shadow-xl shadow-primary/20 hover:scale-105 hover:shadow-primary/30 transition-all duration-300">
                Start Writing for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Storytelling / Use Case Section */}
        <section className="py-24 bg-muted/30 border-y border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="text-center max-w-3xl mx-auto mb-16 space-y-4"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight">
                How it works: <span className="text-primary">The College Fest Scenario</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-muted-foreground">
                You just attended an amazing tech fest. You have a few raw thoughts, but no time to format a perfect post. Here is how PostAura saves your consistency.
              </motion.p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side: The Input */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="bg-background border rounded-2xl p-6 shadow-xl shadow-black/5 relative">
                  <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">1</div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Edit3 className="h-5 w-5 text-primary"/> Brain Dump</h3>
                  <div className="bg-muted/50 p-4 rounded-xl font-mono text-sm text-muted-foreground border border-border/50">
                    "I just attended a session at my college where the CTO of Meesho spoke about building a startup. My key takeaway was to focus on the MVP and fail fast. I want to share this on LinkedIn so I don't miss my consistency."
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <span className="font-semibold text-primary">Pro tip:</span> For a perfect response, start your thoughts with phrases like <i>"I attended..."</i>, <i>"Just listened to..."</i>, or <i>"My key takeaway from..."</i> to capture the event's vibe.
                  </div>
                </div>

                <div className="bg-background border rounded-2xl p-6 shadow-xl shadow-black/5 relative ml-8">
                  <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">2</div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Target className="h-5 w-5 text-primary"/> Target & Time</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Target Audience</label>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Founders</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Students</span>
                        <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm border">CEOs</span>
                        <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm border">General</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Smart Scheduling</label>
                      <div className="flex items-center gap-2 text-sm bg-emerald-500/10 text-emerald-600 px-3 py-2 rounded-lg border border-emerald-500/20 w-fit">
                        <Clock className="h-4 w-4" /> Best time for this audience: <strong>Tomorrow, 9:00 AM</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Side: The Output */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                animate={floatAnimation}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-background border border-border/60 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Super Engagement
                  </div>
                  
                  <div className="flex items-center gap-3 border-b pb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center border border-blue-200">
                      <span className="font-bold text-blue-700">You</span>
                    </div>
                    <div>
                      <div className="font-semibold">Your Name</div>
                      <div className="text-xs text-muted-foreground">Building in public | Tech Enthusiast</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> Scheduled for Tomorrow, 9:00 AM
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm leading-relaxed">
                    <p>Just walked out of an incredible session with the CTO of Meesho at our college fest. My biggest takeaway? 🚀</p>
                    <p><strong>Stop overthinking. Build the MVP. Fail fast.</strong></p>
                    <p>Too many founders (and students!) get stuck in the "perfect product" trap. The market doesn't care about perfect; it cares about solutions.</p>
                    <p>What's the fastest MVP you've ever shipped? Let's discuss below. 👇</p>
                    <p className="text-primary font-medium">#StartupLessons #Meesho #TechLeadership #BuildInPublic #StudentFounders</p>
                  </div>

                  <div className="w-full h-40 bg-muted rounded-xl border flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                    <ImageIcon className="h-8 w-8 mb-2 text-primary/50" />
                    <span className="text-xs font-medium z-10">AI Generated Image: "Tech stage with neon lights"</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight">
              Everything you need for <span className="text-primary">LinkedIn growth.</span>
            </motion.h2>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {FEATURES.map((feature, i) => (
              <motion.div 
                key={i} variants={fadeUp} whileHover={{ y: -5 }}
                className="bg-background border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group cursor-default"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500 ${feature.glowClass}`} />
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.iconClass}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA & Footer */}
        <section className="border-t border-border/50 bg-muted/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center space-y-8 relative z-10">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              Ready to build your personal brand?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-xl"
            >
              Join the professionals using PostAura to write better, post consistently, and grow their network.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            >
              <Button onClick={signInWithGoogle} size="lg" className="rounded-full px-10 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300">
                Start Writing Now
              </Button>
            </motion.div>
          </div>
          
          <footer className="border-t border-border/50 py-12 text-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Linkedin className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-foreground text-lg tracking-tight">PostAura</span>
              </div>
              <p className="text-sm max-w-sm mx-auto">
                Built for professionals who value authenticity and want to stand out in a sea of AI-generated content.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <a href="mailto:raia40094@gmail.com" className="group inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors bg-background border px-5 py-2.5 rounded-full shadow-sm hover:shadow-md">
                  <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  raia40094@gmail.com
                </a>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
