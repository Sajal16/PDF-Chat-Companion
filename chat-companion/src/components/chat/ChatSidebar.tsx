import { Plus, MessageSquare, Trash2, LogOut, Menu } from "lucide-react";
import type { ChatSession } from "@/types/chat";
import { Button } from "@/components/ui/button";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onLogout: () => void;
  userName: string;
  userImage: string;   
  open: boolean;
  onToggle: () => void;
}

export function ChatSidebar({
  sessions,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onClearAll,
  onLogout,
  userName,
  userImage,
  open,
  onToggle,
}: ChatSidebarProps) {
  return (
    <div className={`shrink-0 h-full flex transition-all duration-200 ${open ? "w-72" : "w-12"}`}>
      
      {/* Collapsed */}
      {!open && (
        <div className="w-12 h-full bg-sidebar border-r flex flex-col items-center py-2 justify-between">
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Profile icon */}
          <img
            src={userImage || "https://ui-avatars.com/api/?name=" + userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      )}

      {/* Expanded */}
      {open && (
        <aside className="w-72 h-full bg-sidebar border-r flex flex-col">

          {/* Header */}
          <div className="h-12 px-3 border-b flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-semibold flex-1">Chat History</h2>
            <Button variant="ghost" size="icon" onClick={onCreate}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Sessions */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                  s.id === activeId ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="flex-1 truncate">{s.title}</span>
                <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer with Profile */}
          <div className="p-3 border-t flex items-center gap-2">
            <img
              src={userImage || "https://ui-avatars.com/api/?name=" + userName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm flex-1 truncate">{userName}</span>

            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

        </aside>
      )}
    </div>
  );
}