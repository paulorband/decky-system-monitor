import json

import settings


def test_defaults_and_sanitize():
    assert settings.sanitize(None) == settings.DEFAULTS
    s = settings.sanitize({"interval_ms": 3, "show": {"cpu": False, "x": 1, "gpu": "no"},
                           "overlay": {"enabled": True, "position": "mid"}})
    assert s["interval_ms"] == 1000 and s["show"]["cpu"] is False and s["show"]["gpu"] is True
    assert s["overlay"]["enabled"] is True and s["overlay"]["position"] == "top-left"


def test_roundtrip_atomic_and_corrupt(tmp_path):
    p = str(tmp_path / "sub" / "settings.json")
    saved = settings.save(p, {"interval_ms": 2000})
    assert settings.load(p) == saved and saved["interval_ms"] == 2000
    with open(p, "w") as f:
        f.write("{not json")
    assert settings.load(p) == settings.DEFAULTS
    assert json.loads(json.dumps(settings.DEFAULTS))  # defaults not mutated
