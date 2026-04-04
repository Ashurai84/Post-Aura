import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Users,
  Zap,
  TrendingUp,
  MousePointer2,
  Sparkles,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

/** Backend URL for `/api/*`. */
function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");

  // In development, if we're not on port 3000, we probably need to hit port 3000 for the API
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return "";
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  postGenerations: number;
  imageGenerations: number;
  intents: {
    pro: number;
    student: number;
    total: number;
  };
  conversionRate: number;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  planType: string;
  createdAt: { _seconds: number; _nanoseconds: number } | string | any;
  postsAnalyzed: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate("/", { replace: true });
          return;
        }

        const token = await currentUser.getIdToken();
        const base = getApiBase();
        
        // Fetch Stats
        const statsRes = await fetch(`${base}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Fetch Users
        const usersRes = await fetch(`${base}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!statsRes.ok || !usersRes.ok) {
          const err = await statsRes.json().catch(() => ({ error: "Failed to fetch data" }));
          throw new Error(err.error || "Access denied or server error.");
        }

        const statsData = await statsRes.json();
        const usersData = await usersRes.json();

        setStats(statsData);
        setUsers(usersData.users || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center space-y-4">
        <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Admin Error</h1>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 space-y-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mb-2 uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" /> Back to App
          </button>
          <h1 className="text-3xl font-bold tracking-tight">PostAura Command Center</h1>
          <p className="text-muted-foreground">Real-time growth and intent analytics.</p>
        </div>
        <div className="bg-background border rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Live System Monitoring</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5" />}
          description="Registered on PostAura"
          color="blue"
        />
        <MetricCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<Zap className="h-5 w-5" />}
          description="Users with 1+ generation"
          color="emerald"
        />
        <MetricCard
          title="Pro Users"
          value={stats.proUsers}
          icon={<TrendingUp className="h-5 w-5" />}
          description={`${stats.conversionRate.toFixed(1)}% Conversion Rate`}
          color="primary"
        />
        <MetricCard
          title="Price Clicks"
          value={stats.intents.total}
          icon={<MousePointer2 className="h-5 w-5" />}
          description="Engagement with pricing"
          color="amber"
        />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-3xl p-6 shadow-sm space-y-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">User Registry</h2>
            <div className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded-md tracking-tight uppercase">
              Last 100 Joined
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-4 pt-1 font-semibold">User</th>
                  <th className="pb-4 pt-1 font-semibold">Plan</th>
                  <th className="pb-4 pt-1 font-semibold">Activity</th>
                  <th className="pb-4 pt-1 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border/30">
                {users.map((u) => (
                  <tr key={u.uid} className="group hover:bg-muted/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {u.displayName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">{u.displayName}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      {u.isPro ? (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-tight border border-primary/20">
                          {u.planType || "Pro"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-tight border border-border">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium">{u.postsAnalyzed} Posts</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border rounded-3xl p-6 shadow-sm space-y-6 h-fit">
          <h2 className="text-xl font-bold">Content Engine Usage</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Posts Generated</span>
              </div>
              <span className="text-2xl font-bold">{stats.postGenerations}</span>
            </div>
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Images Generated</span>
              </div>
              <span className="text-2xl font-bold">{stats.imageGenerations}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pricing Intent</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-xs">Pro Plan (₹99)</span>
                  <span className="font-bold text-xs">{stats.intents.pro} clicks</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${stats.intents.total > 0 ? (stats.intents.pro / stats.intents.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-xs">Student Plan (₹49)</span>
                  <span className="font-bold text-xs">{stats.intents.student} clicks</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${stats.intents.total > 0 ? (stats.intents.student / stats.intents.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                Insight: Potential market interest is leaning toward the{" "}
                {stats.intents.pro >= stats.intents.student ? "Pro" : "Student"} plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: any): string {
  if (!date) return "N/A";
  try {
    const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "N/A";
  }
}

type MetricColor = "blue" | "emerald" | "primary" | "amber";

function MetricCard({
  title,
  value,
  icon,
  description,
  color,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  description: string;
  color: MetricColor;
}) {
  const colorMap: Record<MetricColor, string> = {
    blue: "bg-blue-500/10 text-blue-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-3xl p-6 shadow-sm flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-semibold text-foreground/80">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </motion.div>
  );
}
