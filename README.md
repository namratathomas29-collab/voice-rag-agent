# Astra – Multilingual Voice RAG Assistant

## Overview

Astra is a full-stack AI-powered voice assistant that combines Retrieval-Augmented Generation (RAG), voice interaction, memory, and document-based question answering.

Users can upload PDF documents, ask questions through voice or text, and receive intelligent responses powered by Gemini AI, Whisper, and ChromaDB.

The system supports multilingual conversations, answer saving, conversation memory, and source-aware responses through an interactive futuristic interface.

---

## Features

### AI & RAG

* PDF-based Retrieval-Augmented Generation (RAG)
* ChromaDB vector database for semantic search
* Gemini AI-powered answer generation
* Source-aware responses
* Context retrieval from uploaded documents

### Voice Capabilities

* Speech-to-Text using Whisper
* Text-to-Speech response generation
* Voice-based interaction
* Real-time voice assistant experience

### Memory System

* Conversation memory storage
* Previous interaction recall
* SQLite-based memory management

### User Experience

* Interactive AI Orb Interface
* Modern glassmorphism UI
* Saved responses system
* Swipe-to-open saved responses
* Swipe-to-delete saved responses
* Source badges and response cards

---

## Tech Stack

### Frontend

* React.js
* CSS3
* Framer Motion

### Backend

* FastAPI
* Python

### AI & Data

* Google Gemini
* Whisper
* ChromaDB
* SQLite

---

## Project Architecture

User Question
↓
Voice/Text Input
↓
Whisper Speech Recognition
↓
RAG Retrieval (ChromaDB)
↓
Gemini AI
↓
Answer Generation
↓
Text-to-Speech
↓
Response Card + Voice Output

---

## Screenshots

### Home Interface

(Add Screenshot Here)

### Voice Calling Interface

(Add Screenshot Here)

### Saved Responses

(Add Screenshot Here)

---

## Installation

### Clone Repository

git clone https://github.com/namratathomas29-collab/voice-rag-agent.git

cd voice-rag-agent

### Backend Setup

cd backend

pip install -r requirements.txt

uvicorn main:app --reload

### Frontend Setup

cd frontend

npm install

npm run dev

---

## Future Improvements

* Memory-first retrieval architecture
* User authentication
* Cloud deployment
* Advanced conversation analytics
* Real-time voice calling
* Personalized AI memory profiles

---

## Author

Namrata Thomas Bansode

BCA Graduate | Java Developer | AI & Full-Stack Enthusiast
