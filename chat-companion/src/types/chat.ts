export interface Message {
  id: string;
  role: "user" | "bot" | "file";
  content: string;
  timestamp: number;

  // Optional file metadata
  fileName?: string;
  fileType?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  hasDocuments: boolean;

  // ✅ NEW: backend session isolation
  backendSessionId?: string;
}

export type UploadStatus =
  | { type: "uploading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };