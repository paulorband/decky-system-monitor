import json

import sm_settings as settings


def test_defaults_and_sanitize():
    assert settings.sanitize(None) == settings.DEFAULTS
    s = settings.sanitize({"interval_ms": 3, "show": {"cpu": False, "x": 1, "gpu": "no"}})
    assert s["interval_ms"] == 1000 and s["show"]["cpu"] is False and s["show"]["gpu"] is True
    assert s["auto_check"] is True
    assert settings.sanitize({"auto_check": False})["auto_check"] is False
    assert settings.sanitize({"auto_check": "no"})["auto_check"] is True
    assert "overlay" not in s  # removed feature: stale keys in old files are dropped
    assert settings.sanitize({"overlay": {"enabled": True}}) == settings.DEFAULTS


def test_roundtrip_atomic_and_corrupt(tmp_path):
    p = str(tmp_path / "sub" / "settings.json")
    saved = settings.save(p, {"interval_ms": 2000})
    assert settings.load(p) == saved and saved["interval_ms"] == 2000
    with open(p, "w") as f:
        f.write("{not json")
    assert settings.load(p) == settings.DEFAULTS
    assert json.loads(json.dumps(settings.DEFAULTS))  # defaults not mutated
