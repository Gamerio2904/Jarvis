from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import db
from .ollama_client import OllamaError, chat_completion, check_ollama

app = FastAPI(title="Jarvis API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateConversationBody(BaseModel):
    title: str = "Neues Gespräch"


class ChatBody(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


@app.on_event("startup")
def on_startup() -> None:
    db.init_db()


@app.get("/api/health")
async def health() -> dict[str, Any]:
    settings = db.load_settings()
    try:
        ollama = await check_ollama(settings["ollama_base_url"])
        model_names = [m.get("name", "") for m in ollama.get("models", [])]
        model_ready = any(
            settings["model"] == name or name.startswith(settings["model"] + ":")
            or settings["model"] in name
            for name in model_names
        )
        return {
            "ok": True,
            "ollama": True,
            "model": settings["model"],
            "model_ready": model_ready,
            "models": model_names,
        }
    except OllamaError as exc:
        return {
            "ok": False,
            "ollama": False,
            "model": settings["model"],
            "model_ready": False,
            "error": str(exc),
        }


@app.get("/api/conversations")
def api_list_conversations() -> list[dict[str, Any]]:
    return db.list_conversations()


@app.post("/api/conversations")
def api_create_conversation(body: CreateConversationBody) -> dict[str, Any]:
    return db.create_conversation(body.title)


@app.get("/api/conversations/{conversation_id}")
def api_get_conversation(conversation_id: str) -> dict[str, Any]:
    conv = db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Gespräch nicht gefunden.")
    messages = db.list_messages(conversation_id)
    return {**conv, "messages": messages}


@app.post("/api/conversations/{conversation_id}/chat")
async def api_chat(conversation_id: str, body: ChatBody) -> dict[str, Any]:
    conv = db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Gespräch nicht gefunden.")

    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Leere Nachricht.")

    settings = db.load_settings()
    persona = db.load_persona()
    user_msg = db.add_message(conversation_id, "user", content)
    db.maybe_set_title_from_first_message(conversation_id, content)

    history = db.list_messages(conversation_id)
    max_n = int(settings.get("max_context_messages", 40))
    # Exclude nothing needed — history already includes the new user message.
    trimmed = history[-max_n:]
    llm_messages = [{"role": m["role"], "content": m["content"]} for m in trimmed]

    try:
        reply = await chat_completion(
            base_url=settings["ollama_base_url"],
            model=settings["model"],
            system=persona,
            messages=llm_messages,
            temperature=float(settings.get("temperature", 0.9)),
            top_p=float(settings.get("top_p", 0.95)),
            num_predict=int(settings.get("num_predict", 280)),
        )
    except OllamaError as exc:
        # Keep user message; surface clear error for UI.
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    assistant_msg = db.add_message(conversation_id, "assistant", reply)
    updated = db.get_conversation(conversation_id)
    return {
        "conversation": updated,
        "user_message": user_msg,
        "assistant_message": assistant_msg,
    }
