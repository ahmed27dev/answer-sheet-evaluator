import sys
import os
from dotenv import load_dotenv

load_dotenv()  # ← this loads the .env file

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import evaluate
from routers import questions
from database import client

app = FastAPI(
    title       = "Handwritten Answer Sheet Evaluator",
    description = "Backend API for OCR → NLP → Ollama evaluation pipeline",
    version     = "1.0.0"
)

# ── CORS ──────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"]
)

# ── MongoDB lifecycle ─────────────────────────

@app.on_event("startup")
async def startup_db():
    print("✅ Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_db():
    client.close()
    print("🔴 MongoDB connection closed")

# ── Routers ───────────────────────────────────

app.include_router(evaluate.router)
app.include_router(questions.router)

# ── Root ──────────────────────────────────────

@app.get("/")
def root():
    return {
        "project" : "Handwritten Answer Sheet Evaluator",
        "status"  : "Backend is live ✅",
        "docs"    : "Visit /docs for Swagger UI",
        "routes"  : [
            "POST /questions/          ← save question + model answer",
            "GET  /questions/          ← list all questions",
            "GET  /questions/{id}      ← get one question",
            "DELETE /questions/{id}    ← delete question",
            "POST /evaluate/text       ← evaluate typed answer",
            "POST /evaluate/image      ← evaluate image answer",
            "GET  /evaluate/health     ← health check",
            "GET  /evaluate/history    ← past evaluations"
        ]
    }