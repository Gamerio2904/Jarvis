from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx


class OllamaError(Exception):
    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


async def check_ollama(base_url: str) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return {"ok": True, "models": resp.json().get("models", [])}
    except httpx.HTTPError as exc:
        raise OllamaError(
            "Ollama ist nicht erreichbar. Bitte `ollama serve` starten."
        ) from exc


def model_is_available(model: str, model_names: list[str]) -> bool:
    return any(
        model == name or name.startswith(model + ":") or model in name
        for name in model_names
    )


def resolve_model(settings: dict[str, Any], model_names: list[str]) -> tuple[str, bool]:
    preferred = settings.get("model_default") or settings.get("model", "")
    fallback = settings.get("fallback_model", "")
    if preferred and model_is_available(preferred, model_names):
        return preferred, False
    if fallback and model_is_available(fallback, model_names):
        return fallback, True
    return preferred or fallback or "unknown", False


def resolve_routed_model(
    settings: dict[str, Any],
    model_names: list[str],
    *,
    prefer_heavy: bool = False,
) -> tuple[str, bool, str]:
    """Resolve model with routing_mode. Returns (model, used_fallback, routing_mode)."""
    mode = str(settings.get("routing_mode", "auto"))
    default = settings.get("model_default") or settings.get("model", "")
    heavy = settings.get("model_heavy") or default
    fallback = settings.get("fallback_model", "")

    if mode == "always_heavy":
        preferred = heavy
    elif mode == "always_default":
        preferred = default
    else:
        preferred = heavy if prefer_heavy else default

    if preferred and model_is_available(preferred, model_names):
        return preferred, False, mode
    if default and model_is_available(default, model_names):
        return default, preferred != default, mode
    if fallback and model_is_available(fallback, model_names):
        return fallback, True, mode
    return preferred or default or fallback or "unknown", False, mode


def _options(
    temperature: float,
    top_p: float,
    num_predict: int,
    repeat_penalty: float,
    *,
    keep_alive: str | None = "10m",
) -> dict[str, Any]:
    opts: dict[str, Any] = {
        "temperature": temperature,
        "top_p": top_p,
        "num_predict": num_predict,
        "repeat_penalty": repeat_penalty,
    }
    return opts


async def chat_completion(
    *,
    base_url: str,
    model: str,
    system: str,
    messages: list[dict[str, str]],
    temperature: float,
    top_p: float,
    num_predict: int,
    repeat_penalty: float = 1.1,
    keep_alive: str | None = "10m",
) -> str:
    payload: dict[str, Any] = {
        "model": model,
        "stream": False,
        "options": _options(temperature, top_p, num_predict, repeat_penalty),
        "messages": [{"role": "system", "content": system}, *messages],
    }
    if keep_alive:
        payload["keep_alive"] = keep_alive
    url = f"{base_url.rstrip('/')}/api/chat"
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 404:
                raise OllamaError(
                    f"Modell „{model}“ ist nicht geladen. "
                    f"Bitte einmal herunterladen: ollama pull {model}",
                    status_code=404,
                )
            if resp.status_code >= 400:
                raise OllamaError(
                    f"Ollama-Fehler ({resp.status_code}): {resp.text[:300]}",
                    status_code=resp.status_code,
                )
            data = resp.json()
            content = (data.get("message") or {}).get("content", "").strip()
            if not content:
                raise OllamaError("Leere Antwort vom Modell.")
            return content
    except OllamaError:
        raise
    except httpx.HTTPError as exc:
        raise OllamaError(
            "Ollama ist nicht erreichbar oder die Anfrage ist fehlgeschlagen. "
            "WLAN/Dienst prüfen — oder Modell neu laden."
        ) from exc


async def chat_completion_stream(
    *,
    base_url: str,
    model: str,
    system: str,
    messages: list[dict[str, str]],
    temperature: float,
    top_p: float,
    num_predict: int,
    repeat_penalty: float = 1.1,
    keep_alive: str | None = "10m",
) -> AsyncIterator[str]:
    payload: dict[str, Any] = {
        "model": model,
        "stream": True,
        "options": _options(temperature, top_p, num_predict, repeat_penalty),
        "messages": [{"role": "system", "content": system}, *messages],
    }
    if keep_alive:
        payload["keep_alive"] = keep_alive
    url = f"{base_url.rstrip('/')}/api/chat"
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream("POST", url, json=payload) as resp:
                if resp.status_code == 404:
                    raise OllamaError(
                        f"Modell „{model}“ ist nicht geladen. "
                        f"Bitte einmal herunterladen: ollama pull {model}",
                        status_code=404,
                    )
                if resp.status_code >= 400:
                    body = (await resp.aread()).decode()[:300]
                    raise OllamaError(
                        f"Ollama-Fehler ({resp.status_code}): {body}",
                        status_code=resp.status_code,
                    )
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    piece = (data.get("message") or {}).get("content") or ""
                    if piece:
                        yield piece
                    if data.get("done"):
                        break
    except OllamaError:
        raise
    except httpx.HTTPError as exc:
        raise OllamaError(
            "Ollama ist nicht erreichbar oder die Anfrage ist fehlgeschlagen. "
            "WLAN/Dienst prüfen — oder Modell neu laden."
        ) from exc


async def warm_model(*, base_url: str, model: str) -> None:
    """Best-effort keep model resident to cut first-token latency."""
    url = f"{base_url.rstrip('/')}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            await client.post(
                url,
                json={
                    "model": model,
                    "prompt": "",
                    "keep_alive": "10m",
                    "stream": False,
                    "options": {"num_predict": 1},
                },
            )
    except httpx.HTTPError:
        return
