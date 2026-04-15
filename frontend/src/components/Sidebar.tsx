import { Plus, LogOut, FileText, Sparkles, Brain, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Post } from "../types";
import { logOut } from "../firebase";

interface SidebarProps {
  posts: Post[];
  activePostId: string | null;
  onSelectPost: (id: string) => void;
  onNewPost: () => void;
  onDeletePost: (id: string) => void;
  user: any;
}

export function Sidebar({ posts, activePostId, onSelectPost, onNewPost, onDeletePost, user }: SidebarProps) {
  return (
    <div className="w-72 border-r border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.72))] dark:bg-[linear-gradient(180deg,rgba(18,18,24,0.9),rgba(18,18,24,0.78))] backdrop-blur-xl flex flex-col h-screen">
      <div className="p-4 border-b border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-lg tracking-tight">PostAura</h1>
          <Button variant="ghost" size="icon" onClick={onNewPost}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <button
          onClick={onNewPost}
          className="premium-cta w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4" /> New Post
        </button>

        <div className="rounded-xl border border-border/60 bg-card/80 p-3 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            <Brain className="h-3.5 w-3.5" /> Intelligence Layer
          </div>
          <p className="text-xs text-foreground/90">
            <span className="font-semibold">Your voice:</span> Casual • Bold
          </p>
          <p className="text-xs text-foreground/90">
            <span className="font-semibold">Your best posts:</span> Short + strong opinions
          </p>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {posts.map((post) => (
            <div key={post.id} className="grid grid-cols-[1fr_auto] items-center gap-1.5">
              <Button
                variant={activePostId === post.id ? "secondary" : "ghost"}
                className="w-full min-w-0 justify-start font-normal text-sm h-10 rounded-xl transition-all hover:scale-[1.01] hover:shadow-md"
                onClick={() => onSelectPost(post.id!)}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">{post.topic || "Untitled Post"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/25"
                onClick={(e) => {
                  e.stopPropagation();
                  if (post.id) onDeletePost(post.id);
                }}
                title="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
              No posts yet. Create one!
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/60 mt-auto flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-2 overflow-hidden">
          {user?.photoURL && (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          )}
          <div className="text-sm truncate">
            <p className="font-medium truncate">{user?.displayName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logOut} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
