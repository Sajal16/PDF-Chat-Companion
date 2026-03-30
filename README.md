# RAG-Based-Assignment-Mini-Q-A-System
# 📄 Chat with PDF using RAG (Gemini + LlamaIndex + FAISS)

## 🚀 Project Overview
This project is a ChatGPT-like application that allows users to upload a PDF and ask questions about it. It uses a Retrieval-Augmented Generation (RAG) pipeline to fetch relevant content and generate accurate answers.

## 🧠 Tech Stack
- LlamaIndex (RAG Framework)
- Gemini API (LLM)
- HuggingFace (Embeddings)
- FAISS (Vector Database)
- Streamlit (UI)


## ⚙️ Features
- Upload PDF
- Ask questions in chat format
- Fast retrieval using FAISS
- Source-based answers (no hallucination)
- Chat history


## 🏗️ Architecture
PDF → Chunking → Embeddings → FAISS → Retrieval → Gemini → Answer


## 📦 Installation

```bash
pip install -r requirements.txt
