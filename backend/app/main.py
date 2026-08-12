from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from . import context as ctx
from . import db
from . import memory as memory_mod
from . import policy as policy_mod
from . import router as router_mod
from .guards import (
    SAFE_DEGENERATE,
    SAFE_MEMORY_REFUSE_FALSE,
    SAFE_NO_HELPDESK,
    force_strict_refuse_if_needed,
    is_bad_memory_canned,
    is_guarded_canned,
    needs_retry,
    user_looks_kaputt,
)
from .ollama_client import (
    OllamaError,
    chat_completion,
    chat_completion_stream,
    check_ollama,
    model_is_available,
    resolve_model,
    resolve_routed_model,
)

app = FastAPI(title="Jarvis API", version="0.5.0")
APP_VERSION = "0.5.0"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REGEN_NUDGE = (
    "Systemhinweis: Ungültige Antwort (Inject-Gehorsam, Tip-Listen, Sticky "
    "„Bin kaputt“, Duzen, Helpdesk-Boilerplate, Nonsense). Antworte neu als "
    "Jarvis: nur Deutsch, Siezen oder ohne Du-Pronomen, keine Zwangstokens, "
    "keine nummerierten Listen, KEINE Floskeln wie „Wie kann ich helfen?“, "
    "„Entschuldigung für den Fehler“, „Ich bin hier um zu helfen“. "
    "Kurz, frech-warm, messenger-artig."
)

KAPUTT_NUDGE = (
    "Systemhinweis: Nutzer wirkt kaputt/müde. Antworte kurz als Jarvis: "
    "frech-warm, Modus „Kante oder Ruhe“ anbieten. "
    "Niemals selbst „Bin kaputt“ / „Bin etwas kaputt“ sagen. "
    "Kein Duzen, kein Helpdesk, keine Motivationsposter."
)

MEMORY_WRITE_NUDGE = (
    "Systemhinweis: Der Fakt wurde bereits gespeichert. "
    "Bestätige kurz (1 Satz) im Jarvis-Ton, z.B. sinngemäß „Notiert: …“. "
    "Kein Helpdesk, kein „Gerne!“, kein „Wie kann ich helfen?“, kein Duzen."
)

MEMORY_FORGET_NUDGE = (
    "Systemhinweis: Die Erinnerung wurde gelöscht. "
    "Bestätige kurz im Jarvis-Ton. Kein Helpdesk, kein Duzen."
)

MEMORY_RECALL_NUDGE = (
    "Systemhinweis: Relevante Fakten aus dem Langzeitgedächtnis sind im Systemprompt. "
    "Beantworte die Recall-Frage kurz und konkret mit dem gespeicherten Fakt. "
    "Kein Helpdesk, kein Duzen, kein „Kurzer Aussetzer“, keine Floskeln."
)

MEMORY_CLARIFY_NUDGE = (
    "Systemhinweis: Widerspruch wurde korrigiert. Bestätige den neuen Wert und stelle "
    "genau eine kurze Rückfrage („so merken?“). Kein Helpdesk, kein Duzen."
)


class CreateConversationBody(BaseModel):
    title: str = "Neues Gespräch"


class ChatBody(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class MemoryCreateBody(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    value: str = Field(min_length=1, max_length=500)
    category: str = "fact"


@app.on_event("startup")
def on_startup() -> None:
    db.init_db()


async def _resolve_runtime_model(
    settings: dict[str, Any],
    *,
    prefer_heavy: bool = False,
) -> tuple[str, bool, list[str], str]:
    ollama = await check_ollama(settings["ollama_base_url"])
    names = [m.get("name", "") for m in ollama.get("models", [])]
    model, used_fallback, routing_mode = resolve_routed_model(
        settings, names, prefer_heavy=prefer_heavy
    )
    if not model_is_available(model, names):
        # Fallback to classic resolve
        model, used_fallback = resolve_model(settings, names)
        routing_mode = str(settings.get("routing_mode", "auto"))
    if not model_is_available(model, names):
        raise OllamaError(
            f"Kein passendes Modell geladen. Bitte: ollama pull {settings.get('model')} "
            f"(Fallback: {settings.get('fallback_model')})"
        )
    return model, used_fallback, names, routing_mode


def _completion_kwargs(
    settings: dict[str, Any],
    model: str,
    system: str,
    *,
    num_predict: int | None = None,
) -> dict[str, Any]:
    return {
        "base_url": settings["ollama_base_url"],
        "model": model,
        "system": system,
        "temperature": float(settings.get("temperature", 0.72)),
        "top_p": float(settings.get("top_p", 0.88)),
        "num_predict": int(
            num_predict
            if num_predict is not None
            else settings.get("num_predict", 220)
        ),
        "repeat_penalty": float(settings.get("repeat_penalty", 1.18)),
    }


def _regen_nudge_for(user_text: str, memory_op: str | None = None) -> str:
    if memory_op == "write":
        return MEMORY_WRITE_NUDGE
    if memory_op in {"forget", "forget_all"}:
        return MEMORY_FORGET_NUDGE
    if memory_op == "recall":
        return MEMORY_RECALL_NUDGE
    if memory_op == "clarify":
        return MEMORY_CLARIFY_NUDGE
    if user_looks_kaputt(user_text):
        return KAPUTT_NUDGE
    return REGEN_NUDGE


def _prepare_chat_context(
    *,
    conversation_id: str,
    user_text: str,
    settings: dict[str, Any],
    persona: str,
) -> tuple[str, list[dict[str, str]], list[str], str, dict[str, Any], policy_mod.Policy]:
    """Returns system, messages, notes, memory_op, route_debug, policy."""
    route = router_mod.classify(
        user_text,
        research_opt_in=bool(settings.get("research_opt_in", False)),
    )
    policy = policy_mod.get_policy(route.policy_key)

    mem_op, notes = memory_mod.apply_explicit_memory_commands(
        user_text, conversation_id=conversation_id
    )
    # Soft-harvest only outside explicit memory ops / non-memory smalltalk
    memory_mod.harvest_soft_facts(
        user_text,
        conversation_id=conversation_id,
        skip=mem_op != "none" or bool(notes) or route.intent == "inject",
        confidence=float(settings.get("soft_harvest_confidence", 0.55)),
        ttl_days=float(settings.get("soft_harvest_ttl_days", 14)),
    )

    mem_limit = int(settings.get("memory_retrieve_limit", 8))
    # Smalltalk / inject: no ambient leak (even if tokens overlap)
    allow_retrieve = route.intent not in {"smalltalk", "inject", "helpdesk_trap"}
    if route.memory_sub == "memory.recall":
        allow_retrieve = True
    items: list[dict[str, Any]] = []
    if allow_retrieve and mem_op not in {"forget", "forget_all"}:
        items = memory_mod.retrieve_relevant(
            user_text,
            limit=mem_limit,
            ambient_fallback=bool(settings.get("memory_ambient_fallback", False)),
            min_confidence=float(settings.get("memory_min_inject_confidence", 0.4)),
        )

    # Recall only when router says so (or explicit recall question) — not every token hit
    if mem_op == "none" and items and (
        route.memory_sub == "memory.recall"
        or memory_mod.looks_like_recall_question(user_text)
    ):
        mem_op = "recall"
        notes = [f"Recall: {it['key']} = {it['value']}" for it in items[:4]]

    if route.research_blocked:
        notes = [
            *notes,
            "Research ohne Opt-in — kein Netzaufruf. Nur lokales Wissen.",
        ]

    conv = db.get_conversation(conversation_id) or {}
    summary = conv.get("summary_text")

    system = ctx.build_system_prompt(
        persona=persona,
        memory_items=items,
        summary_text=summary,
        memory_notes=notes or None,
    )
    system = policy_mod.append_policy_to_system(system, policy)

    history = db.list_messages(conversation_id)
    last_k = int(settings.get("context_last_k", 16))
    max_ctx = int(settings.get("max_context_messages", last_k))
    llm_messages = ctx.pack_messages(history, last_k=min(last_k, max_ctx))
    return system, llm_messages, notes, mem_op, router_mod.route_debug_dict(route), policy


def _finalize_memory_reply(
    reply: str,
    *,
    user_text: str,
    memory_op: str,
    memory_notes: list[str],
) -> str:
    """Memory-turn post-process: no false confirms; no Aussetzer/Helpdesk."""
    if memory_op == "write":
        if is_bad_memory_canned(reply) or reply.strip() in {
            SAFE_DEGENERATE,
            SAFE_NO_HELPDESK,
            "Notiert. Was sonst?",
        }:
            return memory_mod.ack_reply_for_write(memory_notes)
        return reply
    if memory_op in {"forget", "forget_all"}:
        if is_bad_memory_canned(reply) or reply.strip() == "Ist weg. Weiter?":
            return memory_mod.ack_reply_for_forget(memory_op, memory_notes)
        return reply
    if memory_op == "recall":
        if is_bad_memory_canned(reply) or reply.strip() in {
            SAFE_DEGENERATE,
            SAFE_NO_HELPDESK,
            "Dazu habe ich etwas notiert — welche Detailfrage genau?",
        }:
            return memory_mod.ack_reply_for_recall(memory_notes)
        return reply
    if memory_op == "clarify":
        if is_bad_memory_canned(reply) or reply.strip() in {
            SAFE_DEGENERATE,
            SAFE_NO_HELPDESK,
            "Korrigiert. So merken?",
        }:
            return memory_mod.ack_reply_for_clarify(memory_notes)
        # Ensure a question mark for clarify policy
        if "?" not in reply:
            return memory_mod.ack_reply_for_clarify(memory_notes)
        return reply
    # Research without opt-in: never leave Aussetzer as final
    if any("Research ohne Opt-in" in n for n in memory_notes):
        if is_bad_memory_canned(reply) or reply.strip() == SAFE_DEGENERATE:
            return (
                "Research-Opt-in ist aus — kein Netz. "
                "Nur lokales Wissen geht. Opt-in später in den Settings."
            )
    if memory_mod.looks_like_remember_intent(
        user_text
    ) and memory_mod.looks_like_false_memory_confirm(reply):
        return SAFE_MEMORY_REFUSE_FALSE
    return reply


async def _maybe_refresh_summary(
    *,
    conversation_id: str,
    settings: dict[str, Any],
    model: str,
) -> None:
    every_n = int(settings.get("summary_every_n_messages", 8))
    conv = db.get_conversation(conversation_id)
    if not conv:
        return
    history = db.list_messages(conversation_id)
    if not ctx.should_refresh_summary(
        message_count=len(history),
        last_summary_count=int(conv.get("summary_message_count") or 0),
        every_n=every_n,
    ):
        return

    # Summarize older part; keep raw last_k for the live packer.
    last_k = int(settings.get("context_last_k", 16))
    older = history[:-last_k] if len(history) > last_k else history
    if len(older) < 4:
        return
    transcript = "\n".join(f"{m['role']}: {m['content']}" for m in older[-40:])
    try:
        summary = await chat_completion(
            **_completion_kwargs(
                settings,
                model,
                ctx.SUMMARY_PROMPT,
                num_predict=int(settings.get("summary_num_predict", 180)),
            ),
            messages=[{"role": "user", "content": transcript}],
        )
    except OllamaError:
        return
    summary = summary.strip()
    if not summary or not memory_mod.summary_is_german_clean(summary):
        return
    db.update_conversation_summary(
        conversation_id,
        summary_text=summary[:2000],
        summary_upto_message_id=older[-1]["id"],
        summary_message_count=len(history),
    )


async def _generate_reply(
    *,
    settings: dict[str, Any],
    system: str,
    model: str,
    llm_messages: list[dict[str, str]],
    recent_assistant: list[str],
    user_text: str,
    memory_op: str = "none",
    memory_notes: list[str] | None = None,
) -> str:
    kwargs = _completion_kwargs(settings, model, system)
    reply = await chat_completion(**kwargs, messages=llm_messages)
    retries = int(settings.get("guard_max_retries", 2))
    attempt = 0
    nudge = _regen_nudge_for(user_text, memory_op)
    while needs_retry(reply, recent_assistant) and attempt < retries:
        attempt += 1
        regen_messages = [*llm_messages, {"role": "user", "content": nudge}]
        reply = await chat_completion(**kwargs, messages=regen_messages)
    reply = force_strict_refuse_if_needed(
        reply,
        recent_assistant,
        user_text=user_text,
        memory_op=memory_op,
    )
    return _finalize_memory_reply(
        reply,
        user_text=user_text,
        memory_op=memory_op,
        memory_notes=memory_notes or [],
    )


@app.get("/api/health")
async def health() -> dict[str, Any]:
    settings = db.load_settings()
    try:
        model, used_fallback, names, routing_mode = await _resolve_runtime_model(settings)
        return {
            "ok": True,
            "ollama": True,
            "version": APP_VERSION,
            "configured_model": settings.get("model_default") or settings.get("model"),
            "model_heavy": settings.get("model_heavy"),
            "fallback_model": settings.get("fallback_model"),
            "routing_mode": routing_mode,
            "research_opt_in": bool(settings.get("research_opt_in", False)),
            "model": model,
            "using_fallback": used_fallback,
            "model_ready": True,
            "models": names,
            "memory_count": len(db.list_memory_items(limit=500)),
            "warning": (
                f"Fallback aktiv ({model}). Für beste Qualität: ollama pull {settings.get('model')}"
                if used_fallback
                else None
            ),
        }
    except OllamaError as exc:
        return {
            "ok": False,
            "ollama": False,
            "version": APP_VERSION,
            "configured_model": settings.get("model_default") or settings.get("model"),
            "fallback_model": settings.get("fallback_model"),
            "routing_mode": settings.get("routing_mode", "auto"),
            "research_opt_in": bool(settings.get("research_opt_in", False)),
            "model": settings.get("model"),
            "using_fallback": False,
            "model_ready": False,
            "memory_count": len(db.list_memory_items(limit=500)),
            "error": str(exc),
        }


@app.get("/api/memory")
def api_list_memory(
    category: str | None = Query(default=None),
) -> list[dict[str, Any]]:
    if category and category not in {"pref", "fact", "open_loop", "boundary"}:
        raise HTTPException(status_code=400, detail="Ungültige Kategorie.")
    return db.list_memory_items(limit=200, category=category, include_expired=True)


@app.post("/api/memory")
def api_create_memory(body: MemoryCreateBody) -> dict[str, Any]:
    return db.upsert_memory_item(
        key=body.key,
        value=body.value,
        category=body.category,
        confidence=1.0,
    )


@app.delete("/api/memory/{item_id}")
def api_delete_memory(item_id: str) -> dict[str, Any]:
    ok = db.delete_memory_item(item_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Memory-Eintrag nicht gefunden.")
    return {"ok": True, "id": item_id}


@app.delete("/api/memory")
def api_clear_memory() -> dict[str, Any]:
    n = db.clear_all_memory()
    return {"ok": True, "deleted": n}


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


@app.delete("/api/conversations/{conversation_id}")
def api_delete_conversation(conversation_id: str) -> dict[str, Any]:
    ok = db.delete_conversation(conversation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Gespräch nicht gefunden.")
    return {"ok": True, "id": conversation_id}


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
    recent = db.recent_assistant_texts(conversation_id)
    user_msg = db.add_message(conversation_id, "user", content)
    db.maybe_set_title_from_first_message(conversation_id, content)

    system, llm_messages, mem_notes, mem_op, route_dbg, policy = _prepare_chat_context(
        conversation_id=conversation_id,
        user_text=content,
        settings=settings,
        persona=persona,
    )
    settings = policy_mod.apply_sampling_overrides(settings, policy)

    try:
        model, used_fallback, _names, routing_mode = await _resolve_runtime_model(
            settings, prefer_heavy=policy.prefer_heavy
        )
        reply = await _generate_reply(
            settings=settings,
            system=system,
            model=model,
            llm_messages=llm_messages,
            recent_assistant=recent,
            user_text=content,
            memory_op=mem_op,
            memory_notes=mem_notes,
        )
    except OllamaError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    assistant_msg = db.add_message(conversation_id, "assistant", reply)
    try:
        await _maybe_refresh_summary(
            conversation_id=conversation_id,
            settings=settings,
            model=model,
        )
    except Exception:
        pass
    updated = db.get_conversation(conversation_id)
    return {
        "conversation": updated,
        "user_message": user_msg,
        "assistant_message": assistant_msg,
        "model": model,
        "using_fallback": used_fallback,
        "routing_mode": routing_mode,
        "guarded": is_guarded_canned(reply),
        "memory_notes": mem_notes,
        "memory_op": mem_op,
        "route": route_dbg,
    }


@app.post("/api/conversations/{conversation_id}/chat/stream")
async def api_chat_stream(conversation_id: str, body: ChatBody) -> StreamingResponse:
    conv = db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Gespräch nicht gefunden.")

    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Leere Nachricht.")

    settings = db.load_settings()
    persona = db.load_persona()
    recent = db.recent_assistant_texts(conversation_id)
    user_msg = db.add_message(conversation_id, "user", content)
    db.maybe_set_title_from_first_message(conversation_id, content)

    system, llm_messages, mem_notes, mem_op, route_dbg, policy = _prepare_chat_context(
        conversation_id=conversation_id,
        user_text=content,
        settings=settings,
        persona=persona,
    )
    settings = policy_mod.apply_sampling_overrides(settings, policy)

    try:
        model, used_fallback, _names, routing_mode = await _resolve_runtime_model(
            settings, prefer_heavy=policy.prefer_heavy
        )
    except OllamaError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    kwargs = _completion_kwargs(settings, model, system)
    retries = int(settings.get("guard_max_retries", 2))

    async def event_gen() -> AsyncIterator[str]:
        def sse(payload: dict[str, Any]) -> str:
            return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

        yield sse(
            {
                "type": "meta",
                "user_message": user_msg,
                "model": model,
                "using_fallback": used_fallback,
                "routing_mode": routing_mode,
                "memory_notes": mem_notes,
                "memory_op": mem_op,
                "route": route_dbg,
            }
        )

        messages_for_model = llm_messages
        final = ""
        attempt = 0
        nudge = _regen_nudge_for(content, mem_op)
        while True:
            acc: list[str] = []
            try:
                async for piece in chat_completion_stream(
                    **kwargs, messages=messages_for_model
                ):
                    acc.append(piece)
                    yield sse({"type": "token", "content": piece, "attempt": attempt})
            except OllamaError as exc:
                yield sse({"type": "error", "detail": str(exc)})
                return

            candidate = "".join(acc).strip()
            if not needs_retry(candidate, recent) or attempt >= retries:
                final = force_strict_refuse_if_needed(
                    candidate,
                    recent,
                    user_text=content,
                    memory_op=mem_op,
                )
                final = _finalize_memory_reply(
                    final,
                    user_text=content,
                    memory_op=mem_op,
                    memory_notes=mem_notes,
                )
                if final != candidate:
                    yield sse({"type": "replace", "content": final})
                break

            attempt += 1
            yield sse({"type": "retry", "attempt": attempt})
            messages_for_model = [*llm_messages, {"role": "user", "content": nudge}]

        saved = db.add_message(conversation_id, "assistant", final)
        try:
            await _maybe_refresh_summary(
                conversation_id=conversation_id,
                settings=settings,
                model=model,
            )
        except Exception:
            pass
        updated = db.get_conversation(conversation_id)
        yield sse(
            {
                "type": "done",
                "assistant_message": saved,
                "conversation": updated,
                "guarded": is_guarded_canned(final),
                "memory_op": mem_op,
                "route": route_dbg,
            }
        )

    return StreamingResponse(event_gen(), media_type="text/event-stream")
