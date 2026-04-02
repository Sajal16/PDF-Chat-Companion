import os
import shutil
import time
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from llama_index.core.llms import ChatMessage

# Load env
load_dotenv()

# -------------------- API KEY --------------------
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

# -------------------- FAISS --------------------
import faiss
from llama_index.vector_stores.faiss import FaissVectorStore

faiss_index = faiss.IndexFlatL2(384)
vector_store = FaissVectorStore(faiss_index=faiss_index)

# -------------------- DOC LOADER --------------------
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.node_parser import SimpleNodeParser

DATA_PATH = "data"
os.makedirs(DATA_PATH, exist_ok=True)

import os
from llama_index.core import StorageContext, load_index_from_storage

PERSIST_DIR = "storage"

def build_index():
    import os
    from llama_index.core import StorageContext, load_index_from_storage

    PERSIST_DIR = "storage"

    # ✅ Load from storage if exists
    if os.path.exists(PERSIST_DIR):
        print("⚡ Loading index from storage...")
        storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
        return load_index_from_storage(storage_context)

    print("⚡ Creating new index...")

    # Prevent ValueError if data directory is initially empty on deploy
    has_docs = any(f.endswith('.pdf') or f.endswith('.txt') for f in os.listdir(DATA_PATH))
    if not has_docs:
        with open(os.path.join(DATA_PATH, "dummy.txt"), "w") as f:
            f.write("System initialized. Awaiting user documents.")

    documents = SimpleDirectoryReader(
        DATA_PATH,
        required_exts=[".pdf", ".txt"]
    ).load_data()

    parser = SimpleNodeParser.from_defaults(
        chunk_size=700,
        chunk_overlap=100
    )

    # 🔥 STEP 1: Create chunks
    nodes = parser.get_nodes_from_documents(documents)

    print(f"Before filtering: {len(nodes)}")

    # 🔥 STEP 2: FILTER BAD CHUNKS (ADD HERE ✅)
    nodes = [n for n in nodes if len(n.text.strip()) > 50]

    print(f"After filtering: {len(nodes)}")

    # 🔥 STEP 3: Create index
    index = VectorStoreIndex(nodes, vector_store=vector_store)

    # 🔥 STEP 4: Save index
    index.storage_context.persist(persist_dir=PERSIST_DIR)

    print("✅ Index saved!")

    return index


# -------------------- FASTAPI --------------------
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "https://pdf-chat-companion.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/")
# def read_root():
#     return {"message": "Hello World"}

index = None

@app.on_event("startup")
def startup():
    global index
    index = build_index()


# -------------------- REQUEST MODEL --------------------
class QueryRequest(BaseModel):
    question: str
    history: list = []   # chat memory


# -------------------- STREAMING CHAT -------------------
@app.post("/chat")
async def chat(req: QueryRequest):
    global index
    
    # 1. Initialize chat engine with streaming enabled
    chat_engine = index.as_chat_engine(
        chat_mode="context", 
        streaming=True,
        similarity_top_k=5
    )

    # 2. Map history to LlamaIndex ChatMessage objects
    chat_history = [
        ChatMessage(role=m["role"], content=m["text"]) 
        for m in req.history
    ]

    # 3. Get streaming response
    response = chat_engine.stream_chat(req.question, chat_history=chat_history)

    async def stream_generator():
        for token in response.response_gen:
            yield token

    return StreamingResponse(stream_generator(), media_type="text/plain")


# -------------------- PDF UPLOAD --------------------
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_path = os.path.join(DATA_PATH, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Delete old cached database so we can recreate it with completely new PDFs
    if os.path.exists(PERSIST_DIR):
        shutil.rmtree(PERSIST_DIR)

    # rebuild index after upload
    global index
    index = build_index()

    return {"message": "File uploaded & indexed successfully"}
