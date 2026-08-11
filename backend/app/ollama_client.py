from __future__ import annotations

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
    """Return (model_name, using_fallback)."""
    preferred = settings.get("model", "")
    fallback = settings.get("fallback_model", "")
    if preferred and model_is_available(preferred, model_names):
        return preferred, False
    if fallback and model_is_available(fallback, model_names):
        return fallback, True
    return preferred or fallback or "unknown", False


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
) -> str:
    payload = {
        "model": model,
        "stream": False,
        "options": {
            "temperature": temperature,
            "top_p": top_p,
            "num_predict": num_predict,
            "repeat_penalty": repeat_penalty,
        },
        "messages": [{"role": "system", "content": system}, *messages],
    }
    url = f"{base_url.rstrip('/')}/api/chat"
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 404:
                raise OllamaError(
                    f"Modell „{model}“ nicht gefunden. "
                    f"Bitte ausführen: ollama pull {model}",
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
            "Ollama ist nicht erreichbar oder die Anfrage ist fehlgeschlagen."
        ) from exc
