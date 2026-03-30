import { useState, useCallback } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { UploadToast } from "@/components/chat/UploadToast";
import { useChatStore } from "@/hooks/useChatStore";
import { streamChat, uploadFile } from "@/services/api";
import type { UploadStatus } from "@/types/chat";


interface ChatPageProps {
  userName: string;
  userImage: string;   // ✅ NEW
  onLogout: () => void;
}

export default function Chat({ userName, userImage, onLogout }: ChatPageProps) {
  const store = useChatStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const ensureSession = useCallback(() => {
    if (!store.activeId) {
      return store.createSession();
    }
    return store.activeId;
  }, [store]);

  const handleSend = useCallback(
    async (text: string) => {
      const sessionId = ensureSession();
      if (!sessionId || isStreaming) return;

      store.addMessage(sessionId, { role: "user", content: text });
      store.addMessage(sessionId, { role: "bot", content: "" });

      setIsStreaming(true);

      try {
        const session = store.sessions.find((s) => s.id === sessionId);
        const history = (session?.messages ?? [])
          .filter((m) => m.role !== "file")
          .map((m) => ({ role: m.role, content: m.content }));

        let accumulated = "";
        for await (const chunk of streamChat(text, history)) {
          accumulated += chunk;
          store.updateLastBotMessage(sessionId, accumulated);
        }
      } catch {
        store.updateLastBotMessage(sessionId, "⚠️ Error getting response. Please try again.");
      } finally {
        setIsStreaming(false);
      }
    },
    [ensureSession, isStreaming, store]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      const sessionId = ensureSession();
      if (!sessionId) return;

      setUploadStatus({ type: "uploading", message: `Uploading ${file.name}…` });

      try {
        const result = await uploadFile(file);
        if (result.success) {
          setUploadStatus({ type: "success", message: `${file.name} uploaded successfully!` });
          store.addMessage(sessionId, {
            role: "file",
            content: `Uploaded: ${file.name}`,
            fileName: file.name,
            fileType: file.type,
          });
        } else {
          setUploadStatus({ type: "error", message: "Upload failed. Try again." });
        }
      } catch {
        setUploadStatus({ type: "error", message: "Upload failed. Check your connection." });
      }
    },
    [ensureSession, store]
  );

  return (
    <div className="h-screen flex bg-background">
      <ChatSidebar
        sessions={store.sessions}
        activeId={store.activeId}
        onSelect={store.setActiveId}
        onCreate={store.createSession}
        onDelete={store.deleteSession}
        onClearAll={store.clearAllSessions}
        onLogout={onLogout}
        userName={userName}
        userImage={userImage}   // ✅ NEW
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center px-4 border-b border-border shrink-0">
          <h1 className="text-sm font-medium text-foreground truncate">
            {store.activeSession?.title ?? "ChatPDF"}
          </h1>
        </header>

        <ChatMessages
          messages={store.activeSession?.messages ?? []}
          isStreaming={isStreaming}
        />

        <ChatInput
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          disabled={isStreaming}
          hasDocuments={store.activeSession?.hasDocuments ?? false}
        />
      </div>

      <UploadToast
        status={uploadStatus}
        onDismiss={() => setUploadStatus(null)}
      />
    </div>
  );
}