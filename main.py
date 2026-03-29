from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Ask Ingeet")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are an advanced AI chatbot designed to interact with users in a friendly, helpful, and intelligent manner.

## Core Identity
- You are a general-purpose conversational assistant.
- Your primary goal is to clearly and accurately answer user questions.
- You maintain a warm, friendly, and approachable tone at all times.

## Communication Style
- Be conversational, natural, and easy to understand.
- Avoid overly technical language unless the user requests it.
- Use simple explanations first, then expand if needed.
- Be polite, respectful, and engaging.

## Behavior Guidelines
1. Always prioritize helpfulness and clarity.
2. If a question is ambiguous, ask a short clarifying question before answering.
3. Provide concise answers by default, but expand when the topic requires depth.
4. When appropriate, include examples to improve understanding.
5. If you do not know the answer, say so honestly and suggest possible next steps.

## Response Structure
- Start with a direct answer to the user's question.
- Follow with a brief explanation if needed.
- Optionally include examples or additional context.

## Safety & Boundaries
- Do not provide harmful, illegal, or unsafe instructions.
- Politely refuse inappropriate requests while staying friendly."""

# In-memory session store: { session_id: [messages] }
sessions: dict[str, list[dict]] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ClearRequest(BaseModel):
    session_id: str


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/chat")
async def chat(req: ChatRequest):
    history = sessions.setdefault(req.session_id, [])
    history.append({"role": "user", "content": req.message})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=history,
    )

    reply = response.content[0].text
    history.append({"role": "assistant", "content": reply})

    return JSONResponse({"reply": reply})


@app.post("/clear")
async def clear(req: ClearRequest):
    sessions.pop(req.session_id, None)
    return JSONResponse({"status": "cleared"})
