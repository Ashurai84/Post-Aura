import { Plus, LogOut, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Post } from "../types";
import { logOut } from "../firebase";

interface SidebarProps {
  posts: Post[];
  activePostId: string | null;
  onSelectPost: (id: string) => void;
  onNewPost: () => void;
  user: any;
}

export function Sidebar({ posts, activePostId, onSelectPost, onNewPost, user }: SidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-screen">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="font-semibold text-lg tracking-tight">PostAura</h1>
        <Button variant="ghost" size="icon" onClick={onNewPost}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {posts.map((post) => (
            <Button
              key={post.id}
              variant={activePostId === post.id ? "secondary" : "ghost"}
              className="w-full justify-start font-normal text-sm"
              onClick={() => onSelectPost(post.id!)}
            >
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{post.topic || "Untitled Post"}</span>
            </Button>
          ))}
          {posts.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No posts yet. Create one!
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t mt-auto flex items-center justify-between">
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
