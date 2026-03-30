import { useEffect } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { UploadStatus } from "@/types/chat";

interface UploadToastProps {
  status: UploadStatus | null;
  onDismiss: () => void;
}

export function UploadToast({ status, onDismiss }: UploadToastProps) {
  useEffect(() => {
    if (status && status.type !== "uploading") {
      const t = setTimeout(onDismiss, 3000);
      return () => clearTimeout(t);
    }
  }, [status, onDismiss]);

  if (!status) return null;

  const icons = {
    uploading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    success: <CheckCircle className="h-4 w-4 text-success" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const bgColors = {
    uploading: "bg-muted border-border",
    success: "bg-muted border-success/30",
    error: "bg-muted border-destructive/30",
  };

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg ${bgColors[status.type]}`}
      >
        {icons[status.type]}
        <span className="text-sm text-foreground">{status.message}</span>
      </div>
    </div>
  );
}
