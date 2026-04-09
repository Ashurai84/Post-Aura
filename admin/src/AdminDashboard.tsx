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

/** Backend URL for `/api/*`. When unset: same-origin on :3000 (tsx + Vite middleware); if the UI runs on another port (e.g. Vite :5173), use :3000 so we do not hit the SPA HTML. */
function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");

  if (typeof window === "undefined") return "";

  const { hostname, port, protocol } = window.location;

  if (port === "3000") return "";
  if (!port || port === "80" || port === "443") return "";

  if (import.meta.env.DEV && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return `${protocol}//${hostname}:3000`;
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

interface UserPost {
  id: string;
  topic: string;
  content: string;
  createdAt: any;
  performance: string | null;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  createdAt: any;
  totalPosts: number;
  recentPosts: UserPost[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/", { replace: true });
          return;
        }

        const token = await user.getIdToken();
        
        // Fetch stats
        const statsUrl = `${getApiBase()}/api/admin/stats`;
        const statsResponse = await fetch(statsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const statsRaw = await statsResponse.text();

        if (statsRaw.trimStart().toLowerCase().startsWith("<!")) {
          throw new Error(
            "Got a web page instead of API data. Open http://localhost:3000 (or set VITE_API_URL=http://localhost:3000 in frontend/.env if you use Vite on another port)."
          );
        }

        let statsPayload: unknown;
        try {
          statsPayload = JSON.parse(statsRaw);
        } catch {
          throw new Error("Invalid response from server.");
        }

        if (!statsResponse.ok) {
          const err = statsPayload as { error?: string };
          if (statsResponse.status === 403) {
            throw new Error(err.error || "Access denied. You are not an admin.");
          }
          throw new Error(err.error || "Failed to fetch admin stats.");
        }

        setStats(statsPayload as Stats);

        // Fetch user data
        const userUrl = `${getApiBase()}/api/admin/user-data`;
        const userResponse = await fetch(userUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userRaw = await userResponse.text();
        let userPayload: any;
        try {
          userPayload = JSON.parse(userRaw);
        } catch {
          console.error("Failed to parse user data");
          return;
        }

        if (userResponse.ok && userPayload.users) {
          setUserData(userPayload.users);
        }
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
        <div className="lg:col-span-2 bg-card border rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold">Content Engine Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-muted/40 border border-border/50 flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.postGenerations}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Posts Generated</p>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-muted/40 border border-border/50 flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.imageGenerations}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Images Generated</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold">Pricing Intent (Click-baits)</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Pro Plan (₹99)</span>
                <span className="font-bold">{stats.intents.pro} clicks</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
                <span className="font-medium">Student Plan (₹49)</span>
                <span className="font-bold">{stats.intents.student} clicks</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${stats.intents.total > 0 ? (stats.intents.student / stats.intents.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Insights:</strong> Most users are clicking on the{" "}
              {stats.intents.pro >= stats.intents.student ? "Pro" : "Student"} plan first. This represents your
              potential market interest.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-card border rounded-3xl p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-bold">Users & Content</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Posts</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Recent Content</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {userData.length > 0 ? (
                userData.map((u) => (
                  <tr key={u.uid} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4 font-medium">{u.displayName}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground truncate max-w-xs">{u.email}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.isPro 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted/50 text-muted-foreground"
                      }`}>
                        {u.isPro ? "Pro" : "Free"}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold">{u.totalPosts}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 max-w-sm">
                        {u.recentPosts.length > 0 ? (
                          u.recentPosts.slice(0, 2).map((post) => (
                            <div key={post.id} className="text-xs bg-muted/30 rounded px-2 py-1 line-clamp-1">
                              <span className="font-medium">{post.topic}:</span> {post.content}
                              {post.performance && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${post.performance === 'hot' ? 'bg-emerald-500/20 text-emerald-600' : post.performance === 'flopped' ? 'bg-rose-500/20 text-rose-600' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                  {post.performance === 'hot' ? '🔥' : post.performance === 'flopped' ? '👎' : '👍'}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic">No posts yet</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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
