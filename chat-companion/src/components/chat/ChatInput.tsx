import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Paperclip, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (text: string) => void;
  onFileSelect: (file: File) => void;
  disabled: boolean;
  hasDocuments: boolean;
}

const ACCEPTED_TYPES = ".pdf,.txt,.text";

export function ChatInput({ onSend, onFileSelect, disabled, hasDocuments }: ChatInputProps) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = "";
    }
  };

  return (
    <div className="border-t border-border p-4">
      {/* Warning if no document uploaded */}
      {!hasDocuments && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-warning/10 text-warning text-xs">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Upload a document before asking questions.</span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File upload */}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFile}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary"
          title="Upload PDF or TXT"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Text input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            hasDocuments
              ? "Ask a question about your documents…"
              : "Upload a document first…"
          }
          disabled={disabled || !hasDocuments}
          rows={1}
          className="
            flex-1 resize-none bg-muted rounded-xl px-4 py-2.5
            text-sm text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring
            disabled:opacity-50 disabled:cursor-not-allowed
            max-h-32
          "
          style={{ minHeight: "2.5rem" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 128) + "px";
          }}
        />

        {/* Send */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || !text.trim() || !hasDocuments}
          className="h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
