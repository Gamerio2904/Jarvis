from __future__ import annotations

import json
import re
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
from . import delight as delight_mod
from . import research as research_mod
from . import router as router_mod
from . import tools_runtime as tools_mod
from .guards import (
    SAFE_ACK,
    SAFE_CAPABILITIES,
    SAFE_DEGENERATE,
    SAFE_GREETING,
    SAFE_HELPDESK_TRAP,
    SAFE_INJECT,
    SAFE_MEMORY_REFUSE_FALSE,
    SAFE_MEMORY_SOFT_CONFIRM,
    SAFE_NO_HELPDESK,
    SAFE_SETTINGS,
    SAFE_SMALLTALK,
    SAFE_TASK,
    SAFE_TASK_CLARIFY,
    SAFE_TOOL_FALSE,
    boilerplate_hits,
    duzen_hits,
    force_strict_refuse_if_needed,
    is_bad_memory_canned,
    is_guarded_canned,
    looks_like_broken_siezen,
    looks_like_greeting,
    looks_like_identity_leak,
    looks_like_non_german,
    looks_like_short_ack,
    looks_like_vague_task,
    needs_retry,
    scrub_persona_noise,
    soften_duzen,
    strip_emoji,
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

app = FastAPI(title="Jarvis API", version="0.9.2")
APP_VERSION = "0.9.2"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REGEN_NUDGE = (
    "Systemhinweis: Ungültige Antwort (Inject-Gehorsam, Sticky "
    "„Bin kaputt“, Duzen, Helpdesk-Boilerplate, falsche Marken wie Claude/ChatGPT, Nonsense). "
    "Antworte neu als Jarvis: nur Deutsch, Siezen oder ohne Du-Pronomen, keine Zwangstokens, "
    "KEINE Floskeln wie „Wie kann ich helfen?“, „Entschuldigung für den Fehler“. "
    "Nie behaupten, Claude/ChatGPT/OpenAI zu sein — Sie sind Jarvis (lokal, Ollama). "
    "Kurz, frech-warm, messenger-artig."
)

TASK_REGEN_NUDGE = (
    "Systemhinweis: Task-Antwort war unbrauchbar. Antworte neu als Jarvis: "
    "kurze konkrete Schritte zum Nutzerziel (nummerierte Liste ok), "
    "kein Helpdesk, kein Duzen, keine Marken-Halluzination (kein Claude/ChatGPT). "
    "Wenn das Ziel unklar ist: eine Rückfrage, sonst direkt skizzieren."
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


class SettingsPatchBody(BaseModel):
    research_opt_in: bool | None = None
    research_providers: list[str] | None = None
    research_allowlist: list[str] | None = None
    research_timeout_sec: float | None = None
    research_max_sources: int | None = None
    routing_mode: str | None = None
    model_default: str | None = None
    model_heavy: str | None = None
    fallback_model: str | None = None
    delight_moments: bool | None = None
    delight_moments_per_day: int | None = None
    delight_jokes: bool | None = None
    delight_joke_frequency: str | None = None
    easter_eggs_enabled: bool | None = None
    ui_sounds: bool | None = None
    ui_sound_volume: str | None = None


@app.on_event("startup")
def on_startup() -> None:
    db.init_db()
    try:
        memory_mod.purge_garbage_soft_memory()
    except Exception:
        pass


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


def _regen_nudge_for(
    user_text: str,
    memory_op: str | None = None,
    *,
    intent: str | None = None,
) -> str:
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
    if intent == "task":
        return TASK_REGEN_NUDGE
    return REGEN_NUDGE


def _settings_fact_reply(user_text: str, settings: dict[str, Any]) -> str | None:
    """Deterministic meta answers (Sprint 19 Q4/Q8) — no LLM drift."""
    t = (user_text or "").strip()
    if not t:
        return None
    low = t.lower()
    model = settings.get("model_default") or settings.get("model") or "unbekannt"
    opt_in = bool(settings.get("research_opt_in", False))

    if re.search(r"(?is)welches\s+modell|welche[sn]?\s+model|was\s+für\s+(?:ein\s+)?modell", t):
        return (
            f"Jarvis, lokal über Ollama — konfiguriertes Modell: {model}. "
            "Kein Cloud-Chatbot, kein Claude/ChatGPT."
        )
    if re.search(r"(?is)welche\s+version|version\s+bist|welche\s+build", t):
        return f"Version {APP_VERSION} — lokal, privat. Weiter?"
    if re.search(r"(?is)hast\s+(?:du|sie)\s+internet|internetzugang|online\s+(?:zugriff|zugang)", t):
        if opt_in:
            return (
                "Research-Opt-in ist an — Allowlist-Suche mit Quellen möglich. "
                "Sonst nur lokales Wissen."
            )
        return (
            "Standard: kein freies Netz. Research-Opt-in in den Settings einschalten, "
            "dann Allowlist-Suche mit Quellen — sonst nur lokal."
        )
    if re.search(
        r"(?is)wie\s+schalte\s+ich\s+research|research\s+ein|forschung\s+ein|opt[\-\s]?in",
        t,
    ):
        return (
            "Settings → Forschung → Research-Opt-in an. "
            "Dann z.B. „Recherchiere …“ — Antworten nur mit Quellen, sonst Refuse."
        )
    if re.search(r"(?is)was\s+kannst\s+(?:du|sie)(?:\s+alles)?|was\s+geht\s*\??\s*$|fähigkeiten|/hilfe", t):
        return delight_mod.capabilities_card()
    if "einstellung" in low or low.startswith("/"):
        return None
    return None


def _prepare_chat_context(
    *,
    conversation_id: str,
    user_text: str,
    settings: dict[str, Any],
    persona: str,
) -> tuple[
    str,
    list[dict[str, str]],
    list[str],
    str,
    dict[str, Any],
    policy_mod.Policy,
    research_mod.ResearchPack | None,
]:
    """Returns system, messages, notes, memory_op, route_debug, policy, research_pack."""
    # Sprint 27 F3: clarify follow-up → force task
    pending_clarify = False
    hist = db.list_messages(conversation_id)
    for m in reversed(hist):
        if m.get("role") == "assistant":
            meta = m.get("meta") or {}
            content_a = (m.get("content") or "").strip()
            if meta.get("pending_clarify") or content_a == SAFE_TASK_CLARIFY:
                pending_clarify = True
            break

    route = router_mod.classify(
        user_text,
        research_opt_in=bool(settings.get("research_opt_in", False)),
    )
    if (
        pending_clarify
        and route.intent in {"smalltalk", "task"}
        and route.memory_sub == "none"
        and getattr(route, "tool_sub", "none") == "none"
        and not looks_like_greeting(user_text)
    ):
        route = router_mod.RouteResult(
            "task", "none", "clarify_followup", tool_sub="none"
        )
    policy = policy_mod.get_policy(route.policy_key)

    research_pack: research_mod.ResearchPack | None = None
    if route.intent == "research":
        research_pack = research_mod.retrieve(user_text, settings)

    mem_op, notes = memory_mod.apply_explicit_memory_commands(
        user_text, conversation_id=conversation_id
    )
    # Sprint 24 E5: soft-reject after soft-confirm
    if mem_op == "none" and memory_mod.looks_like_soft_reject(user_text):
        reject_notes = memory_mod.reject_recent_soft_facts(conversation_id=conversation_id)
        mem_op = "soft_reject"
        notes = reject_notes

    # Soft-harvest only outside explicit memory ops / non-memory smalltalk
    soft_notes = memory_mod.harvest_soft_facts(
        user_text,
        conversation_id=conversation_id,
        skip=mem_op != "none"
        or bool(notes)
        or route.intent in {"inject", "tool"}
        or bool(db.get_tool_pending(conversation_id)),
        confidence=float(settings.get("soft_harvest_confidence", 0.55)),
        ttl_days=float(settings.get("soft_harvest_ttl_days", 14)),
    )
    if soft_notes and mem_op == "none":
        mem_op = "soft_confirm"
        notes = [*notes, *soft_notes]

    mem_limit = int(settings.get("memory_retrieve_limit", 8))
    # Smalltalk / inject / research: no ambient memory leak
    allow_retrieve = route.intent not in {
        "smalltalk",
        "inject",
        "helpdesk_trap",
        "research",
    }
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

    # Recall when router says so — even if retrieve empty (Sprint 20 R2)
    if mem_op == "none" and (
        route.memory_sub == "memory.recall"
        or memory_mod.looks_like_recall_question(user_text)
    ):
        mem_op = "recall"
        if items:
            # Sprint 26 P3: identity questions → at most one Recall note
            cap = 1 if memory_mod.looks_like_identity_question(user_text) else 4
            notes = [f"Recall: {it['key']} = {it['value']}" for it in items[:cap]]
        else:
            notes = ["Recall: (nichts Passendes gefunden)"]
    elif mem_op == "none" and items and route.memory_sub == "memory.recall":
        mem_op = "recall"
        cap = 1 if memory_mod.looks_like_identity_question(user_text) else 4
        notes = [f"Recall: {it['key']} = {it['value']}" for it in items[:cap]]

    if research_pack and research_pack.status == "blocked":
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
    if research_pack and research_pack.status == "ok" and research_pack.sources:
        system = system.rstrip() + "\n\n" + research_mod.research_system_nudge(research_pack)

    history = db.list_messages(conversation_id)
    last_k = int(settings.get("context_last_k", 16))
    max_ctx = int(settings.get("max_context_messages", last_k))
    llm_messages = ctx.pack_messages(history, last_k=min(last_k, max_ctx))
    return (
        system,
        llm_messages,
        notes,
        mem_op,
        router_mod.route_debug_dict(route),
        policy,
        research_pack,
    )


def _finalize_turn_reply(
    reply: str,
    *,
    user_text: str,
    memory_op: str,
    memory_notes: list[str],
    intent: str | None = None,
) -> str:
    """Post-process: memory honesty + intent fallbacks + persona polish."""
    if memory_op == "write":
        if is_bad_memory_canned(reply) or reply.strip() in {
            SAFE_DEGENERATE,
            SAFE_NO_HELPDESK,
            "Notiert. Was sonst?",
        }:
            return memory_mod.ack_reply_for_write(memory_notes)
        return reply
    if memory_op in {"forget", "forget_all"}:
        # Sprint 24 E3: always force clear forget wording
        return memory_mod.ack_reply_for_forget(memory_op, memory_notes)
    if memory_op == "soft_reject":
        return memory_mod.ack_reply_for_soft_reject(memory_notes)
    if memory_op == "recall":
        # Sprint 26 P9: try soften first; if still broken → deterministic ack
        if duzen_hits(reply) or looks_like_broken_siezen(reply):
            softened = soften_duzen(reply)
            if not duzen_hits(softened) and not looks_like_broken_siezen(softened):
                reply = softened
            else:
                return memory_mod.ack_reply_for_recall(memory_notes)
        if (
            is_bad_memory_canned(reply)
            or looks_like_broken_siezen(reply)
            or reply.strip() in {
                SAFE_DEGENERATE,
                SAFE_NO_HELPDESK,
                "Dazu habe ich etwas notiert — welche Detailfrage genau?",
            }
        ):
            return memory_mod.ack_reply_for_recall(memory_notes)
        # S4: drop helpdesk-ish tails on recall
        if boilerplate_hits(reply):
            return memory_mod.ack_reply_for_recall(memory_notes)
        return reply
    if memory_op == "soft_confirm":
        if is_bad_memory_canned(reply) or "merken" not in reply.lower():
            # Build confirm from soft notes
            soft = [n.split("=", 1)[-1].strip() for n in memory_notes if n.startswith("Soft:")]
            if soft:
                return f"Kurz notiert (TTL): {soft[0]}. So merken?"
            return SAFE_MEMORY_SOFT_CONFIRM
        return strip_emoji(reply)
    if memory_op == "clarify":
        cleaned = strip_emoji(reply)
        if is_bad_memory_canned(cleaned) or cleaned.strip() in {
            SAFE_DEGENERATE,
            SAFE_NO_HELPDESK,
            "Korrigiert. So merken?",
        }:
            return memory_mod.ack_reply_for_clarify(memory_notes)
        if "?" not in cleaned:
            return memory_mod.ack_reply_for_clarify(memory_notes)
        return cleaned
    # Research without opt-in: always refuse net claims.
    if any("Research ohne Opt-in" in n for n in memory_notes):
        return research_mod.SAFE_RESEARCH_OFF
    # Weak / unclear remember → never false-confirm; keep wording contract (0.7.1)
    if any("Nichts gespeichert" in n for n in memory_notes):
        low = reply.lower()
        if (
            memory_mod.looks_like_false_memory_confirm(reply)
            or is_bad_memory_canned(reply)
            or (
                "nicht gespeichert" not in low
                and "merk dir" not in low
                and "nichts gespeichert" not in low
            )
        ):
            return SAFE_MEMORY_REFUSE_FALSE
    if memory_mod.looks_like_remember_intent(
        user_text
    ) and memory_mod.looks_like_false_memory_confirm(reply):
        return SAFE_MEMORY_REFUSE_FALSE
    # F4: never leave Aussetzer on settings / helpdesk / task
    if reply.strip() == SAFE_DEGENERATE:
        if intent == "settings":
            return SAFE_SETTINGS
        if intent == "helpdesk_trap":
            return SAFE_HELPDESK_TRAP
        if intent == "task":
            return SAFE_TASK
        if intent == "inject":
            return SAFE_INJECT
    # Sprint 26 P4: CJK/planish task must not stick on SAFE_SMALLTALK
    if intent == "task" and reply.strip() == SAFE_SMALLTALK and looks_like_non_german(user_text):
        return SAFE_TASK
    # Sprint 29 H1: no fake tool success claims without execute
    # Skip memory ops — "notiert" there is intentional (SAFE_MEMORY_ACK etc.)
    if (
        tools_mod.looks_like_false_tool_claim(reply)
        and memory_op
        not in {
            "tool_executed",
            "write",
            "soft_confirm",
            "recall",
            "clarify",
            "forget",
            "forget_all",
            "soft_reject",
        }
        and (intent or "") != "memory"
    ):
        # Allow only when reply already came from tool runtime (starts with known prefixes)
        if not re.match(
            r"(?i)^(Notiz gespeichert:|Todo gespeichert:|Todo „|Todo erledigt:|"
            r"Offene Todos:|Erledigte Todos:|Alle Todos:|Todos zu|Notizen:|Keine )",
            reply.strip(),
        ):
            return SAFE_TOOL_FALSE
    # Sprint 29: short user acks should not become vague SAFE_SMALLTALK hammer
    if intent == "smalltalk" and looks_like_short_ack(user_text) and reply.strip() == SAFE_SMALLTALK:
        return SAFE_ACK
    # Sprint 27 F1: always scrub Master/Sir
    return scrub_persona_noise(reply)


def _research_public(
    pack: research_mod.ResearchPack | None,
    *,
    audit_id: str | None = None,
) -> dict[str, Any] | None:
    if pack is None:
        return None
    data = pack.to_public()
    if audit_id:
        data["audit_id"] = audit_id
    return data


def _persist_research_audit(
    *,
    pack: research_mod.ResearchPack,
    conversation_id: str,
    message_id: str | None,
) -> dict[str, Any]:
    return db.add_research_audit(
        conversation_id=conversation_id,
        message_id=message_id,
        query=pack.query,
        status=pack.status,
        sources=[s.to_dict() for s in pack.sources],
        error=pack.error,
    )


async def _resolve_research_reply(
    *,
    pack: research_mod.ResearchPack,
    settings: dict[str, Any],
    system: str,
    model: str,
    llm_messages: list[dict[str, str]],
    recent_assistant: list[str],
    user_text: str,
) -> str:
    """Citation-required research reply; refuse without sources; no LLM when empty."""
    if pack.status == "blocked":
        return research_mod.SAFE_RESEARCH_OFF
    if pack.status != "ok" or not pack.sources:
        return research_mod.synthesize_from_snippets(pack)

    base = research_mod.synthesize_from_snippets(pack)
    providers = [str(p).lower() for p in (settings.get("research_providers") or [])]
    # Offline/mock providers: deterministic citations only (eval-stable, no LLM drift)
    if providers and all(p in {"mock", "empty"} for p in providers):
        return base

    try:
        kwargs = _completion_kwargs(settings, model, system)
        reply = await chat_completion(**kwargs, messages=llm_messages)
        reply = force_strict_refuse_if_needed(
            reply,
            recent_assistant,
            user_text=user_text,
            intent="research",
        )
        return research_mod.finalize_research_reply(reply, pack)
    except OllamaError:
        return base


# Back-compat alias used in stream path historically
_finalize_memory_reply = _finalize_turn_reply


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


def _resolve_tool_turn(
    *,
    conversation_id: str,
    user_text: str,
    intent: str | None,
) -> tuple[str | None, dict[str, Any] | None]:
    """Sprint 28/29: confirm-before-write tools. Returns (reply, tool_meta) or (None, None)."""
    # H4: inject never runs tools / never confirms pending
    if intent == "inject":
        pending = db.get_tool_pending(conversation_id)
        if pending:
            db.clear_tool_pending(conversation_id)
            db.add_tool_audit(
                conversation_id=conversation_id,
                tool=str(pending.get("tool") or ""),
                action=str(pending.get("action") or ""),
                args=pending.get("args") or {},
                status="aborted",
                result={"ok": False, "aborted": True, "reason": "inject"},
            )
        return None, None

    pending = db.get_tool_pending(conversation_id)
    if pending and tools_mod.pending_is_expired(pending):
        db.clear_tool_pending(conversation_id)
        db.add_tool_audit(
            conversation_id=conversation_id,
            tool=str(pending.get("tool") or ""),
            action=str(pending.get("action") or ""),
            args=pending.get("args") or {},
            status="timeout",
            result={"ok": False, "timeout": True},
        )
        pending = None

    if pending:
        if memory_mod.looks_like_soft_reject(user_text):
            db.clear_tool_pending(conversation_id)
            db.add_tool_audit(
                conversation_id=conversation_id,
                tool=str(pending.get("tool") or ""),
                action=str(pending.get("action") or ""),
                args=pending.get("args") or {},
                status="aborted",
                result={"ok": False, "aborted": True},
            )
            return "Alles klar — nicht gespeichert.", {
                "tool_status": "aborted",
                "label": tools_mod.tool_status_label("aborted"),
            }
        if tools_mod.looks_like_tool_confirm(user_text):
            prop = tools_mod.ToolProposal(
                tool=pending["tool"],  # type: ignore[arg-type]
                action=pending["action"],  # type: ignore[arg-type]
                args=pending.get("args") or {},
                needs_confirm=False,
                preview=str(pending.get("preview") or ""),
            )
            reply, result = tools_mod.execute(prop, conversation_id=conversation_id)
            db.clear_tool_pending(conversation_id)
            return scrub_persona_noise(reply), {
                "tool_status": "executed",
                "tool": prop.tool,
                "action": prop.action,
                "result": result,
                "label": tools_mod.tool_status_label("executed"),
            }
        # Pending but unclear → re-ask
        return f"{pending.get('preview', 'Aktion')}. So speichern?", {
            "tool_status": "pending",
            "preview": pending.get("preview"),
            "label": tools_mod.tool_status_label("pending"),
        }

    if intent != "tool":
        return None, None

    prop = tools_mod.parse_tool_request(user_text)
    if not prop:
        return (
            "Kurz: Notiz mit „Notiere: …“, Todo mit „Todo: …“ — Speichern erst nach Confirm. "
            "Liste → „Erledige das erste“ ohne neue Confirm.",
            {"tool_status": "parse_miss"},
        )

    # Sprint 30 P1: resolve ordinal/anaphora from last list
    if prop.action == "done" and prop.args.get("continuity"):
        cont_err = tools_mod.resolve_continuity_title(
            prop, conversation_id=conversation_id
        )
        if cont_err:
            return cont_err, {"tool_status": "error", "error": cont_err}

    err = tools_mod.validate(prop)
    if err:
        return f"Tool abgelehnt: {err}", {"tool_status": "error", "error": err}

    # H7: duplicate open todo → no pending spam
    if prop.tool == "todo" and prop.action == "create":
        existing = db.find_open_todo_by_title(str(prop.args.get("title") or ""))
        if existing:
            return (
                f"Todo „{existing['title']}“ ist schon offen — nichts Neues. "
                "Liste: „Offene Todos?“ · erledigen: „Erledige: …“ / „Erledige das erste“.",
                {
                    "tool_status": "duplicate",
                    "tool": "todo",
                    "action": "create",
                    "result": {"ok": True, "duplicate": True, "id": existing["id"]},
                },
            )

    if prop.needs_confirm:
        db.set_tool_pending(
            conversation_id,
            tool=prop.tool,
            action=prop.action,
            args=prop.args,
            preview=prop.preview,
        )
        return scrub_persona_noise(tools_mod.confirm_prompt(prop)), {
            "tool_status": "pending",
            "tool": prop.tool,
            "action": prop.action,
            "preview": prop.preview,
            "label": tools_mod.tool_status_label("pending"),
        }

    reply, result = tools_mod.execute(prop, conversation_id=conversation_id)
    return scrub_persona_noise(reply), {
        "tool_status": "executed",
        "tool": prop.tool,
        "action": prop.action,
        "result": result,
        "label": tools_mod.tool_status_label("executed"),
    }


def _last_was_pending_clarify(conversation_id: str) -> bool:
    hist = db.list_messages(conversation_id)
    for m in reversed(hist):
        if m.get("role") == "assistant":
            meta = m.get("meta") or {}
            content_a = (m.get("content") or "").strip()
            return bool(meta.get("pending_clarify") or content_a == SAFE_TASK_CLARIFY)
    return False


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
    intent: str | None = None,
) -> str:
    # F2: inject turns — deterministic DE canned, skip LLM drift/EN-helpdesk
    if intent == "inject":
        return SAFE_INJECT

    # Q4/Q8 + R6: settings / capabilities facts without LLM drift
    if intent in {"settings", "helpdesk_trap"}:
        fact = _settings_fact_reply(user_text, settings)
        if fact:
            return fact
        if intent == "helpdesk_trap":
            return SAFE_CAPABILITIES

    # Soft-confirm after soft harvest — skip LLM waffle
    if memory_op == "soft_confirm":
        soft = [n.split("=", 1)[-1].strip() for n in (memory_notes or []) if n.startswith("Soft:")]
        if soft:
            return f"Kurz notiert (TTL): {soft[0]}. So merken?"
        return SAFE_MEMORY_SOFT_CONFIRM

    if memory_op == "soft_reject":
        return memory_mod.ack_reply_for_soft_reject(memory_notes or [])

    if memory_op in {"forget", "forget_all"}:
        return memory_mod.ack_reply_for_forget(memory_op, memory_notes or [])

    # Sprint 29: short acks → deterministic, avoid SAFE_SMALLTALK chaos
    if intent == "smalltalk" and looks_like_short_ack(user_text) and not looks_like_greeting(user_text):
        return SAFE_ACK

    # Sprint 22 A1: vague tasks → clarify-first (skip if follow-up after clarify)
    if intent == "task" and looks_like_vague_task(user_text):
        # continuity handled by caller via route reason clarify_followup
        return SAFE_TASK_CLARIFY

    # Sprint 24 E2: greetings — prefer greeting canned over SAFE_SMALLTALK hammer later
    greeting_turn = looks_like_greeting(user_text)

    kwargs = _completion_kwargs(settings, model, system)
    # Sprint 21 D5: fewer retries on smalltalk
    default_retries = 1 if intent in {"smalltalk", "helpdesk_trap"} else 2
    retries = int(settings.get("guard_max_retries", default_retries))
    if intent in {"smalltalk", "helpdesk_trap"}:
        retries = min(retries, 1)
    # Extra retry budget when residual broken Siezen likely (Sprint 24 E4)
    if intent in {"smalltalk", "memory", "task"}:
        retries = max(retries, 1)

    reply = await chat_completion(**kwargs, messages=llm_messages)
    attempt = 0
    nudge = _regen_nudge_for(user_text, memory_op, intent=intent)
    while (
        needs_retry(reply, recent_assistant, intent=intent, memory_op=memory_op)
        and attempt < retries
    ):
        attempt += 1
        regen_messages = [*llm_messages, {"role": "user", "content": nudge}]
        reply = await chat_completion(**kwargs, messages=regen_messages)
    reply = force_strict_refuse_if_needed(
        reply,
        recent_assistant,
        user_text=user_text,
        memory_op=memory_op,
        intent=intent,
    )
    if looks_like_broken_siezen(reply):
        reply = force_strict_refuse_if_needed(
            reply,
            recent_assistant,
            user_text=user_text,
            memory_op=(memory_op or "recall") if intent == "memory" else memory_op,
            intent=intent,
        )
    if greeting_turn and reply.strip() in {SAFE_SMALLTALK, SAFE_NO_HELPDESK}:
        reply = SAFE_GREETING
    if looks_like_identity_leak(reply):
        fact = _settings_fact_reply(user_text, settings)
        if fact:
            return fact
        return SAFE_SETTINGS
    return _finalize_turn_reply(
        reply,
        user_text=user_text,
        memory_op=memory_op,
        memory_notes=memory_notes or [],
        intent=intent,
    )


@app.get("/api/health")
async def health() -> dict[str, Any]:
    settings = db.load_settings()
    try:
        model, used_fallback, names, routing_mode = await _resolve_runtime_model(settings)
        default = settings.get("model_default") or settings.get("model")
        heavy = settings.get("model_heavy") or default
        return {
            "ok": True,
            "ollama": True,
            "version": APP_VERSION,
            "configured_model": default,
            "model_heavy": heavy,
            "heavy_equals_default": str(heavy) == str(default),
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
                else (
                    "model_heavy entspricht model_default — Auto-Routing ändert das Modell nicht."
                    if str(heavy) == str(default)
                    else None
                )
            ),
        }
    except OllamaError as exc:
        default = settings.get("model_default") or settings.get("model")
        heavy = settings.get("model_heavy") or default
        return {
            "ok": False,
            "ollama": False,
            "version": APP_VERSION,
            "configured_model": default,
            "model_heavy": heavy,
            "heavy_equals_default": str(heavy) == str(default),
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
    if category and category not in {"pref", "fact", "open_loop", "boundary", "joke"}:
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


@app.get("/api/settings")
def api_get_settings() -> dict[str, Any]:
    s = db.load_settings()
    return {
        "research_opt_in": bool(s.get("research_opt_in", False)),
        "research_providers": list(s.get("research_providers") or []),
        "research_allowlist": list(s.get("research_allowlist") or []),
        "research_timeout_sec": float(s.get("research_timeout_sec", 8)),
        "research_max_sources": int(s.get("research_max_sources", 5)),
        "routing_mode": s.get("routing_mode", "auto"),
        "model_default": s.get("model_default") or s.get("model"),
        "model_heavy": s.get("model_heavy"),
        "fallback_model": s.get("fallback_model"),
        "delight_moments": bool(s.get("delight_moments", True)),
        "delight_moments_per_day": int(s.get("delight_moments_per_day", 2)),
        "delight_jokes": bool(s.get("delight_jokes", True)),
        "delight_joke_frequency": s.get("delight_joke_frequency", "selten"),
        "easter_eggs_enabled": bool(s.get("easter_eggs_enabled", True)),
        "ui_sounds": bool(s.get("ui_sounds", False)),
        "ui_sound_volume": s.get("ui_sound_volume", "low"),
        "easter_eggs": delight_mod.public_egg_list(),
        "version": APP_VERSION,
    }


@app.patch("/api/settings")
def api_patch_settings(body: SettingsPatchBody) -> dict[str, Any]:
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if not patch:
        return api_get_settings()
    db.save_settings(patch)
    return api_get_settings()


@app.get("/api/research/audits")
def api_list_research_audits(limit: int = Query(default=50, ge=1, le=200)) -> list[dict[str, Any]]:
    return db.list_research_audits(limit=limit)


@app.get("/api/research/audits/{audit_id}")
def api_get_research_audit(audit_id: str) -> dict[str, Any]:
    item = db.get_research_audit(audit_id)
    if not item:
        raise HTTPException(status_code=404, detail="Audit nicht gefunden.")
    return item


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



def _health_bits_for_eggs(settings: dict[str, Any], model: str | None = None) -> dict[str, Any]:
    return {
        "version": APP_VERSION,
        "model": model or settings.get("model"),
        "memory_count": len(db.list_memory_items(limit=500)),
        "research_opt_in": bool(settings.get("research_opt_in", False)),
    }


def _resolve_easter_egg_reply(
    content: str,
    *,
    settings: dict[str, Any],
    model: str | None = None,
    conversation_id: str | None = None,
) -> tuple[str | None, dict[str, Any] | None]:
    """Return (reply, delight_meta) if an easter egg handled the turn."""
    egg = delight_mod.handle_easter_egg(
        content,
        settings=settings,
        health_bits=_health_bits_for_eggs(settings, model),
        conversation_id=conversation_id,
    )
    if not egg.handled:
        return None, None
    if egg.reply == "__FORGET_JOKE__":
        jokes = db.list_memory_items(limit=20, category="joke", include_expired=True)
        mood = delight_mod.get_session_mood(conversation_id)
        if jokes:
            db.delete_memory_item(jokes[0]["id"])
            return "Witz-Pin ist weg.", {"egg": "vergissWitz", "mood": mood}
        return "Kein Joke-Pin vorhanden.", {"egg": "vergissWitz", "mood": mood}
    meta = {
        "egg": delight_mod.parse_egg_command(content),
        "mood": egg.mood or delight_mod.get_session_mood(conversation_id),
    }
    return egg.reply, meta


def _append_delight_flavor(
    reply: str,
    *,
    settings: dict[str, Any],
    intent: str | None,
    memory_op: str | None,
    conversation_id: str | None = None,
) -> tuple[str, dict[str, Any]]:
    delight: dict[str, Any] = {"mood": delight_mod.get_session_mood(conversation_id)}
    moment = delight_mod.maybe_moment(
        settings=settings,
        intent=intent,
        memory_op=memory_op,
        is_first_today=delight_mod.moments_used_today() == 0,
    )
    if moment:
        delight["moment"] = moment
        # Attach moment beat for light intents (inject stays pure SAFE_INJECT)
        if intent in {"smalltalk", "memory", "helpdesk_trap", None}:
            reply = f"{reply.rstrip()}\n\n{moment}"
    jokes = db.list_memory_items(limit=5, category="joke", include_expired=False)
    joke = delight_mod.maybe_inside_joke(
        settings=settings, intent=intent, joke_pins=jokes
    )
    if joke:
        delight["joke"] = joke
        if "moment" not in delight:
            reply = f"{reply.rstrip()}\n\n{joke}"
    return reply, delight

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

    (
        system,
        llm_messages,
        mem_notes,
        mem_op,
        route_dbg,
        policy,
        research_pack,
    ) = _prepare_chat_context(
        conversation_id=conversation_id,
        user_text=content,
        settings=settings,
        persona=persona,
    )
    settings = policy_mod.apply_sampling_overrides(settings, policy)

    delight_meta: dict[str, Any] | None = None
    msg_meta_early: dict[str, Any] = {}
    try:
        model, used_fallback, _names, routing_mode = await _resolve_runtime_model(
            settings, prefer_heavy=policy.prefer_heavy
        )
        egg_reply, egg_meta = _resolve_easter_egg_reply(
            content,
            settings=settings,
            model=model,
            conversation_id=conversation_id,
        )
        if egg_reply is not None:
            reply = egg_reply
            delight_meta = egg_meta
        elif research_pack is not None and route_dbg.get("intent") == "research":
            reply = await _resolve_research_reply(
                pack=research_pack,
                settings=settings,
                system=system,
                model=model,
                llm_messages=llm_messages,
                recent_assistant=recent,
                user_text=content,
            )
        else:
            tool_reply, tool_meta = _resolve_tool_turn(
                conversation_id=conversation_id,
                user_text=content,
                intent=route_dbg.get("intent"),
            )
            if tool_reply is not None:
                reply = tool_reply
                if tool_meta:
                    msg_meta_early = {"tool": tool_meta}
            else:
                reply = await _generate_reply(
                    settings=settings,
                    system=system,
                    model=model,
                    llm_messages=llm_messages,
                    recent_assistant=recent,
                    user_text=content,
                    memory_op=mem_op,
                    memory_notes=mem_notes,
                    intent=route_dbg.get("intent"),
                )
                reply, delight_meta = _append_delight_flavor(
                    reply,
                    settings=settings,
                    intent=route_dbg.get("intent"),
                    memory_op=mem_op,
                    conversation_id=conversation_id,
                )
    except OllamaError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    research_meta = None
    audit_id = None
    msg_meta: dict[str, Any] = dict(msg_meta_early)
    if research_pack is not None:
        research_meta = research_pack.to_public()
        msg_meta["research"] = research_meta
    if delight_meta:
        msg_meta["delight"] = delight_meta
    if reply.strip() == SAFE_TASK_CLARIFY:
        msg_meta["pending_clarify"] = True
    reply = scrub_persona_noise(reply)
    assistant_msg = db.add_message(
        conversation_id, "assistant", reply, meta=msg_meta or None
    )
    if research_pack is not None:
        audit = _persist_research_audit(
            pack=research_pack,
            conversation_id=conversation_id,
            message_id=assistant_msg["id"],
        )
        audit_id = audit["id"]
        if isinstance(msg_meta.get("research"), dict):
            msg_meta["research"]["audit_id"] = audit_id
            assistant_msg = {**assistant_msg, "meta": msg_meta}

    try:
        await _maybe_refresh_summary(
            conversation_id=conversation_id,
            settings=settings,
            model=model,
        )
    except Exception:
        pass
    updated = db.get_conversation(conversation_id)
    tool_out = msg_meta.get("tool") if isinstance(msg_meta.get("tool"), dict) else None
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
        "research": _research_public(research_pack, audit_id=audit_id),
        "delight": delight_meta,
        "tool": tool_out,
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

    (
        system,
        llm_messages,
        mem_notes,
        mem_op,
        route_dbg,
        policy,
        research_pack,
    ) = _prepare_chat_context(
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
    intent = route_dbg.get("intent")

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
                "research": _research_public(research_pack),
            }
        )

        egg_reply, egg_meta = _resolve_easter_egg_reply(
            content,
            settings=settings,
            model=model,
            conversation_id=conversation_id,
        )
        if egg_reply is not None:
            yield sse({"type": "replace", "content": egg_reply})
            saved = db.add_message(
                conversation_id,
                "assistant",
                egg_reply,
                meta={"delight": egg_meta} if egg_meta else None,
            )
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                    "delight": egg_meta,
                }
            )
            return

        if intent == "inject":
            final = SAFE_INJECT
            yield sse({"type": "replace", "content": final})
            saved = db.add_message(
                conversation_id,
                "assistant",
                final,
                meta={"delight": {"inject": True}},
            )
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                    "delight": {"inject": True},
                }
            )
            return

        if intent == "settings":
            fact = _settings_fact_reply(content, settings)
            if fact:
                yield sse({"type": "replace", "content": fact})
                saved = db.add_message(conversation_id, "assistant", fact)
                updated = db.get_conversation(conversation_id)
                yield sse(
                    {
                        "type": "done",
                        "assistant_message": saved,
                        "conversation": updated,
                        "guarded": True,
                        "memory_op": mem_op,
                        "route": route_dbg,
                    }
                )
                return

        if intent == "helpdesk_trap":
            final = _settings_fact_reply(content, settings) or SAFE_CAPABILITIES
            yield sse({"type": "replace", "content": final})
            saved = db.add_message(conversation_id, "assistant", final)
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                }
            )
            return

        if mem_op == "soft_confirm":
            soft = [n.split("=", 1)[-1].strip() for n in mem_notes if n.startswith("Soft:")]
            final = (
                f"Kurz notiert (TTL): {soft[0]}. So merken?"
                if soft
                else SAFE_MEMORY_SOFT_CONFIRM
            )
            yield sse({"type": "replace", "content": final})
            saved = db.add_message(conversation_id, "assistant", final)
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                }
            )
            return

        if mem_op == "soft_reject":
            final = memory_mod.ack_reply_for_soft_reject(mem_notes)
            yield sse({"type": "replace", "content": final})
            saved = db.add_message(conversation_id, "assistant", final)
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                }
            )
            return

        if mem_op in {"forget", "forget_all"}:
            final = memory_mod.ack_reply_for_forget(mem_op, mem_notes)
            yield sse({"type": "replace", "content": final})
            saved = db.add_message(conversation_id, "assistant", final)
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                }
            )
            return

        if intent == "smalltalk" and looks_like_short_ack(content) and not looks_like_greeting(content):
            final = SAFE_ACK
            yield sse({"type": "replace", "content": final})
            saved = db.add_message(conversation_id, "assistant", final)
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                }
            )
            return

        tool_reply, tool_meta = _resolve_tool_turn(
            conversation_id=conversation_id,
            user_text=content,
            intent=intent,
        )
        if tool_reply is not None:
            final = scrub_persona_noise(tool_reply)
            yield sse({"type": "replace", "content": final})
            saved = db.add_message(
                conversation_id,
                "assistant",
                final,
                meta={"tool": tool_meta} if tool_meta else None,
            )
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                    "tool": tool_meta,
                }
            )
            return

        if intent == "task" and looks_like_vague_task(content) and route_dbg.get("reason") != "clarify_followup":
            final = SAFE_TASK_CLARIFY
            yield sse({"type": "replace", "content": final})
            saved = db.add_message(
                conversation_id,
                "assistant",
                final,
                meta={"pending_clarify": True},
            )
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": True,
                    "memory_op": mem_op,
                    "route": route_dbg,
                }
            )
            return

        if intent == "research" and research_pack is not None:
            final = await _resolve_research_reply(
                pack=research_pack,
                settings=settings,
                system=system,
                model=model,
                llm_messages=llm_messages,
                recent_assistant=recent,
                user_text=content,
            )
            yield sse({"type": "replace", "content": final})
            research_meta = {"research": research_pack.to_public()}
            saved = db.add_message(
                conversation_id, "assistant", final, meta=research_meta
            )
            audit = _persist_research_audit(
                pack=research_pack,
                conversation_id=conversation_id,
                message_id=saved["id"],
            )
            research_meta["research"]["audit_id"] = audit["id"]
            saved = {**saved, "meta": research_meta}
            updated = db.get_conversation(conversation_id)
            yield sse(
                {
                    "type": "done",
                    "assistant_message": saved,
                    "conversation": updated,
                    "guarded": is_guarded_canned(final),
                    "memory_op": mem_op,
                    "route": route_dbg,
                    "research": _research_public(research_pack, audit_id=audit["id"]),
                }
            )
            return

        messages_for_model = llm_messages
        final = ""
        attempt = 0
        nudge = _regen_nudge_for(content, mem_op, intent=intent)
        max_retries = min(retries, 1) if intent in {"smalltalk", "helpdesk_trap"} else retries
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
            if (
                not needs_retry(candidate, recent, intent=intent, memory_op=mem_op)
                or attempt >= max_retries
            ):
                final = force_strict_refuse_if_needed(
                    candidate,
                    recent,
                    user_text=content,
                    memory_op=mem_op,
                    intent=intent,
                )
                if looks_like_identity_leak(final):
                    fact = _settings_fact_reply(content, settings)
                    final = fact or SAFE_SETTINGS
                else:
                    final = _finalize_turn_reply(
                        final,
                        user_text=content,
                        memory_op=mem_op,
                        memory_notes=mem_notes,
                        intent=intent,
                    )
                if final != candidate:
                    yield sse({"type": "replace", "content": final})
                break

            attempt += 1
            yield sse({"type": "retry", "attempt": attempt})
            messages_for_model = [*llm_messages, {"role": "user", "content": nudge}]

        if looks_like_greeting(content) and final.strip() in {SAFE_SMALLTALK, SAFE_NO_HELPDESK}:
            final = SAFE_GREETING
            yield sse({"type": "replace", "content": final})
        final = _finalize_turn_reply(
            final,
            user_text=content,
            memory_op=mem_op,
            memory_notes=mem_notes,
            intent=intent,
        )
        final = scrub_persona_noise(final)
        stream_meta: dict[str, Any] = {}
        if final.strip() == SAFE_TASK_CLARIFY:
            stream_meta["pending_clarify"] = True

        saved = db.add_message(
            conversation_id, "assistant", final, meta=stream_meta or None
        )
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
