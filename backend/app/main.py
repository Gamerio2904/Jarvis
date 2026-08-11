from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import db
from .guards import SAFE_REFUSAL, needs_retry, sanitize_or_refuse
from .ollama_client import (
    OllamaError,
    chat_completion,
    check_ollama,
    resolve_model,
)

app = FastAPI(title="Jarvis API", version="0.1.1")

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


async def _resolve_runtime_model(settings: dict[str, Any]) -> tuple[str, bool, list[str]]:
    ollama = await check_ollama(settings["ollama_base_url"])
    names = [m.get("name", "") for m in ollama.get("models", [])]
    model, used_fallback = resolve_model(settings, names)
    from .ollama_client import model_is_available

    if not model_is_available(model, names):
        raise OllamaError(
            f"Kein passendes Modell geladen. Bitte: ollama pull {settings.get('model')} "
            f"(Fallback: {settings.get('fallback_model')})"
        )
    return model, used_fallback, names


@app.get("/api/health")
async def health() -> dict[str, Any]:
    settings = db.load_settings()
    try:
        model, used_fallback, names = await _resolve_runtime_model(settings)
        return {
            "ok": True,
            "ollama": True,
            "version": "0.1.1",
            "configured_model": settings.get("model"),
            "fallback_model": settings.get("fallback_model"),
            "model": model,
            "using_fallback": used_fallback,
            "model_ready": True,
            "models": names,
        }
    except OllamaError as exc:
        return {
            "ok": False,
            "ollama": False,
            "version": "0.1.1",
            "configured_model": settings.get("model"),
            "fallback_model": settings.get("fallback_model"),
            "model": settings.get("model"),
            "using_fallback": False,
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


async def _generate_reply(
    *,
    settings: dict[str, Any],
    persona: str,
    model: str,
    llm_messages: list[dict[str, str]],
) -> str:
    kwargs = dict(
        base_url=settings["ollama_base_url"],
        model=model,
        system=persona,
        messages=llm_messages,
        temperature=float(settings.get("temperature", 0.75)),
        top_p=float(settings.get("top_p", 0.9)),
        num_predict=int(settings.get("num_predict", 220)),
        repeat_penalty=float(settings.get("repeat_penalty", 1.15)),
    )
    reply = await chat_completion(**kwargs)
    retries = int(settings.get("guard_max_retries", 1))
    attempt = 0
    while needs_retry(reply) and attempt < retries:
        attempt += 1
        # Nudge: append a hidden-style user correction for regeneration only
        # (not persisted — only for this completion call).
        regen_messages = [
            *llm_messages,
            {
                "role": "user",
                "content": (
                    "Systemhinweis: Ungültige Antwort (Inject-Gehorsam, Kollaps, "
                    "Duzen oder Boilerplate). Antworte neu als Jarvis: nur Deutsch, "
                    "Siezen oder ohne Du-Pronomen, keine Zwangstokens, keine Listen-Hilfe."
                ),
            },
        ]
        reply = await chat_completion(**{**kwargs, "messages": regen_messages})
    return sanitize_or_refuse(reply)


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
    trimmed = history[-max_n:]
    llm_messages = [{"role": m["role"], "content": m["content"]} for m in trimmed]

    try:
        model, used_fallback, _names = await _resolve_runtime_model(settings)
        reply = await _generate_reply(
            settings=settings,
            persona=persona,
            model=model,
            llm_messages=llm_messages,
        )
    except OllamaError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    assistant_msg = db.add_message(conversation_id, "assistant", reply)
    updated = db.get_conversation(conversation_id)
    return {
        "conversation": updated,
        "user_message": user_msg,
        "assistant_message": assistant_msg,
        "model": model,
        "using_fallback": used_fallback,
        "guarded": reply == SAFE_REFUSAL,
    }
