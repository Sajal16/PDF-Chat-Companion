import { useState, useCallback, useEffect } from "react";
import type { ChatSession, Message } from "@/types/chat";

const STORAGE_KEY = "chatbot_sessions";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useChatStore() {
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [activeId, setActiveId] = useState<string | null>(
    () => loadSessions()[0]?.id ?? null
  );

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      hasDocuments: false,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveId(newSession.id);
    return newSession.id;
  }, []);

  const addMessage = useCallback(
    (sessionId: string, message: Omit<Message, "id" | "timestamp">) => {
      const msg: Message = {
        ...message,
        id: generateId(),
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const updated = {
            ...s,
            messages: [...s.messages, msg],
            updatedAt: Date.now(),
            hasDocuments: s.hasDocuments || message.role === "file",
          };
          // Auto-title from first user message
          if (
            updated.title === "New Chat" &&
            message.role === "user"
          ) {
            updated.title =
              message.content.slice(0, 40) +
              (message.content.length > 40 ? "…" : "");
          }
          return updated;
        })
      );
      return msg;
    },
    []
  );

  const updateLastBotMessage = useCallback(
    (sessionId: string, content: string) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const msgs = [...s.messages];
          let lastBot = -1;
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "bot") { lastBot = i; break; }
          }
          if (lastBot !== -1) {
            msgs[lastBot] = { ...msgs[lastBot], content };
          }
          return { ...s, messages: msgs, updatedAt: Date.now() };
        })
      );
    },
    []
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeId === sessionId) {
        setSessions((prev) => {
          setActiveId(prev[0]?.id ?? null);
          return prev;
        });
      }
    },
    [activeId]
  );

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveId(null);
  }, []);

  return {
    sessions,
    activeSession,
    activeId,
    setActiveId,
    createSession,
    addMessage,
    updateLastBotMessage,
    deleteSession,
    clearAllSessions,
  };
}
