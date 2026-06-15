from fastapi import FastAPI
from pydantic import BaseModel
from backend.database import init_db, save_memory, get_memory
app = FastAPI()
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