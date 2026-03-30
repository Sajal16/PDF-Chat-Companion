/**
 * API Service — Mock backend that simulates FastAPI endpoints.
 * 
 * Replace BASE_URL with your FastAPI server URL when ready.
 * Endpoints expected:
 *   POST /chat   — { question: string, history: Message[] } → streamed text
 *   POST /upload — FormData with file → { success: boolean, filename: string }
 */

const BASE_URL = "http://localhost:8000"; // Change to your FastAPI URL

// Toggle this to false when connecting to real backend
const USE_MOCK = false;

/** Simulates streaming by yielding words with delay */
async function* mockStreamResponse(question: string): AsyncGenerator<string> {
  const responses = [
    `Based on the uploaded documents, here's what I found regarding "${question}":`,
    "\n\nThe documents indicate several key points that are relevant to your query.",
    " First, the primary concepts outlined in the uploaded materials suggest",
    " a comprehensive approach to the topic.",
    " Additionally, cross-referencing multiple sections reveals",
    " important connections between the data points.",
    "\n\nWould you like me to elaborate on any specific aspect?",
  ];
  for (const chunk of responses) {
    for (const word of chunk.split(/(?<=\s)/)) {
      await new Promise((r) => setTimeout(r, 30 + Math.random() * 40));
      yield word;
    }
  }
}

/**
 * POST /chat — streams AI response
 * In mock mode, simulates word-by-word streaming.
 */
export async function* streamChat(
  question: string,
  history: { role: string; content: string }[]
): AsyncGenerator<string> {
  if (USE_MOCK) {
    yield* mockStreamResponse(question);
    return;
  }

  // Real backend integration:
  // Map history to match the backend expectation ({ role: string, text: string })
  const mappedHistory = history.map(h => ({ role: h.role, text: h.content }));
  
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history: mappedHistory }),
  });

  if (!res.ok) throw new Error("Chat request failed");

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

/**
 * POST /upload — uploads a file
 * In mock mode, simulates a 1.5s upload delay.
 */
export async function uploadFile(
  file: File
): Promise<{ success: boolean; filename: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    return { success: true, filename: file.name };
  }

  // Real backend integration:
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  
  // Real backend returns { "message": "..." }
  // Our frontend expects { "success": boolean, "filename": string }
  const data = await res.json();
  return { success: true, filename: file.name, message: data.message };
}
