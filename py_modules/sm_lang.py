"""Steam UI language, read from Steam's own registry file (specs/008 REQ-509)."""
import os
import re
from typing import List, Optional

_LANG = re.compile(r'"language"\s+"([^"]+)"')


def registry_paths(home: str) -> List[str]:
    return [
        os.path.join(home, ".steam/registry.vdf"),
        os.path.join(home, ".steam/steam/registry.vdf"),
        os.path.join(home, ".local/share/Steam/registry.vdf"),
    ]


def steam_language(home: str) -> Optional[str]:
    """Raw value Steam stores (e.g. 'brazilian', 'spanish', 'english'), or None."""
    for path in registry_paths(home):
        try:
            with open(path, "r", errors="ignore") as f:
                m = _LANG.search(f.read())
        except OSError:
            continue
        if m:
            return m.group(1).strip().lower()
    return None
