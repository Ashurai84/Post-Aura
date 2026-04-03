import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Sidebar } from "./components/Sidebar";
import { Editor } from "./components/Editor";
import { ImageGenerator } from "./components/ImageGenerator";
import { LandingPage } from "./components/LandingPage";
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

function getStartOfWeek(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  return monday.getTime();
}

const WEEKLY_GOAL = 3;

function Dashboard({ user, posts, activePostId, setActivePostId }: { 
  user: User, 
  posts: Post[], 
  activePostId: string | null, 
  setActivePostId: (id: string | null) => void 
}) {
  const activePost = posts.find(p => p.id === activePostId) || null;
  const weekStart = getStartOfWeek();
  const weeklyPostCount = posts.filter(p => timestampToMs(p.createdAt) >= weekStart).length;

  // Posts copied 24h+ ago without a performance review
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const postsToReview = posts.filter(p => {
    if (!p.copiedAt || p.performance) return false;
    const copiedMs = timestampToMs(p.copiedAt);
    return copiedMs > 0 && (now - copiedMs) >= TWENTY_FOUR_HOURS;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar 
        posts={posts} 
        activePostId={activePostId} 
        onSelectPost={setActivePostId} 
        onNewPost={() => setActivePostId(null)}
        user={user}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Tabs defaultValue="editor" className="flex-1 flex flex-col h-full">
          <div className="border-b px-6 py-3 flex items-center justify-between bg-muted/10">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="editor" className="flex-1 m-0 overflow-hidden outline-none">
            <Editor 
              post={activePost} 
              userId={user.uid} 
              weeklyPostCount={weeklyPostCount}
              weeklyGoal={WEEKLY_GOAL}
              postsToReview={postsToReview}
              onPostUpdated={(updatedPost) => {
                if (!activePostId && updatedPost.id) {
                  setActivePostId(updatedPost.id);
                }
              }} 
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
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/dashboard" element={user ? (
          <Dashboard 
            user={user} 
            posts={posts} 
            activePostId={activePostId} 
            setActivePostId={setActivePostId} 
          />
        ) : <Navigate to="/" />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}
