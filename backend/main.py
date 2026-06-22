from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
import os
from pydantic import BaseModel
from backend.rag import collection
from backend.database import init_db, save_memory, get_memory
from backend.rag import (
    load_text_file,
    chunk_text,
    create_embeddings,
    ingest_document,
    retrieve_context,
    generate_answer
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
init_db()

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"message": "Welcome to Voice RAG Agent"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/chat")
def chat(request: ChatRequest):

    message = request.message.lower()

    # Save Name
    if "my name is" in message:
        name = request.message.split("my name is")[-1].strip()

        save_memory("name", name)

        return {
            "ai_response": f"Nice to meet you, {name}. I will remember your name."
        }

    # Save City
    if "i live in" in message:
        city = request.message.split("i live in")[-1].strip()

        save_memory("city", city)

        return {
            "ai_response": f"Got it. I will remember that you live in {city}."
        }

    # Recall Name
    if "what is my name" in message:
        name = get_memory("name")

        if name:
            return {
                "ai_response": f"Your name is {name}."
            }

        return {
            "ai_response": "I do not know your name yet."
        }

    # Recall City
    if "where do i live" in message:
        city = get_memory("city")

        if city:
            return {
                "ai_response": f"You live in {city}."
            }

        return {
            "ai_response": "I do not know where you live yet."
        }

    return {
        "ai_response": f"You said: {request.message}"
    }

@app.get("/test-rag")
def test_rag():

    content = load_text_file("documents/test_notes.txt")

    return {
        "document_content": content
    }

@app.get("/test-chunks")
def test_chunks():

    content = load_text_file("documents/test_notes.txt")

    chunks = chunk_text(content)

    return {
        "chunks": chunks
    }

@app.get("/test-embeddings")
def test_embeddings():

    content = load_text_file("documents/test_notes.txt")

    chunks = chunk_text(content)

    embeddings = create_embeddings(chunks)

    return {
        "total_chunks": len(chunks),
        "embedding_dimension": len(embeddings[0])
    }

@app.get("/ingest")
def ingest():

    chunks_stored = ingest_document(
        "documents/test_notes.txt"
    )

    return {
        "message": "Document ingested successfully",
        "chunks_stored": chunks_stored
    }

@app.get("/ask")
def ask(question: str, document: str = None):

    retrieved = retrieve_context(
    question,
    document
)

    context = retrieved["context"]
    source = retrieved["source"]

    print("\n===== CONTEXT =====")
    print(context)
    print("===================\n")

    try:
        answer = generate_answer(
            question,
            context
        )

    except Exception as e:
     print("FALLBACK ACTIVATED:", e)

     answer = f"ERROR: {str(e)}"

    return {
       "question": question,
       "answer": answer,
       "source": source
}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    file_path = f"documents/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    chunks_stored = ingest_document(file_path)

    return {
        "message": "PDF uploaded and ingested successfully",
        "file_name": file.filename,
        "chunks_stored": chunks_stored
    }

@app.get("/documents")
def get_documents():

    results = collection.get(
        include=["metadatas"]
    )

    docs = set()

    for metadata in results["metadatas"]:

        if metadata and "source" in metadata:
            docs.add(metadata["source"])

    return {
        "documents": list(docs)
    }