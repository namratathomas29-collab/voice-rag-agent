from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb 
import google.generativeai as genai
from backend.memory import (
    save_message,
    get_memory,
    clear_memory
)
from dotenv import load_dotenv
import os
conversation_history = []

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    print("API KEY:", api_key[:10] + "...")
else:
    print("ERROR: GEMINI_API_KEY not found!")

genai.configure(api_key=api_key)


gemini_model = genai.GenerativeModel(
    "gemini-2.5-flash"
)


model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.PersistentClient(path="chroma_db")

collection = client.get_or_create_collection(
    name="knowledge_base"
)


def load_pdf(pdf_path):
    text = ""

    reader = PdfReader(pdf_path)

    for page in reader.pages:
        text += page.extract_text() + "\n"

    return text

def load_text_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()
    
def chunk_text(text, chunk_size=500):

    chunks = []

    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i + chunk_size])

    return chunks


def create_embeddings(chunks):

    embeddings = model.encode(chunks)

    return embeddings

def store_in_chromadb(chunks, embeddings, source):

    ids = []
    metadatas = []

    for i in range(len(chunks)):
        source_name = source.split("/")[-1]
        ids.append(f"{source_name}_chunk_{i}")

        metadatas.append({
            "source": source
        })

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings.tolist(),
        metadatas=metadatas
    )

import time

def ingest_document(file_path):

    start = time.time()

    if file_path.endswith(".txt"):
        text = load_text_file(file_path)

    elif file_path.endswith(".pdf"):
        text = load_pdf(file_path)

    else:
        raise ValueError("Unsupported file type")

    print("PDF Read:", time.time() - start)

    start = time.time()

    chunks = chunk_text(text)

    print("Chunking:", time.time() - start)

    start = time.time()

    embeddings = create_embeddings(chunks)

    print("Embeddings:", time.time() - start)

    start = time.time()

    store_in_chromadb(chunks, embeddings, file_path)

    print("Chroma Store:", time.time() - start)

    return len(chunks)

def retrieve_context(question, document=None):

    question_embedding = model.encode(question)

    if document:
        results = collection.query(
            query_embeddings=[question_embedding.tolist()],
            n_results=1,
            where={"source": f"documents/{document}"}
        )
    else:
        results = collection.query(
            query_embeddings=[question_embedding.tolist()],
            n_results=1
        )

    print("\n===== CHROMA RESULTS =====")
    print(results)
    print("==========================\n")

    context = results["documents"][0][0]
    distance = results["distances"][0][0]

    print("DISTANCE:", distance)
    
    print("METADATA:", results["metadatas"])
    metadata = results["metadatas"][0][0]

    if distance > 1.0:
      context = ""
      source = "General Knowledge"

    elif metadata and "source" in metadata:
      source = metadata["source"]

    else:
      source = "Unknown Source"

    return {
      "context": context,
      "source": source
    }

def generate_answer(question, context):
    if question.lower() == "forget all memory":
       clear_memory()
       return "All memory has been deleted."

    global conversation_history
    conversation_text = "\n".join(
      get_memory()
    )

    prompt = f"""
You are a multilingual teacher.

Answer in the same language as the user's question.

If the question is Marathi, answer in Marathi.
If the question is Hindi, answer in Hindi.
If the question is English, answer in English.
the answer should be general and professional.

Previous Conversation:
{conversation_text}

IMPORTANT:
If the user's question can be answered from previous conversation,
use memory first.

Only use Context when memory does not contain the answer.

Context:
{context}

Question:
{question}
"""
    print("\n===== PROMPT =====")
    print(prompt)
    print("==================\n")

    try:
        response = gemini_model.generate_content(prompt)

        save_message(
           "User",
           question
        )

        save_message(
            "Assistant",
             response.text
        )
        print("\n===== MEMORY =====")
        print(conversation_history)
        print("==================\n")

        return response.text

    except Exception as e:
      print("GEMINI ERROR:", e)

      if context.strip():
        return context

      return "No information found."