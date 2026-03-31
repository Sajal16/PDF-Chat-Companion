import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

# FastAPI app
app = FastAPI()

# CORS (IMPORTANT for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- LLM --------------------
from llama_index.llms.google_genai import GoogleGenAI

llm = GoogleGenAI(
    model="gemini-2.5-flash",
    api_key=api_key
)

# -------------------- Embeddings --------------------
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

embed_model = HuggingFaceEmbedding(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# -------------------- Settings --------------------
from llama_index.core import Settings

Settings.llm = llm
Settings.embed_model = embed_model

# -------------------- FAISS --------------------
import faiss
from llama_index.vector_stores.faiss import FaissVectorStore

faiss_index = faiss.IndexFlatL2(384)
vector_store = FaissVectorStore(faiss_index=faiss_index)

# -------------------- Load Docs --------------------
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.node_parser import SimpleNodeParser

def load_index():
    print("⚡ Loading documents...")

    documents = SimpleDirectoryReader("data").load_data()

    parser = SimpleNodeParser.from_defaults(
        chunk_size=200,
        chunk_overlap=40
    )

    nodes = parser.get_nodes_from_documents(documents)

    print(f"✅ Total chunks: {len(nodes)}")

    index = VectorStoreIndex(
        nodes,
        vector_store=vector_store
    )

    print("✅ Index ready!")

    return index

# -------------------- GLOBAL INDEX (LAZY LOAD) --------------------
index = None   # ✅ IMPORTANT FIX

# -------------------- Prompt --------------------
from llama_index.core.prompts import PromptTemplate

def query_rag(index, question):
    qa_prompt = PromptTemplate(
        "You are a helpful AI assistant.\n"
        "Answer ONLY from the provided context.\n"
        "If answer is not present, say 'Answer not found in document'.\n\n"
        "Context:\n{context_str}\n\n"
        "Question: {query_str}\n"
        "Answer:"
    )

    query_engine = index.as_query_engine(
        similarity_top_k=5,
        text_qa_template=qa_prompt
    )

    response = query_engine.query(question)

    return str(response)

# -------------------- ROUTES --------------------

# ✅ Health check (IMPORTANT for Render)
@app.get("/")
def home():
    return {"status": "API is running 🚀"}

# -------------------- CHAT --------------------
from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
async def chat(req: ChatRequest):
    global index

    # ✅ LAZY LOADING FIX
    if index is None:
        print("⚡ First request → creating index...")
        index = load_index()

    answer = query_rag(index, req.question)

    return {"answer": answer}

# -------------------- FILE UPLOAD --------------------
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    global index

    file_path = f"data/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # ✅ RELOAD INDEX AFTER UPLOAD
    index = load_index()

    return {"message": "File uploaded & index updated successfully"}