"""Persisted, sanitized plugin settings (specs/004)."""
import json
import os
from typing import Any, Dict

INTERVALS = (500, 1000, 2000, 5000)
GROUPS = ("cpu", "gpu", "mem", "battery", "fan")

DEFAULTS: Dict[str, Any] = {
    "interval_ms": 1000,
    "show": {g: True for g in GROUPS},
    "auto_check": True,
    "test_channel": False,
}


def sanitize(raw: Any) -> Dict[str, Any]:
    out = json.loads(json.dumps(DEFAULTS))
    if not isinstance(raw, dict):
        return out
    if raw.get("interval_ms") in INTERVALS:
        out["interval_ms"] = raw["interval_ms"]
    if isinstance(raw.get("test_channel"), bool):
        out["test_channel"] = raw["test_channel"]
    if isinstance(raw.get("auto_check"), bool):
        out["auto_check"] = raw["auto_check"]
    show = raw.get("show")
    if isinstance(show, dict):
        for g in GROUPS:
            if isinstance(show.get(g), bool):
                out["show"][g] = show[g]
    return out


def load(path: str) -> Dict[str, Any]:
    try:
        with open(path) as f:
            return sanitize(json.load(f))
    except (OSError, ValueError):
        return sanitize(None)


def save(path: str, data: Any) -> Dict[str, Any]:
    clean = sanitize(data)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(clean, f)
    os.replace(tmp, path)
    return clean
