"""Persisted, sanitized plugin settings (specs/004)."""
import json
import os
from typing import Any, Dict

INTERVALS = (500, 1000, 2000, 5000)
POSITIONS = ("top-left", "top-right", "bottom-left", "bottom-right")
GROUPS = ("cpu", "gpu", "mem", "battery", "fan")

DEFAULTS: Dict[str, Any] = {
    "interval_ms": 1000,
    "show": {g: True for g in GROUPS},
    "overlay": {"enabled": False, "position": "top-left", "compact": True},
}


def sanitize(raw: Any) -> Dict[str, Any]:
    out = json.loads(json.dumps(DEFAULTS))
    if not isinstance(raw, dict):
        return out
    if raw.get("interval_ms") in INTERVALS:
        out["interval_ms"] = raw["interval_ms"]
    show = raw.get("show")
    if isinstance(show, dict):
        for g in GROUPS:
            if isinstance(show.get(g), bool):
                out["show"][g] = show[g]
    ov = raw.get("overlay")
    if isinstance(ov, dict):
        for k in ("enabled", "compact"):
            if isinstance(ov.get(k), bool):
                out["overlay"][k] = ov[k]
        if ov.get("position") in POSITIONS:
            out["overlay"]["position"] = ov["position"]
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
