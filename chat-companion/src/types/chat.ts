export interface Message {
  id: string;
  role: "user" | "bot" | "file";
  content: string;
  fileName?: string;
  fileType?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  hasDocuments: boolean;
}

export interface UploadStatus {
  type: "uploading" | "success" | "error";
  message: string;
}
