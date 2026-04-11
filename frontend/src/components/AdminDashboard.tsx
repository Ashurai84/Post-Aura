import { useState, useEffect } from "react";
import { 
  RefreshCw, Download, Terminal, Users, MessageSquare, 
  Activity, CheckCircle2, XCircle, Shield, Search, Copy, X
} from "lucide-react";
import { getApiBase } from "../lib/api";

type Tab = "Overview" | "Users" | "Feedback" | "Errors";

const timeAgo = (date: any) => {
  if (!date) return "N/A";
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} mins ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem("adminSecret"));
  const [inputSecret, setInputSecret] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [health, setHealth] = useState<any>(null);
  const [usersInfo, setUsersInfo] = useState<{ totalUsers: number, users: any[] }>({ totalUsers: 0, users: [] });
  const [feedback, setFeedback] = useState<any[]>([]);
  const [errorsData, setErrorsData] = useState<{ errors: any[], totalCount: number }>({ errors: [], totalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  // ADD 5: post modal state
  const [modalPost, setModalPost] = useState<{ text: string; user: string; time: string } | null>(null);
  const [modalCopied, setModalCopied] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSecret) return;
    sessionStorage.setItem("adminSecret", inputSecret);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminSecret");
    setIsAuthenticated(false);
  };

  const authFetch = async (url: string) => {
    const res = await fetch(url, {
      headers: { "x-admin-secret": sessionStorage.getItem("adminSecret") || "" }
    });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error("Unauthorized");
    }
    return res;
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [hRes, uRes, fRes, eRes] = await Promise.all([
        authFetch(`${getApiBase()}/api/health`),
        authFetch(`${getApiBase()}/api/admin/users`),
        authFetch(`${getApiBase()}/api/admin/feedback`),
        authFetch(`${getApiBase()}/api/admin/errors`)
      ]);

      const [hData, uData, fData, eData] = await Promise.all([
        hRes.json(), uRes.json(), fRes.json(), eRes.json()
      ]);

      setHealth(hData);
      setUsersInfo({ totalUsers: uData.totalUsers || 0, users: uData.users || [] });
      setFeedback(Array.isArray(fData) ? fData : (fData.feedback || []));
      setErrorsData(eData.errors ? eData : { errors: Array.isArray(eData) ? eData : [], totalCount: eData.length || 0 });
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const hInt = setInterval(() => {
       authFetch(`${getApiBase()}/api/health`).then(r => r.json()).then(setHealth).catch(() => {});
    }, 60000);
    const eInt = setInterval(() => {
       authFetch(`${getApiBase()}/api/admin/errors`).then(r => r.json()).then(setErrorsData).catch(() => {});
    }, 120000);
    const uInt = setInterval(() => {
       authFetch(`${getApiBase()}/api/admin/users`).then(r => r.json()).then(d => setUsersInfo({ totalUsers: d.totalUsers, users: d.users })).catch(() => {});
    }, 30000);
    return () => { clearInterval(hInt); clearInterval(eInt); clearInterval(uInt); };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FDFBF7] text-[#1A1A1A] font-sans">
        <form onSubmit={handleLogin} className="p-8 border border-[#1A1A1A] rounded-xl flex flex-col gap-4 max-w-sm w-full bg-white shadow-[4px_4px_0_0_#1A1A1A]">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-xl font-bold font-serif italic">Restricted Access</h1>
          </div>
          <input 
            type="password" 
            placeholder="Enter ADMIN_SECRET"
            value={inputSecret}
            onChange={(e) => setInputSecret(e.target.value)}
            className="border-b-2 border-[#1A1A1A] p-2 bg-transparent outline-none font-mono text-sm focus:bg-black/5 transition-colors"
          />
          <button type="submit" className="bg-[#1A1A1A] text-[#FDFBF7] font-bold py-3 mt-4 rounded hover:bg-neutral-800 transition-colors">
            ENTER FACILITY
          </button>
        </form>
      </div>
    );
  }

  const postsToday = usersInfo.users.reduce((acc, u) => acc + (u.postsToday || 0), 0);
  const totalPostsEver = usersInfo.users.reduce((acc, u) => acc + (u.totalPostsEver || 0), 0);
  // ADD 1: Active This Week — lastActiveAt within last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeThisWeekCount = usersInfo.users.filter(u => new Date(u.lastActiveAt) >= sevenDaysAgo).length;

  const filteredUsers = usersInfo.users.filter(u => 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  ).sort((a,b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

  const exportCsv = () => {
    const headers = "Name,Email,Plan,Total Posts,Joined\n";
    const rows = filteredUsers.map(u => `${u.name || 'Unknown'},${u.email || 'N/A'},${u.plan},${u.totalPostsEver},${new Date(u.registeredAt).toLocaleDateString()}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postaura_users_${new Date().getTime()}.csv`;
    a.click();
  };

  const getActivityLogs = () => {
    const events: any[] = [];
    usersInfo.users.forEach(u => {
      events.push({ time: new Date(u.registeredAt), text: `${u.name || u.email || 'New user'} signed up`, type: 'user' });
      if (u.postsToday > 0 && new Date(u.lastActiveAt).toDateString() === new Date().toDateString()) {
         events.push({ time: new Date(u.lastActiveAt), text: `${u.name || 'A user'} generated a post or interacted`, type: 'action' });
      }
    });
    feedback.forEach(f => {
      events.push({ time: new Date(f.submittedAt), text: `Feedback submitted ${'⭐'.repeat(f.rating)}`, type: 'feedback' });
    });
    return events.sort((a,b) => b.time.getTime() - a.time.getTime()).slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-[#FDFBF7]">
      {/* SECTION 1: HEALTH BAR */}
      <div className="bg-[#1A1A1A] text-[#FDFBF7] px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            {health ? 'SYSTEM ONLINE' : 'OFFLINE'}
          </div>
          <div className="hidden sm:block opacity-70">
            ENGINE: {health?.engine || "Gemini 2.5 Flash"}
          </div>
          <div className="hidden md:block opacity-70">
            UPTIME: {health?.uptime ? `${Math.floor(health.uptime/3600)}h ${Math.floor((health.uptime%3600)/60)}m` : '-'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="uppercase border border-[#FDFBF7]/30 px-2 rounded-full opacity-80">{health?.environment || 'production'}</span>
          <button onClick={handleLogout} className="hover:text-red-400 underline underline-offset-2">LOGOUT</button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1A1A1A]/10 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif italic font-bold tracking-tight mb-2">PostAura Admin</h1>
            <p className="font-mono text-xs text-neutral-500 uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" /> Last updated {timeAgo(lastUpdated)}
            </p>
          </div>
          <div className="flex items-center gap-4 border-b border-[#1A1A1A]">
            {["Overview", "Users", "Feedback", "Errors"].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as Tab)}
                className={`pb-2 px-1 font-mono text-sm uppercase transition-all ${activeTab === t ? 'font-bold border-b-2 border-[#1A1A1A] text-[#1A1A1A]' : 'text-neutral-500 hover:text-[#1A1A1A]'}`}
              >
                {t}
              </button>
            ))}
            <button onClick={fetchData} className="pb-2 ml-4 text-neutral-500 hover:text-[#1A1A1A]">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {activeTab === "Overview" && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* SECTION 2: KEY METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: usersInfo.totalUsers },
                { label: "Posts Gen (Today)", value: postsToday },
                { label: "Total Posts Ever", value: totalPostsEver },
                { label: "Active This Week", value: activeThisWeekCount }
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-[#1A1A1A] p-5 shadow-[2px_2px_0_0_#1A1A1A] rounded flex flex-col justify-between h-32">
                  <span className="font-mono text-[10px] sm:text-xs uppercase text-neutral-500">{stat.label}</span>
                  <span className="font-serif italic text-4xl font-bold">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* SECTION 6: REAL-TIME ACTIVITY */}
            <div className="border border-[#1A1A1A] bg-white shadow-[4px_4px_0_0_#1A1A1A] rounded p-6">
              <h2 className="font-mono text-sm uppercase font-bold border-b border-[#1A1A1A]/10 pb-4 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Real-time Activity
              </h2>
              <div className="space-y-3">
                {getActivityLogs().map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-dashed border-neutral-200 last:border-0 hover:bg-neutral-50 transition-colors">
                    <span className="font-sans font-medium text-neutral-800">{log.text}</span>
                    <span className="font-mono text-[10px] text-neutral-400 whitespace-nowrap">{timeAgo(log.time)}</span>
                  </div>
                ))}
                {getActivityLogs().length === 0 && <p className="text-sm font-mono text-neutral-400">No recent activity detected.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Users" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#1A1A1A] font-mono text-sm focus:outline-none focus:ring-2 ring-neutral-300 shadow-[2px_2px_0_0_#1A1A1A] rounded"
                />
              </div>
              <button onClick={exportCsv} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white font-mono text-sm rounded shadow-[2px_2px_0_0_#C2410C] hover:bg-neutral-800 transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto border border-[#1A1A1A] bg-white shadow-[4px_4px_0_0_#1A1A1A] rounded">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#1A1A1A] bg-neutral-50/50 font-mono text-xs uppercase text-neutral-500">
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Plan</th>
                    <th className="p-4 font-semibold">Usage (T/A)</th>
                    {/* ADD 2: Retention column */}
                    <th className="p-4 font-semibold">Returned?</th>
                    <th className="p-4 font-semibold">Last Active</th>
                    <th className="p-4 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]/10 text-neutral-800">
                  {filteredUsers.map(u => (
                    <tr key={u.userId} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-[#1A1A1A]">{u.name || 'Anonymous'}</div>
                        <div className="text-xs text-neutral-500">{u.email || u.userId.slice(0,8)+'...'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase border rounded-full ${u.plan === 'pro' ? 'border-[#C2410C] text-[#C2410C] bg-orange-50' : 'border-neutral-300 text-neutral-500'}`}>
                          {u.plan || 'free'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs">
                        <span className="font-bold">{u.postsToday}</span> / <span className="text-neutral-400">{u.totalPostsEver}</span>
                      </td>
                      {/* ADD 2: Retention dot */}
                      <td className="p-4 text-center">
                        {(() => {
                          const returned = (u.totalPostsEver > 1) || 
                            (u.lastActiveAt && u.registeredAt && 
                             new Date(u.lastActiveAt).toDateString() !== new Date(u.registeredAt).toDateString());
                          return returned
                            ? <span title="Returned user" className="inline-block w-3 h-3 rounded-full bg-emerald-400 shadow shadow-emerald-200" />
                            : <span title="Never returned" className="inline-block w-3 h-3 rounded-full bg-red-400 shadow shadow-red-200" />;
                        })()}
                      </td>
                      <td className="p-4 text-xs font-mono text-neutral-500">{timeAgo(u.lastActiveAt)}</td>
                      <td className="p-4 text-xs font-mono text-neutral-500">{new Date(u.registeredAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-neutral-400 font-mono">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD 3: Feedback tab — improved */}
        {activeTab === "Feedback" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {feedback.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-[#1A1A1A]/20 rounded">
                <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <p className="font-mono text-sm text-neutral-400">No feedback submitted yet.</p>
              </div>
            ) : feedback.map(f => (
              <div key={f._id} className="bg-white border border-[#1A1A1A] p-5 shadow-[4px_4px_0_0_#1A1A1A] rounded flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div className="space-y-2 max-w-3xl flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="tracking-widest">{Array.from({ length: 5 }).map((_, i) => i < f.rating ? '⭐' : '☆').join('')}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold border rounded-full ${
                      f.type === 'love' ? 'border-pink-300 text-pink-600 bg-pink-50' :
                      f.type === 'bug' ? 'border-red-300 text-red-600 bg-red-50' :
                      f.type === 'feature' ? 'border-indigo-300 text-indigo-600 bg-indigo-50' :
                      f.type === 'suggestion' ? 'border-sky-300 text-sky-600 bg-sky-50' :
                      'border-neutral-300 text-neutral-600 bg-neutral-50'
                    }`}>{f.type}</span>
                    <span className="font-mono text-[10px] text-neutral-400">{timeAgo(f.submittedAt)}</span>
                  </div>
                  <p className="text-neutral-800 leading-relaxed font-sans text-sm">{f.message}</p>
                  <div className="text-xs text-neutral-400 font-mono">
                    {f.name && <span className="mr-2 text-neutral-600 font-semibold">{f.name}</span>}
                    {f.email && <span>{f.email}</span>}
                    {!f.name && !f.email && <span>User: {f.userId?.slice(0,8)}…</span>}
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <div className="text-xs text-neutral-400 uppercase px-2 py-1 bg-neutral-100 rounded inline-block border border-neutral-200 font-mono">
                    {f.page || 'unknown'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD 4: ERROR LOG tab — always visible, healthy state */}
        {activeTab === "Errors" && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-[#1A1A1A] text-emerald-400 p-6 rounded shadow-xl font-mono text-xs md:text-sm overflow-hidden flex flex-col h-[600px] border border-neutral-800">
              <div className="flex items-center gap-2 mb-4 border-b border-emerald-900 pb-4 text-emerald-500">
                <Terminal className="w-5 h-5" />
                <span>SERVER_ERROR_LOG // auto-refreshing every 2 min</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {(!errorsData?.errors || errorsData.errors.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                    <p>No errors logged. System healthy ✓</p>
                  </div>
                ) : errorsData.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-4 hover:bg-white/5 p-1 rounded transition-colors group">
                    <span className="text-neutral-500 shrink-0">[{new Date(err.timestamp).toLocaleTimeString()}]</span>
                    <span className="font-bold flex-shrink-0 w-12 text-center text-neutral-300">{err.method}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-200 truncate max-w-[200px]">{err.route}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${err.statusCode >= 500 ? 'bg-red-500/20 text-red-400' : err.statusCode >= 400 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {err.statusCode}
                        </span>
                      </div>
                      <div className="text-red-400 mt-1 whitespace-pre-wrap font-medium break-words opacity-80 group-hover:opacity-100">{err.error}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ADD 5: Full Post Modal */}
      {modalPost && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setModalPost(null)}
        >
          <div
            className="bg-[#FDFBF7] border-2 border-[#1A1A1A] shadow-[8px_8px_0_0_#1A1A1A] rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/10">
              <div>
                <p className="font-semibold text-sm">{modalPost.user}</p>
                <p className="font-mono text-[10px] text-neutral-500">{modalPost.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(modalPost.text);
                    setModalCopied(true);
                    setTimeout(() => setModalCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 text-xs font-mono border border-[#1A1A1A] px-3 py-1.5 rounded hover:bg-black/5 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {modalCopied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setModalPost(null)} className="p-1.5 hover:bg-black/5 rounded transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-6">
              <p className="font-serif text-base leading-relaxed text-[#1A1A1A] whitespace-pre-wrap">{modalPost.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
