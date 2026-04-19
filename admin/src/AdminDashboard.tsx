import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Users, Zap, TrendingUp, MousePointer2, Sparkles,
  Image as ImageIcon, ArrowLeft, Loader2, AlertCircle,
  Trash2, MessageSquare, Terminal, Copy, X, CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (typeof window === 'undefined') return '';
  const { hostname, port, protocol } = window.location;
  if (port === '3000') return '';
  if (!port || port === '80' || port === '443') return '';
  if (import.meta.env.DEV && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return `${protocol}//${hostname}:3000`;
  }
  return '';
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  postGenerations: number;
  imageGenerations: number;
  intents: { pro: number; student: number; total: number };
  conversionRate: number;
}

interface UserPost {
  id: string;
  topic: string;
  content: string;
  createdAt: { seconds: number } | string | null;
  performance: string | null;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  createdAt: { seconds: number } | string | null;
  totalPosts: number;
  recentPosts: UserPost[];
}

interface FeedbackItem {
  _id?: string;
  rating: number;
  type: string;
  submittedAt?: string;
  message: string;
  name?: string;
  email?: string;
  page?: string;
}

interface PostFeedback {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  postContent: string;
  topic: string;
  audience: string;
  tone: string;
  rating: "liked" | "disliked";
  timestamp: string | { seconds: number };
}

interface ErrorItem {
  _id?: string;
  message: string;
  timestamp?: string;
  stack?: string;
  userId?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  error?: string;
}

interface ImageGeneration {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string | { seconds: number };
}

interface PaymentClick {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  timestamp: string | { seconds: number };
}

interface SurveyOption {
  id: string;
  text: string;
  count: number;
}

interface Survey {
  _id: string;
  title: string;
  question: string;
  options: SurveyOption[];
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'feedback' | 'errors' | 'surveys' | 'images' | 'payment-clicks'>('users');
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [postFeedback, setPostFeedback] = useState<PostFeedback[]>([]);
  const [errorsData, setErrorsData] = useState<ErrorItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);  
  const [images, setImages] = useState<ImageGeneration[]>([]);  
  const [paymentClicks, setPaymentClicks] = useState<PaymentClick[]>([]);
  const [modalPost, setModalPost] = useState<{ text: string; user: string; topic: string; time: string } | null>(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchData = async (isInitial = false) => {
    try {
      if (!isInitial) setIsRefreshing(true);
      const user = auth.currentUser;
      if (!user) { navigate('/', { replace: true }); return; }
      const token = await user.getIdToken();

      // Fetch stats
      const statsResponse = await fetch(`${getApiBase()}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Handle rate limiting
      if (statsResponse.status === 429) {
        setError('Rate limited by backend. Retrying less frequently...');
        setLastRefresh(new Date());
        if (isInitial) setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const statsRaw = await statsResponse.text();
      if (statsRaw.trimStart().toLowerCase().startsWith('<!')) {
        throw new Error('Got HTML instead of API data. Set VITE_API_URL=http://localhost:3000');
      }
      let statsPayload: unknown;
      try { statsPayload = JSON.parse(statsRaw); } catch { throw new Error('Invalid response from server.'); }
      if (!statsResponse.ok) {
        const err = statsPayload as { error?: string };
        throw new Error(statsResponse.status === 403 ? (err.error ?? 'Access denied.') : (err.error ?? 'Failed to fetch admin stats.'));
      }
      setStats(statsPayload as Stats);

      // Fetch user data
      const userResponse = await fetch(`${getApiBase()}/api/admin/user-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userRaw = await userResponse.text();
      let userPayload: { users?: UserData[] };
      try { userPayload = JSON.parse(userRaw); } catch { console.error('[PostAura] Failed to parse user data'); return; }
      if (userResponse.ok && userPayload.users) setUserData(userPayload.users);

      // Fetch feedback
      try {
        const fRes = await fetch(`${getApiBase()}/api/admin/feedback`, { headers: { Authorization: `Bearer ${token}` } });
        if (fRes.ok) {
          const fData: FeedbackItem[] | { feedback: FeedbackItem[] } = await fRes.json();
          setFeedback(Array.isArray(fData) ? fData : (fData.feedback ?? []));
        }
      } catch (e) { console.error('[PostAura] Failed to fetch feedback', e); }

      // Fetch post feedback
      try {
        const pfRes = await fetch(`${getApiBase()}/api/admin/post-feedback`, { headers: { Authorization: `Bearer ${token}` } });
        if (pfRes.ok) {
          const pfData: { feedback?: PostFeedback[] } = await pfRes.json();
          setPostFeedback(pfData.feedback ?? []);
        }
      } catch (e) { console.error('[PostAura] Failed to fetch post feedback', e); }

      // Fetch errors
      try {
        const eRes = await fetch(`${getApiBase()}/api/admin/errors`, { headers: { Authorization: `Bearer ${token}` } });
        if (eRes.ok) {
          const eData: { errors?: ErrorItem[] } | ErrorItem[] = await eRes.json();
          setErrorsData(Array.isArray(eData) ? eData : (eData.errors ?? []));
        }
      } catch (e) { console.error('[PostAura] Failed to fetch errors', e); }

      // Fetch surveys
      try {
        const sRes = await fetch(`${getApiBase()}/api/admin/surveys`, { headers: { Authorization: `Bearer ${token}` } });
        if (sRes.ok) {
          const sData: { surveys?: Survey[] } = await sRes.json();
          setSurveys(sData.surveys ?? []);
        }
      } catch (e) { console.error('[PostAura] Failed to fetch surveys', e); }

      // Fetch images
      try {
        const iRes = await fetch(`${getApiBase()}/api/admin/images`, { headers: { Authorization: `Bearer ${token}` } });
        if (iRes.ok) {
          const iData: { images: ImageGeneration[] } = await iRes.json();
          setImages(iData.images ?? []);
        }
      } catch (e) { console.error('[PostAura] Failed to fetch images', e); }

      // Fetch payment clicks
      try {
        const pcRes = await fetch(`${getApiBase()}/api/admin/payment-clicks`, { headers: { Authorization: `Bearer ${token}` } });
        if (pcRes.ok) {
          const pcData: { clicks: PaymentClick[] } = await pcRes.json();
          setPaymentClicks(pcData.clicks ?? []);
        }
      } catch (e) { console.error('[PostAura] Failed to fetch payment clicks', e); }

      setLastRefresh(new Date());
      if (isInitial) setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      if (isInitial) setLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ✅ OPTIMIZED: Fetch data on mount only, manual refresh button
  useEffect(() => {
    fetchData(true); // Initial fetch only - don't auto-refresh!
    // Removed: polling interval (was causing 32 requests/min)
    // Users can now click "Refresh" button manually for updates
  }, [navigate]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Remove this user and all their data? This cannot be undone.')) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${getApiBase()}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUserData(prev => prev.filter(u => u.uid !== userId));
      setStats(prev => prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : null);
    } catch (err: unknown) {
      alert('Error deleting user: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

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
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const postTime = (createdAt: UserPost['createdAt']) => {
    if (!createdAt) return 'Unknown';
    const ms = typeof createdAt === 'object' && 'seconds' in createdAt
      ? createdAt.seconds * 1000
      : Number(createdAt);
    return new Date(ms).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 space-y-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mb-2 uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" /> Back to App
          </button>
          <h1 className="text-3xl font-bold tracking-tight">PostAura Command Center</h1>
          <p className="text-muted-foreground">Real-time growth and intent analytics — Click refresh for updates</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-background border rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Updating...' : 'Live'}
            </span>
            {lastRefresh && (
              <span className="text-xs text-muted-foreground ml-2">
                Last: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Button
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="rounded-xl"
          >
            <Loader2 className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} description="Registered on PostAura" color="blue" />
        <MetricCard title="Active This Week" value={stats.activeUsers} icon={<Zap className="h-5 w-5" />} description="Users with 1+ generation" color="emerald" />
        <MetricCard title="Pro Users" value={stats.proUsers} icon={<TrendingUp className="h-5 w-5" />} description={`${stats.conversionRate.toFixed(1)}% Conversion Rate`} color="primary" />
        <MetricCard title="Price Clicks" value={stats.intents.total} icon={<MousePointer2 className="h-5 w-5" />} description="Engagement with pricing" color="amber" />
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
                <span className="font-medium">Pro Plan (Rs.99)</span>
                <span className="font-bold">{stats.intents.pro} clicks</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${stats.intents.total > 0 ? (stats.intents.pro / stats.intents.total) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Student Plan (Rs.49)</span>
                <span className="font-bold">{stats.intents.student} clicks</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.intents.total > 0 ? (stats.intents.student / stats.intents.total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Insights:</strong> Most users are clicking on the{' '}
              {stats.intents.pro >= stats.intents.student ? 'Pro' : 'Student'} plan first.
              This represents your potential market interest.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-card border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold">Users &amp; Content</h2>
          <div className="flex gap-1 border rounded-xl p-1 bg-muted/30">
            {(['users', 'feedback', 'errors', 'images', 'payment-clicks', 'surveys'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'users' ? 'Users' : tab === 'feedback' ? 'Feedback' : tab === 'errors' ? 'Error Logs' : tab === 'images' ? 'Images' : tab === 'payment-clicks' ? 'Payment Clicks' : 'Surveys'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Posts</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Returned?</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Recent Content</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {userData.length > 0 ? (
                  userData.map(u => (
                    <tr key={u.uid} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-medium">{u.displayName}</td>
                      <td className="px-4 py-4 text-xs text-muted-foreground truncate max-w-xs">{u.email}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isPro ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                          {u.isPro ? 'Pro' : 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold">{u.totalPosts}</td>
                      <td className="px-4 py-4">
                        {u.totalPosts > 1
                          ? <span title="Returned" className="inline-block w-3 h-3 rounded-full bg-emerald-400 shadow shadow-emerald-200" />
                          : <span title="Never returned" className="inline-block w-3 h-3 rounded-full bg-rose-400 shadow shadow-rose-200" />
                        }
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 max-w-sm">
                          {u.recentPosts.length > 0 ? (
                            u.recentPosts.slice(0, 2).map(post => (
                              <div
                                key={post.id}
                                className="text-xs bg-muted/30 rounded px-2 py-1 line-clamp-1 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                                title="Click to read full post"
                                onClick={() => setModalPost({ text: post.content, user: u.displayName, topic: post.topic, time: postTime(post.createdAt) })}
                              >
                                <span className="font-medium">{post.topic}:</span> {post.content}
                                {post.performance && (
                                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${post.performance === 'hot' ? 'bg-emerald-500/20 text-emerald-600' : post.performance === 'flopped' ? 'bg-rose-500/20 text-rose-600' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                    {post.performance === 'hot' ? 'Hot' : post.performance === 'flopped' ? 'Flopped' : 'OK'}
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground italic">No posts yet</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10" onClick={() => handleDeleteUser(u.uid)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-3">
            {feedback.length === 0 && postFeedback.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <MessageSquare className="w-8 h-8" />
                <p className="font-mono text-sm">No feedback submitted yet.</p>
              </div>
            ) : (
              <>
                {/* Post Quality Feedback */}
                {postFeedback.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Post Quality Feedback ({postFeedback.length})</h4>
                    {postFeedback.map((pf, i) => (
                      <div key={pf._id ?? i} className="flex flex-col sm:flex-row gap-4 justify-between items-start border rounded-2xl p-4 hover:bg-muted/20 transition-colors">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-semibold text-primary">{pf.userName}</span>
                            <span className="text-xs text-muted-foreground">{pf.userEmail}</span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${pf.rating === 'liked' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                              {pf.rating === 'liked' ? '👍 Liked' : '👎 Disliked'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">"{pf.postContent.substring(0, 100)}..."</p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>Topic: <span className="font-mono">{pf.topic}</span></span>
                            <span>•</span>
                            <span>Tone: <span className="font-mono">{pf.tone}</span></span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(typeof pf.timestamp === 'object' && 'seconds' in pf.timestamp ? pf.timestamp.seconds * 1000 : pf.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Separator */}
                {feedback.length > 0 && postFeedback.length > 0 && <div className="border-t my-4"></div>}

                {/* Bug Reports & Suggestions */}
                {feedback.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bug Reports & Suggestions ({feedback.length})</h4>
                    {feedback.map((f, i) => (
                      <div key={f._id ?? i} className="flex flex-col sm:flex-row gap-4 justify-between items-start border rounded-2xl p-4 hover:bg-muted/20 transition-colors">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{Array.from({ length: 5 }).map((_, j) => j < f.rating ? 'S' : 'o').join('')}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${f.type === 'love' ? 'border-pink-300 text-pink-600 bg-pink-50' : f.type === 'bug' ? 'border-red-300 text-red-600 bg-red-50' : f.type === 'feature' ? 'border-indigo-300 text-indigo-600 bg-indigo-50' : f.type === 'suggestion' ? 'border-sky-300 text-sky-600 bg-sky-50' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                              {f.type}
                            </span>
                            <span className="text-xs text-muted-foreground">{f.submittedAt ? new Date(f.submittedAt).toLocaleString() : ''}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{f.message}</p>
                          {(f.name ?? f.email) && (
                            <p className="text-xs text-muted-foreground font-mono">{f.name}{f.email ? ` - ${f.email}` : ''}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/40 rounded-lg font-mono shrink-0">{f.page ?? 'unknown'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="bg-[#111] text-emerald-400 rounded-2xl p-5 font-mono text-xs h-[500px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-900 text-emerald-500">
              <Terminal className="w-4 h-4" />
              <span>SERVER_ERROR_LOG // last 50 entries</span>
            </div>
            {errorsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[80%] gap-2 text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
                <p>No errors logged. System healthy.</p>
              </div>
            ) : errorsData.map((err, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5 hover:bg-white/5 px-1 rounded group">
                <span className="text-neutral-500 shrink-0">[{err.timestamp ? new Date(err.timestamp).toLocaleTimeString() : '--'}]</span>
                <span className="font-bold text-neutral-300 w-10 shrink-0">{err.method}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-200 truncate">{err.route}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${(err.statusCode || 500) >= 500 ? 'bg-red-500/20 text-red-400' : (err.statusCode || 500) >= 400 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {err.statusCode || 500}
                    </span>
                  </div>
                  <div className="text-red-400 mt-0.5 opacity-80 group-hover:opacity-100 break-words">{err.error}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'surveys' && (
          <div className="space-y-4">
            {surveys.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8" />
                <p>No surveys created yet.</p>
              </div>
            ) : surveys.map((survey) => (
              <div key={survey._id} className="border rounded-2xl p-5 space-y-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{survey.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{survey.question}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(survey.createdAt).toLocaleDateString()} | Status: {survey.isActive ? '🟢 Active' : '⭕ Inactive'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {survey.options.map((option) => {
                    const totalResponses = survey.options.reduce((sum, opt) => sum + opt.count, 0);
                    const percentage = totalResponses > 0 ? (option.count / totalResponses) * 100 : 0;
                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{option.text}</span>
                          <span className="text-xs text-muted-foreground font-semibold">{option.count} responses ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-3">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <ImageIcon className="w-8 h-8" />
                <p className="font-mono text-sm">No images generated yet.</p>
              </div>
            ) : images.map((img, i) => (
              <div key={img._id ?? i} className="flex flex-col sm:flex-row gap-4 justify-between items-start border rounded-2xl p-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-primary">{img.userName}</span>
                    <span className="text-xs text-muted-foreground">{img.userEmail}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generated: {new Date(typeof img.timestamp === 'object' && 'seconds' in img.timestamp ? img.timestamp.seconds * 1000 : img.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'payment-clicks' && (
          <div className="space-y-3">
            {paymentClicks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <MousePointer2 className="w-8 h-8" />
                <p className="font-mono text-sm">No payment clicks yet.</p>
              </div>
            ) : paymentClicks.map((click, i) => (
              <div key={click._id ?? i} className="flex flex-col sm:flex-row gap-4 justify-between items-start border rounded-2xl p-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-primary">{click.userName}</span>
                    <span className="text-xs text-muted-foreground">{click.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${click.plan === 'pro' ? 'bg-primary/20 text-primary' : 'bg-emerald-500/20 text-emerald-600'}`}>
                      {click.plan === 'pro' ? 'Pro Plan (Rs.99)' : click.plan === 'student' ? 'Student Plan (Rs.49)' : click.plan}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Clicked: {new Date(typeof click.timestamp === 'object' && 'seconds' in click.timestamp ? click.timestamp.seconds * 1000 : click.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModalPost(null)}>
          <div className="bg-card border rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <p className="font-semibold">{modalPost.user}</p>
                <p className="text-xs text-muted-foreground font-mono">{modalPost.topic} - {modalPost.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5" onClick={() => { navigator.clipboard.writeText(modalPost.text); setModalCopied(true); setTimeout(() => setModalCopied(false), 2000); }}>
                  <Copy className="w-3 h-3" />{modalCopied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setModalPost(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto p-6">
              <p className="font-serif text-base leading-relaxed whitespace-pre-wrap">{modalPost.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type MetricColor = 'blue' | 'emerald' | 'primary' | 'amber';

function MetricCard({ title, value, icon, description, color }: {
  title: string;
  value: number;
  icon: ReactNode;
  description: string;
  color: MetricColor;
}) {
  const colorMap: Record<MetricColor, string> = {
    blue: 'bg-blue-500/10 text-blue-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-500/10 text-amber-600',
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
