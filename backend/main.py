import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# -------------------- LOAD ENV --------------------
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

# -------------------- LLM --------------------
from llama_index.llms.google_genai import GoogleGenAI

llm = GoogleGenAI(
    model="gemini-2.5-flash",
    api_key=api_key,
    temperature=0.2
)

# -------------------- EMBEDDINGS --------------------
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

embed_model = HuggingFaceEmbedding(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# -------------------- SETTINGS --------------------
from llama_index.core import Settings
Settings.llm = llm
Settings.embed_model = embed_model

# -------------------- LLAMA INDEX --------------------
from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex
)
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.vector_stores.faiss import FaissVectorStore
from llama_index.core.llms import ChatMessage

import faiss

# -------------------- FASTAPI --------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- SESSION STORE --------------------
# Stores per-session data
sessions = {}

# -------------------- REQUEST MODELS --------------------
class UploadResponse(BaseModel):
    session_id: str

class QueryRequest(BaseModel):
    session_id: str
    question: str
    history: list = []


# -------------------- BUILD INDEX --------------------
def build_index(data_path):
    documents = SimpleDirectoryReader(
        data_path,
        required_exts=[".pdf", ".txt"]
    ).load_data()

    parser = SimpleNodeParser.from_defaults(
        chunk_size=700,
        chunk_overlap=100
    )

    nodes = parser.get_nodes_from_documents(documents)

    # Filter small chunks
    nodes = [n for n in nodes if len(n.text.strip()) > 50]

    # Create NEW FAISS index per session
    faiss_index = faiss.IndexFlatL2(384)
    vector_store = FaissVectorStore(faiss_index=faiss_index)

    index = VectorStoreIndex(nodes, vector_store=vector_store)

    return index


# -------------------- UPLOAD (NEW SESSION) --------------------
@app.post("/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...)):
    
    # Create unique session
    session_id = str(uuid.uuid4())

    session_path = f"data/{session_id}"
    os.makedirs(session_path, exist_ok=True)

    file_path = os.path.join(session_path, file.filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Build index for THIS session only
    index = build_index(session_path)

    # Store session
    sessions[session_id] = {
        "index": index
    }

    return {"session_id": session_id}


# -------------------- CHAT --------------------
@app.post("/chat")
async def chat(req: QueryRequest):

    # Validate session
    if req.session_id not in sessions:
        return {"error": "Invalid session_id. Please upload file again."}

    index = sessions[req.session_id]["index"]

    # Create chat engine
    chat_engine = index.as_chat_engine(
        chat_mode="context",
        streaming=True,
        similarity_top_k=5
    )

    # Convert history
    chat_history = [
        ChatMessage(role=m["role"], content=m["text"])
        for m in req.history
    ]

    # Streaming response
    response = chat_engine.stream_chat(
        req.question,
        chat_history=chat_history
    )

    async def stream_generator():
        for token in response.response_gen:
            yield token

    return StreamingResponse(stream_generator(), media_type="text/plain")


# -------------------- OPTIONAL: DELETE SESSION --------------------
@app.delete("/session/{session_id}")
async def delete_session(session_id: str):

    if session_id in sessions:
        del sessions[session_id]

        # delete files
        session_path = f"data/{session_id}"
        if os.path.exists(session_path):
            shutil.rmtree(session_path)

        return {"message": "Session deleted"}

    return {"error": "Session not found"}