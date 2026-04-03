import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Check, Sparkles, Zap, GraduationCap, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { auth } from "../firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const [isOrdering, setIsOrdering] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const handleUpgrade = async (plan: "student" | "pro") => {
    setIsOrdering(true);
    
    // Log intent to backend (don't block the actual upgrade flow)
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        fetch(`${API_URL}/api/analytics/track-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ plan })
        }).catch(e => console.warn("Intent tracking failed:", e));
      }
    } catch (e) {
      console.warn("Analytics call prep failed:", e);
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");
      
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ plan, demo: isDemoMode })
      });

      if (!response.ok) throw new Error("Failed to create payment order");
      
      const data = await response.json();
      if (data.payment_url) {
        // Use window.location instead of window.open to keep flow in same tab for demo
        window.location.href = data.payment_url;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-background border rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden relative"
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 rounded-full"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="p-8 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Sparkles className="h-4 w-4" />
                <span>PostAura Premium</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">You've reached your free limit</h2>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Upgrade now to unlock unlimited generations, 4K images, and your personal voice learning engine.
              </p>

              <div className="flex items-center justify-center gap-3 p-3 bg-primary/5 rounded-2xl max-w-xs mx-auto border border-primary/10">
                <div 
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isDemoMode ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                  onClick={() => setIsDemoMode(!isDemoMode)}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isDemoMode ? "translate-x-6" : ""}`} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">Demo Mode</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Skip payment for testing</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-8 bg-muted/30 border-t">
              {/* Student Plan */}
              <div className="bg-background border rounded-2xl p-6 space-y-6 flex flex-col">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <GraduationCap className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Student</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">₹49</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-3 flex-1">
                  {[
                    "Unlimited Text Generations",
                    "Standard AI Images",
                    "Basic History Management",
                    "Email Support"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full rounded-full" 
                  variant="outline"
                  onClick={() => handleUpgrade("student")}
                  disabled={isOrdering}
                >
                  {isOrdering ? <Loader2 className="h-4 w-4 animate-spin" /> : (isDemoMode ? "Try Student (Free Demo)" : "Choose Student")}
                </Button>
              </div>

              {/* Pro Plan */}
              <div className="bg-background border-2 border-primary rounded-2xl p-6 space-y-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                  Most Popular
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Pro</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">₹99</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-3 flex-1">
                  {[
                    "Everything in Student",
                    "4K Ultra AI Images",
                    "Advanced History & Revert",
                    "Priority AI Processing",
                    "Priority Support"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full rounded-full shadow-lg shadow-primary/20"
                  onClick={() => handleUpgrade("pro")}
                  disabled={isOrdering}
                >
                  {isOrdering ? <Loader2 className="h-4 w-4 animate-spin" /> : (isDemoMode ? "Try Pro (Free Demo)" : "Go Pro Now")}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
