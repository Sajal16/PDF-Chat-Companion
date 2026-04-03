/**
 * API Service — Connects frontend to FastAPI backend
 */

const BASE_URL = "http://116.202.210.102:10055"; // your backend

// Set to false for real backend
const USE_MOCK = false;

/** ---------------- MOCK STREAM (optional) ---------------- */
async function* mockStreamResponse(question: string): AsyncGenerator<string> {
  const responses = [
    `Based on the uploaded documents, here's what I found regarding "${question}":`,
    "\n\nThe documents indicate several key points related to your query.",
    " This includes important insights extracted from the uploaded file.",
    "\n\nWould you like more details?",
  ];

  for (const chunk of responses) {
    for (const word of chunk.split(/(?<=\s)/)) {
      await new Promise((r) => setTimeout(r, 30));
      yield word;
    }
  }
}

/** ---------------- CHAT API ---------------- */
export async function* streamChat(
  question: string,
  history: { role: string; content: string }[],
  session_id: string
): AsyncGenerator<string> {
  if (USE_MOCK) {
    yield* mockStreamResponse(question);
    return;
  }

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id,
      question,
      history, // ✅ correct format
    }),
  });

  if (!res.ok) {
    throw new Error("Chat request failed");
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    yield decoder.decode(value, { stream: true });
  }
}

/** ---------------- FILE UPLOAD ---------------- */
export async function uploadFile(
  file: File
): Promise<{ session_id: string }> {
  if (USE_MOCK) {
    return { session_id: "mock-session-id" };
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  // ✅ backend returns { session_id }
  return await res.json();
}