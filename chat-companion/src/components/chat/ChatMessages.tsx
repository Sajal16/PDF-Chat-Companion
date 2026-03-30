import { useEffect, useRef } from "react";
import { Bot, User, FileText } from "lucide-react";
import type { Message } from "@/types/chat";

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
}

export function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md px-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Start a conversation
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload a PDF or text file first, then ask questions about its content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm pl-12">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "file") {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-chat-file text-foreground text-sm">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium">{message.fileName}</span>
          <span className="text-muted-foreground text-xs">uploaded</span>
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={`
          max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
          ${
            isUser
              ? "bg-chat-user text-foreground rounded-br-md"
              : "bg-chat-bot text-foreground rounded-bl-md"
          }
        `}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}
