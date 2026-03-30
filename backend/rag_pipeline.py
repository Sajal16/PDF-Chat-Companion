import os
import time
from dotenv import load_dotenv

# -------------------- API KEY --------------------
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("❌ GOOGLE_API_KEY not found in .env")

# -------------------- LLM (Gemini - Fast Config) --------------------
from llama_index.llms.google_genai import GoogleGenAI

llm = GoogleGenAI(
    model="gemini-2.5-flash",
    api_key=api_key,
    temperature=0.2   # 🔥 faster + stable output
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

# -------------------- FAISS VECTOR STORE --------------------
import faiss
from llama_index.vector_stores.faiss import FaissVectorStore

# 384 = embedding dimension of MiniLM
faiss_index = faiss.IndexFlatL2(384)
vector_store = FaissVectorStore(faiss_index=faiss_index)

# -------------------- LOAD DOCUMENTS --------------------
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.node_parser import SimpleNodeParser

def load_index():
    print("⚡ Loading documents...")

    documents = SimpleDirectoryReader("data").load_data()

    # ✅ DEBUG (only first time)
    for doc in documents:
        print("\n📄 Preview:\n", doc.text[:500])
        print("=" * 60)

    # ✅ Optimized chunking
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


# -------------------- QUERY FUNCTION --------------------
from llama_index.core.prompts import PromptTemplate

def query_rag(index, question):

    from llama_index.core.prompts import PromptTemplate

    qa_prompt = PromptTemplate(
        # "You are an expert AI assistant.\n"
        # "Use ONLY the context below to answer.\n"
        # "If answer is not in context, say: 'Not found in document'.\n\n"
        # "Context:\n{context_str}\n\n"
        # "Question: {query_str}\n\n"
        # "Answer clearly with explanation:"

        "You MUST answer ONLY from the context.\n"
        "If answer is not in context, say: 'Answer not found in document.'\n\n"
        "Context:\n{context_str}\n\n"
        "Question: {query_str}\n"
    )

    query_engine = index.as_query_engine(
        similarity_top_k=5,
        response_mode="compact",
        text_qa_template=qa_prompt
    )

    response = query_engine.query(question)

    # 🔍 DEBUG
    print("\n🔍 Retrieved Chunks:\n")
    for node in response.source_nodes:
        print(node.text[:300])
        print("-" * 50)

    return str(response)