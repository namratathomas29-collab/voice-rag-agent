# System Architecture

## High-Level Architecture
```text
User
 │
 ▼
Frontend (HTML, CSS, JavaScript)
 │
 ▼
FastAPI Backend
 │
 ├── Voice Module
 │      ├── Speech-to-Text (Whisper)
 │      └── Text-to-Speech (pyttsx3)
 │
 ├── Memory Module
 │      └── SQLite Database
 │
 ├── RAG Module
 │      ├── PDF Loader
 │      ├── Text Chunking
 │      ├── Embeddings
 │      └── ChromaDB
 │
 └── LLM Module
        └── Ollama + Llama3/Gemma
```

## Data Flow Architecture

```text
User Question
      │
      ▼
Frontend
      │
      ▼
FastAPI Backend
      │
      ├── Memory Check
      │       │
      │       ▼
      │    SQLite
      │
      ├── RAG Retrieval
      │       │
      │       ▼
      │    ChromaDB
      │
      └── LLM Processing
              │
              ▼
         AI Response
              │
              ▼
           Frontend
              │
              ▼
             User
```