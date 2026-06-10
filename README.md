I-Based Handwritten Answer Sheet Evaluator
An intelligent system that automatically evaluates handwritten answer sheets using Computer Vision, NLP, and Generative AI — producing scores and personalized feedback in under 10 seconds.

Developed: 2025

Overview
Manual grading is time-intensive, inconsistent, and leaves no room for personalized feedback. This system solves that by combining GPT-4o-mini Vision for OCR, BERT for semantic scoring, and Ollama for AI-generated feedback — all through a clean React interface built for teachers.
Features

Batch Evaluation — Upload one handwritten sheet; the system detects Q1, Q2, Q3 and scores all answers automatically
Vision-Level OCR — GPT-4o-mini reads handwriting like a human, no line segmentation needed
Semantic Scoring — BERT understands meaning, not just keywords — different words, same concept → still scores well
AI Feedback — Ollama runs locally, generating constructive per-answer feedback with no cloud cost or privacy risk
Evaluation History — Every result saved in MongoDB with per-question breakdown
Fast — Full answer sheet evaluated in under 10 seconds

Technology Stack
LayerTechnologyPurposeFrontendReact.js + AxiosTeacher-facing UI with Q-Bank, evaluation, and history pagesBackendFastAPI (Python)Async REST API orchestrating all modulesDatabaseMongoDBFlexible schema for questions and evaluationsOCRGPT-4o-mini VisionHuman-level handwriting extractionNLP ScoringBERT all-MiniLM-L6-v2Semantic similarity scoringNLICross-encoder NLIDetects entailment / contradictionFeedback AIOllama (Local LLM)On-premise generative feedback
System Architecture
Image Upload → GPT-4o-mini (OCR) → Text Extraction
                                        ↓
                              BERT + NLI (Scoring)
                                        ↓
                            Ollama (Feedback Generation)
                                        ↓
                         MongoDB (Storage) → React UI (Display)
Module Breakdown
ModuleDeveloper RoleResponsibilityM1 — OCROCR DeveloperBase64 encode → GPT-4o-mini → clean textM2 — NLPNLP DeveloperBERT scoring + NLI entailment detectionM3 — BackendBackend DeveloperFastAPI routes, Ollama integration, 8 REST endpointsM4 — FrontendFrontend DeveloperReact pages: Home, Q-Bank, Evaluate, History
Getting Started
Prerequisites

Python 3.9+
Node.js 18+
MongoDB (local)
Ollama installed locally
OpenAI API key (for GPT-4o-mini Vision)

Installation
bash# Clone the repository
git clone https://github.com/ahmed27dev/answer-sheet-evaluator.git
cd answer-sheet-evaluator

# Backend setup
cd backend
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env

# Run backend
uvicorn main:app --reload

# Frontend setup (new terminal)
cd frontend
npm install
npm start
Environment Variables
Create a .env file in the /backend directory:
OPENAI_API_KEY=your_openai_api_key

API Endpoints
MethodEndpointDescriptionPOST/evaluate/textEvaluate a typed answerPOST/evaluate/batchEvaluate a full image answer sheetGET/questionsGet all questions from Q-BankPOST/questionsAdd a new questionGET/historyGet evaluation history
Evaluation Pipeline
Text Answer Flow:

Select question → Type answer → NLP scores vs model answer → Ollama generates feedback → Saved to MongoDB

Image Batch Flow:

Upload handwritten sheet → GPT-4o-mini extracts text → Split by Q1/Q2/Q3 → BERT scores each → Ollama gives per-answer feedback → Total score saved

Future Scope

Student login portal for direct result access
Multi-language handwriting support
Domain-specific fine-tuned BERT models
Export evaluation reports as PDF
Admin analytics dashboard

Team
Built as a team project for our Computer Science Engineering program.

Ahmed Mohammed — Backend Developer
Ali Al-Tam — OCR Developer
Anagha Nair — NLP Developer
Aditi Padole — Frontend Developer
