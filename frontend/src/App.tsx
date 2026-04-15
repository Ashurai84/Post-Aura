import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Sidebar } from "./components/Sidebar";
import { Editor } from "./components/Editor";
import { ImageGenerator } from "./components/ImageGenerator";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import PaymentSuccess from "./PaymentSuccess";
import { Post } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Loader2 } from "lucide-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/** Extract ms from Firestore Timestamp | Date | missing */
function timestampToMs(ts: any): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

function postUpdatedMs(p: Post): number {
  return timestampToMs(p.updatedAt);
}

function postCreatedOrUpdatedMs(p: Post): number {
  const createdMs = timestampToMs(p.createdAt);
  if (createdMs > 0) return createdMs;
  return postUpdatedMs(p);
}

function getStartOfWeek(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  return monday.getTime();
}

const WEEKLY_GOAL = 3;

function Dashboard({ user, posts, activePostId, setActivePostId, onDeletePost }: { 
  user: User, 
  posts: Post[], 
  activePostId: string | null, 
  setActivePostId: (id: string | null) => void,
  onDeletePost: (id: string) => void,
}) {
  const activePost = posts.find(p => p.id === activePostId) || null;
  const weekStart = getStartOfWeek();
  const weeklyPostCount = posts.filter(p => postCreatedOrUpdatedMs(p) >= weekStart).length;
  const remainingThisWeek = Math.max(WEEKLY_GOAL - weeklyPostCount, 0);

  // Posts copied 24h+ ago without a performance review
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const postsToReview = posts.filter(p => {
    if (!p.copiedAt || p.performance) return false;
    const copiedMs = timestampToMs(p.copiedAt);
    return copiedMs > 0 && (now - copiedMs) >= TWENTY_FOUR_HOURS;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.08),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.08),_transparent_25%),hsl(var(--background))]">
      <Sidebar 
        posts={posts} 
        activePostId={activePostId} 
        onSelectPost={setActivePostId} 
        onNewPost={() => setActivePostId(null)}
        onDeletePost={onDeletePost}
        user={user}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Tabs defaultValue="editor" className="flex-1 flex flex-col h-full">
          <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between bg-background/75 backdrop-blur-xl">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Daily Momentum</p>
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Don&apos;t fall behind. What did you do today?</h1>
              <p className="text-sm text-muted-foreground">
                {remainingThisWeek === 0
                  ? "You crushed this week. Keep posting while momentum is hot."
                  : `${remainingThisWeek} more post${remainingThisWeek > 1 ? "s" : ""} to hit your weekly target.`}
              </p>
            </div>

            <TabsList className="shadow-sm border border-border/60 bg-card/80">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="editor" className="flex-1 m-0 overflow-hidden outline-none">
            <Editor 
              post={activePost} 
              userId={user.uid} 
              onDeletePost={onDeletePost}
              weeklyPostCount={weeklyPostCount}
              weeklyGoal={WEEKLY_GOAL}
              postsToReview={postsToReview}
              onPostUpdated={(updatedPost) => {
                if (!activePostId && updatedPost.id) {
                  setActivePostId(updatedPost.id);
                }
              }}
              onStartNewPost={() => setActivePostId(null)}
            />
          </TabsContent>
          
          <TabsContent value="images" className="flex-1 m-0 overflow-y-auto outline-none">
            <ImageGenerator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Post | null>(null);
  const isAuthenticated = !!user || !!auth.currentUser;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      return;
    }

    // Single-field equality only — avoids composite index (userId + updatedAt).
    const q = query(collection(db, "posts"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      fetchedPosts.sort((a, b) => postUpdatedMs(b) - postUpdatedMs(a));
      setPosts(fetchedPosts);
    }, (error) => {
      console.error("Error fetching posts:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!recentlyDeleted) return;
    const timer = window.setTimeout(() => setRecentlyDeleted(null), 5000);
    return () => window.clearTimeout(timer);
  }, [recentlyDeleted]);

  const handleDeletePost = async (postId: string) => {
    const confirmed = window.confirm("Delete this post permanently?");
    if (!confirmed) return;
    try {
      const postToDelete = posts.find((p) => p.id === postId) || null;
      await deleteDoc(doc(db, "posts", postId));
      if (activePostId === postId) {
        setActivePostId(null);
      }
      if (postToDelete) {
        setRecentlyDeleted(postToDelete);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleUndoDelete = async () => {
    if (!recentlyDeleted?.id) return;
    const { id, ...data } = recentlyDeleted;
    try {
      await setDoc(doc(db, "posts", id), data);
      setActivePostId(id);
      setRecentlyDeleted(null);
    } catch (error) {
      console.error("Error restoring post:", error);
      alert("Could not restore deleted post.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/dashboard" element={isAuthenticated ? (
          <Dashboard 
            user={user} 
            posts={posts} 
            activePostId={activePostId} 
            setActivePostId={setActivePostId}
            onDeletePost={handleDeletePost}
          />
        ) : <Navigate to="/" replace />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
      </Routes>

      {recentlyDeleted && (
        <div className="fixed bottom-5 right-5 z-100 rounded-xl border border-border/70 bg-background/95 backdrop-blur-md shadow-2xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="text-sm">
            <p className="font-medium">Post deleted</p>
            <p className="text-xs text-muted-foreground truncate max-w-56">{recentlyDeleted.topic || "Untitled Post"}</p>
          </div>
          <button
            onClick={handleUndoDelete}
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
          >
            Undo
          </button>
        </div>
      )}
    </BrowserRouter>
  );
}
