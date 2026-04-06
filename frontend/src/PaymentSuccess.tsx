import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { auth } from "./firebase";
import { motion } from "motion/react";
import { getApiBase } from "./lib/api";

export default function PaymentSuccess() {
  const [status, setStatus] = useState<"loading" | "success" | "pending">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isDemo = searchParams.get("demo") === "true";

    if (isDemo) {
      setStatus("success");
      return;
    }

    const checkStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const response = await fetch(`${getApiBase()}/api/payment/status`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isPro) {
            setStatus("success");
          } else {
            // If not pro yet, wait a bit and retry
            setTimeout(checkStatus, 3000);
          }
        }
      } catch (error) {
        console.error("Status check failed:", error);
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card border rounded-3xl p-8 shadow-2xl text-center space-y-6"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
            <h1 className="text-2xl font-bold">Verifying Payment...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your transaction with Instamojo.</p>
          </>
        ) : (
          <>
            <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Payment Successful!</h1>
              <p className="text-muted-foreground">Welcome to PostAura Pro. Your account has been upgraded successfully.</p>
            </div>
            <div className="pt-4">
              <Button onClick={() => navigate("/dashboard")} className="w-full rounded-full h-12 text-lg">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
