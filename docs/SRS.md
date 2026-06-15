# Multilingual Voice AI Agent with RAG, Memory and Proactive Calling Capability

## 1. Project Overview

The Multilingual Voice AI Agent is an intelligent conversational system that enables users to interact with an AI assistant using voice and text. The system supports Retrieval-Augmented Generation (RAG), conversation memory, multilingual communication, and proactive calling capabilities.

Users can upload documents such as interview notes, cybersecurity notes, and study materials. The AI retrieves relevant information from these documents and provides contextual responses. The system also remembers important user information and can continue conversations naturally across sessions.

The agent supports multiple languages including English, Hindi, and Marathi, making it accessible to a wider range of users.



## 2. Problem Statement

Traditional chatbots often provide generic responses and cannot access user-specific documents. They usually do not remember previous conversations, have limited multilingual support, and lack voice-based interaction.

Users frequently need an assistant that can:
- Answer questions from their own documents.
- Remember important information across conversations.
- Communicate using voice.
- Support multiple languages.
- Initiate conversations proactively.

This project aims to solve these limitations by developing a multilingual voice AI agent with RAG, memory, and proactive calling capabilities.



## 3. Functional Requirements

### FR1: User Conversation
The system shall allow users to communicate with the AI assistant using text messages.

### FR2: Voice Interaction
The system shall accept voice input from users and convert it into text for processing.

### FR3: Voice Response
The system shall convert AI-generated responses into speech and play them to the user.

### FR4: Document Upload
The system shall allow users to upload PDF documents for knowledge retrieval.

### FR5: Retrieval-Augmented Generation (RAG)
The system shall retrieve relevant information from uploaded documents and generate context-aware responses.

### FR6: Memory Management
The system shall store and retrieve important user information across conversations.

### FR7: Multilingual Support
The system shall support communication in English, Hindi, and Marathi.

### FR8: Chat History
The system shall maintain a history of user conversations.

### FR9: Proactive Calling Simulation
The system shall allow the AI assistant to initiate conversations through a browser-based calling interface.




## 4. Non-Functional Requirements

### NFR1: Performance
The system should provide responses within a reasonable time under normal usage conditions.

### NFR2: Usability
The user interface should be simple, intuitive, and easy to use.

### NFR3: Reliability
The system should operate consistently without frequent failures.

### NFR4: Scalability
The architecture should support future enhancements such as additional languages, cloud deployment, and real phone calling.

### NFR5: Maintainability
The codebase should be modular and organized to simplify future development and maintenance.

### NFR6: Security
User data, uploaded documents, and conversation history should be handled securely.



## 5. System Users and Use Cases

### Primary User
A user who interacts with the AI assistant using voice or text to ask questions, upload documents, and receive responses.

### Use Cases

#### UC1: Chat with AI
The user sends a text message and receives an AI-generated response.

#### UC2: Voice Conversation
The user speaks through a microphone and receives a spoken response from the AI.

#### UC3: Upload Documents
The user uploads PDF documents to expand the AI's knowledge base.

#### UC4: Ask Questions from Documents
The user asks questions related to uploaded documents and receives context-aware answers.

#### UC5: Language Switching
The user changes the conversation language during interaction.

#### UC6: Memory Retrieval
The user asks the AI to recall previously stored information.

#### UC7: Proactive Calling
The user initiates a browser-based call and the AI starts the conversation.



## 6. Technology Stack

| Component | Technology |
|------------|------------|
| Programming Language | Python |
| Backend Framework | FastAPI |
| Frontend | HTML, CSS, JavaScript |
| Vector Database | ChromaDB |
| Embedding Model | Sentence Transformers |
| Speech-to-Text | Whisper |
| Text-to-Speech | pyttsx3 |
| Memory Storage | SQLite |
| Version Control | Git |
| Repository Hosting | GitHub |
| LLM | Ollama + Llama 3 / Gemma |


## 7. Future Enhancements

- Integration with real phone calling services such as Twilio.
- Support for additional languages.
- User authentication and profile management.
- Cloud deployment for remote access.
- Personalized learning recommendations based on user activity.
- Email and notification support.
- Mobile application support.
- Advanced long-term memory capabilities.